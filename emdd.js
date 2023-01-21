import { copyFileSync, cpSync, existsSync, fstat, mkdirSync, readdirSync, readFileSync, rm, rmSync, writeFileSync } from 'fs';
import path from 'path';
import Parser from './src/Parser.js';
import Tokeniser from './src/Tokeniser.js';
import Transpiler, { DocumentArgumentsTransformer, HtmlDocumentTransformer, JSTransformer, LiteralTransformer } from './src/Transpiler.js';
import { deepLog } from './src/utils/logging.js';

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
        // drop and create output directory
        // createDirectory(config.)
        createDirectory(config.outputDirectory, true, true);
        // recursively copy all supported file types
        this.copySupportedFileTypes(config);
        // transpile and copy all .emdd files
        this.transpileAndCopyEmddToHtmlFiles(config);
    }

    /**
     * Transpiles .emdd files to HTML and copies them to their build location.
     * @param {*} config 
     */
    transpileAndCopyEmddToHtmlFiles(config) {
        const filesToTranspile = getPathsOfType("emdd", path.dirname(config.configLocation));
        const filesToCreate = [];
        filesToTranspile.forEach(filePath => {
            let relativePath = filePath.split(path.dirname(config.configLocation))[1];
            filesToCreate.push({
                relativeFilePath: relativePath.replace(".emdd", ".html"),
                content: this.transpile(readFileSync(filePath, "utf-8"), config)
            });
        });
        filesToCreate.forEach(file => {
            const outputLocation = path.resolve(path.dirname(config.configLocation), config.outputDirectory);
            const targetLocation = path.resolve(outputLocation, file.relativeFilePath.substring(1));
            writeFileSync(targetLocation, file.content);
        });
        // deepLog(filesToTranspile);
        // deepLog(filesToCreate);
    }

    transpile(src, config) {
        const tokeniser = new Tokeniser(src, config.contentPluginTypes);
        const tokens = tokeniser.tokenise();
        const parser = new Parser(tokens);
        const blocks = parser.parse();
        deepLog(blocks);
        const transpiler = new Transpiler(this.getContentPlugins(config.contentPluginTypes));
        return transpiler.transpile(blocks, this.getDocumentPlugin(config.outputType));
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