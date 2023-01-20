import { DocArgsPlugin, HtmlDocTypePlugin, JSPlugin, LiteralPlugin } from './src/plugins.js';
import Parser from './src/Parser.js';
import Tokeniser from './src/Tokeniser.js';
import { copyFileSync, existsSync, fstat, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';

export default class EMDX {
    _plugins;
    _documentArgs

    constructor(plugins=[]) {
        this._plugins = plugins;
        this._plugins.push(new DocArgsPlugin());
    }

    registerPlugin(plugin) {
        this._plugins.push(plugin);
    }

    transpile(src, transformArgs = {}, docTypePlugin = null) {
        // tokenise source
        const tokeniser = new Tokeniser(src, this._plugins.map(plugin => plugin.name));
        const tokens = tokeniser.tokenise();

        // parse tokens into string output
        const parser = new Parser(tokens, this._plugins, src);
        const parserOutput = parser.parse();

        // return just the parsed output
        if (!docTypePlugin) return parserOutput.trim();

        // transformer present, output transformed document
        const output = docTypePlugin.transform(parserOutput, parser.documentArgs || transformArgs);
        return output;
    }
}

export class EmdxHtmlGenerator {
    _config;
    _htmlTransformerPlugin;
    _emdx;

    constructor(configPath) {
        this._config = JSON.parse(readFileSync(path.resolve(configPath), "utf-8"));
        this._config.project_location = path.dirname(path.resolve(configPath));
        this._config.output_location = path.resolve(this._config.project_location, this._config.output.location);
        this._emdx = new EMDX([new LiteralPlugin(), new JSPlugin()]);
        this._htmlTransformerPlugin = new HtmlDocTypePlugin();
    }

    generateFromFile(file) {
        const fileLocation = path.resolve(this._config.project_location, file.location);
        const outputLocation = path.resolve(this._config.output_location, file.name.split(".")[0] + ".html");

        // read and transpile file
        const content = readFileSync(path.resolve(this._config.project_location, file.location, file.name), "utf-8");
        const transpiledContent = this._emdx.transpile(content, null, this._htmlTransformerPlugin);

        // output the transpiled html file
        writeFileSync(outputLocation, transpiledContent, { encoding: "utf-8" });

        // output any linked static resource
        const { links, scripts } = this._htmlTransformerPlugin.previousArgs;
        const resources = [...links, ...scripts];
        resources.forEach(resource => {
            const resourceLocation = path.resolve(fileLocation, resource);
            const resourceOutputLocation = path.resolve(this._config.output_location, resource);
            if (!existsSync(path.dirname(resourceOutputLocation))) mkdirSync(path.dirname(resourceOutputLocation), { recursive: true });
            copyFileSync(resourceLocation, resourceOutputLocation);
        });
    }

    generate() { 
        // drop and recreate output location before build
        if (existsSync(this._config.output_location)) rmSync(this._config.output_location, {
            recursive: true,
            force: true
        });
        mkdirSync(this._config.output_location, { recursive: true });
        this._config.files.forEach(this.generateFromFile.bind(this)); 
    }

}