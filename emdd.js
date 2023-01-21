import { copyFileSync, existsSync, fstat, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';

console.log(`=============================================================
===         Extensible Markdown Documents (.emdd)         ===
=============================================================

    Command-line functionality coming soon...`);

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