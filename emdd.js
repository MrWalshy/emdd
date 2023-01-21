import { copyFileSync, cpSync, existsSync, fstat, mkdirSync, readdirSync, readFileSync, rm, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Parser from './src/Parser.js';
import Tokeniser from './src/Tokeniser.js';
import Transpiler, { DocumentArgumentsTransformer, HtmlDocumentTransformer, JSTransformer, LiteralTransformer } from './src/Transpiler.js';
import { deepLog } from './src/utils/logging.js';
import glob from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createDirectory(dir, dropIfExists = false, recursive = false) {
    const dirExists = existsSync(dir);
    if (dirExists && !dropIfExists) return;
    if (dirExists && dropIfExists) rmSync(dir, { force: true, recursive: recursive });
    mkdirSync(dir, { recursive: recursive });
    console.log(`Created directory with configuration:
             dir: ${dir}
    dropIfExists: ${dropIfExists}
       recursive: ${recursive}`);
}

function getPathsOfType(type, dir, recursive=true) {
    console.log("Getting paths of type '" + type + "' from '" + dir + "'");
    
    const files = getFiles(dir);
    const filesOfType = files.filter(file => path.extname(file.name) === `.${type}`)
                             .map(file => path.resolve(dir, file.name));
                            //  .map(file => file.name);
    if (recursive) {
        // get nested files
        const nestedFiles = files.filter(file => file.isDirectory())
                             .map(nestedDir => getPathsOfType(type, path.resolve(dir, nestedDir.name)))
                             .filter(files => files.length > 0);
        // if nested file is an array, push its spread into matching filesOfType x
        // otherwise push the name of the file and its directories relative to teh config
        if (nestedFiles.length > 0) nestedFiles.forEach(nestedFile => {
            console.log("NESTED: " + nestedFile)
            console.log("DIR: " + dir);
            console.log()
            if (nestedFile.length) filesOfType.push(...nestedFile);
            else filesOfType.push(nestedFile);
        });
    }
    return filesOfType;
}

function getFiles(dir) {
    return readdirSync(dir, { withFileTypes: true });
}

class CommandArgumentError extends Error {
    constructor(message) {
        super(message);
    }
}

function getCommandArgs() {
    const args = {};
    process.argv.slice(2, process.argv.length)
                .forEach(addArg);
     
    function addArg(arg) {
        if (arg.slice(0, 2) === "--") {
            const longArg = arg.split("=");
            const flag = longArg[0].slice(2, longArg[0].length); // before the `=`
            const value = longArg[0].length > 1 ? longArg[1] : true; // after the `=`
            args[flag] = value;
        } else if (arg[0] === '-') {
            const flags = arg.slice(1, arg.length).split(""); // after the `-`
            flags.forEach(flag => args[flag] = true);
        } else throw new CommandArgumentError("(200): Malformed argument '" + arg + "' supplied.");
    }
    return args;
}

/**
 * Logs a single-line title to the console with the given space around the content.
 * 
 * @param {*} content 
 * @param {*} space 
 */
function logTitleBlock(content, space) {
    const lineLength = content.length + (space * 2);
    const decorativeLine = "=".repeat(lineLength + 6);
    const contentLine = `===${" ".repeat(space)}${content}${" ".repeat(space)}===`;
    console.log(`${decorativeLine}
${contentLine}
${decorativeLine}`);
}

class EmddSiteGenerator {
    generateFromConfig(config) {
        console.log("Acquiring plugins...");
        const documentPlugin = this.getDocumentPlugin(config.outputType);
        const contentPlugins = this.getContentPlugins(config.contentPluginTypes);
        return this.generate(config, documentPlugin, contentPlugins);
    }

    generate(config, docPlugin, contentPlugins) {
        // drop and create output directory
        // createDirectory(config.)
        createDirectory(config.outputDirectory, true, true);
        // recursively copy all supported file types
        this.copySupportedFileTypes(config);
        // transpile and copy all .emdd files
    }

    transpile(src, config, docPlugin, contentPlugins) {
        const tokeniser = new Tokeniser(src, config.contentPluginTypes);
        const parser = new Parser(tokeniser.tokenise());
        const transpiler = new Transpiler(contentPlugins);
        return transpiler.transpile(parser.parse(), docPlugin);
    }

    copySupportedFileTypes(config) {
        const filesToCopy = [];
        config.supportedFileTypes.forEach(type => {
            filesToCopy.push(...getPathsOfType(type, path.dirname(config.configLocation)));
        });
        
        filesToCopy.forEach(file => {
            const relativePath = file.split(path.dirname(config.configLocation))[1];
            const outputLocation = path.resolve(path.dirname(config.configLocation), config.outputDirectory);
            const targetLocation = path.resolve(outputLocation, relativePath.substring(1));
            // copyFileSync(file, targetLocation);
            cpSync(file, targetLocation);
        });
    }

    getDocumentPlugin(type) {
        console.log("Acquiring document plugin of type: " + type);
        switch (type) {
            case "html5":
                return new HtmlDocumentTransformer();
            default:
                throw new SiteConfigurationError("(301): Invalid document type supplied");
        }
    }

    getContentPlugins(types) {
        console.log("Acquiring content plugins: " + types);
        const plugins = [];
        types.forEach(type => plugins.push(this.getContentPlugin(type)));
        return plugins;
    }

    getContentPlugin(type) {
        console.log("Acquiring content plugin of type: " + type);
        switch (type) {
            case "js":
                return new JSTransformer();
            case "lit":
                return new LiteralTransformer();
            case "docArgs":
                return new DocumentArgumentsTransformer();
            default:
                throw new SiteConfigurationError("(302): Invalid content plugin type '" + type + "' supplied");
        }
    }
}

class EmddSiteConfiguration {
    _output;
    _src;
    _contentPlugins;
    _config;

    constructor(output = {}, src = {}, contentPlugins = [], configLocation) {
        this._output = output;
        this._src = src;
        this._contentPlugins = contentPlugins;
        this._config = {
            location: configLocation
        }
    }

    get outputType() { return this._output.type; }
    get outputDirectory() { return path.resolve(path.dirname(this.configLocation), this._output.directory); }
    get entrypoint() { return this._src.entrypoint; }
    get supportedFileTypes() { return this._src.copyFilesOfType; }
    get contentPluginTypes() { return this._contentPlugins; }
    get configLocation() { return this._config.location; }
}

class SiteConfigurationError extends Error {
    constructor(message) {
        super(message);
    }
}

function loadSiteConfiguration(configPath) {
    const fullPath = path.resolve(configPath);
    try {
        const configData = readFileSync(configPath, "utf-8");
        const config = JSON.parse(configData);
        return new EmddSiteConfiguration(config.output, config.src, config.contentPlugins, fullPath);
    } catch (error) {
        throw new SiteConfigurationError("(300): Failed to load configuration from '" + fullPath + "'");
    }
}

try {
    logTitleBlock("Extensible Markdown Documents (.emdd)", 4);
    const args = getCommandArgs();
    if (!args.config) throw new CommandArgumentError("(201): '--config=<FILE_PATH>' required");
    const configuration = loadSiteConfiguration(args.config);
    const emddSiteGenerator = new EmddSiteGenerator();
    emddSiteGenerator.generateFromConfig(configuration);
} catch (error) {
    console.log();
    logTitleBlock("WARNING!", 18);
    console.error(error.message);
    process.exit(1);
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