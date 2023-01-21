import { readFileSync, writeFileSync, existsSync, cpSync } from 'fs';
import path from 'path';
import Parser from '../Parser.js';
import Tokeniser from '../Tokeniser.js';
import Transpiler, { DocumentArgumentsTransformer, HtmlDocumentTransformer, JSTransformer, LiteralTransformer } from '../Transpiler.js';
import { createDirectory, getPathsOfType } from "../utils/file.js";

export default class EmddSiteGenerator {
    generateFromConfig(config) {
        // drop and create output directory
        // createDirectory(config.)
        console.log("@ DOING: Creating build directory")
        createDirectory(config.outputDirectory, true, true);
        console.log("@ DONE: Creating build directory");
        // recursively copy all supported file types
        console.log("@ DOING: Copying files of supported types to build directory");
        this.copySupportedFileTypes(config);
        console.log("@ DONE: Copying files of supported types to build directory");
        // transpile and copy all .emdd files
        console.log("@ DOING: Transpiling .emdd to .html and copying to build directory");
        this.transpileAndCopyEmddToHtmlFiles(config);
        console.log("@ DONE: Transpiling .emdd to .html and copying to build directory");
    }

    /**
     * Transpiles .emdd files to HTML and copies them to their build location.
     * @param {*} config 
     */
    transpileAndCopyEmddToHtmlFiles(config) {
        const filesToTranspile = getPathsOfType("emdd", path.dirname(config.configLocation));
        const filesToCreate = [];
        filesToTranspile.forEach(filePath => {
            console.log("@ STATUS: About to transpile '" + filePath + "'");
            let relativePath = filePath.split(path.dirname(config.configLocation))[1];
            filesToCreate.push({
                relativeFilePath: relativePath.replace(".emdd", ".html"),
                content: this.transpile(readFileSync(filePath, "utf-8"), config)
            });
            console.log("@ STATUS: Transpiled '" + filePath + "'");
        });
        filesToCreate.forEach(file => {
            console.log("@ STATUS: Creating '" + file.relativeFilePath + "' in build directory");
            const outputLocation = path.resolve(path.dirname(config.configLocation), config.outputDirectory);
            const targetLocation = path.resolve(outputLocation, file.relativeFilePath.substring(1));
            writeFileSync(targetLocation, file.content);
            console.log("@ STATUS: Created '" + file.relativeFilePath + "' in build directory: " + targetLocation);
        });
        // deepLog(filesToTranspile);
        // deepLog(filesToCreate);
    }

    transpile(src, config) {
        const tokeniser = new Tokeniser(src, config.contentPluginTypes);
        const tokens = tokeniser.tokenise();
        const parser = new Parser(tokens);
        const blocks = parser.parse();
        // deepLog(blocks);
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
            // copyFileSync(file, targetLocation); // doesn't work
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
        // console.log("Acquiring content plugin of type: " + type);
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

export class EmddSiteConfiguration {
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

export class SiteConfigurationError extends Error {
    constructor(message) {
        super(message);
    }
}

export function loadSiteConfiguration(configPath) {
    const fullPath = path.resolve(configPath);
    try {
        const configData = readFileSync(configPath, "utf-8");
        const config = JSON.parse(configData);
        return new EmddSiteConfiguration(config.output, config.src, config.contentPlugins, fullPath);
    } catch (error) {
        throw new SiteConfigurationError("(300): Failed to load configuration from '" + fullPath + "'");
    }
}