import { readFileSync, writeFileSync, existsSync, cpSync, mkdirSync } from 'fs';
import path from 'path';
import Parser from '../Parser.js';
import Tokeniser from '../Tokeniser.js';
import Transpiler, { DocumentArgumentsTransformer, HtmlDocumentTransformer, JSTransformer, LiteralTransformer, TemplatePreProcessor, WeaveTemplatePlugin } from '../Transpiler.js';
import { createDirectory, getPathsOfType } from "../utils/file.js";
import { deepLog } from '../utils/logging.js';

export default class EmddSiteGenerator {
    _weaver;
    _templateProcessor;
    _preamble;
    _postamble;

    constructor() {
        this._weaver = new WeaveTemplatePlugin();
        this._templateProcessor = new TemplatePreProcessor(this._weaver);
        this._preamble = "";
        this._postamble = "";
    }

    generateFromConfig(config) {
        // drop and create output directory
        // createDirectory(config.)
        // deepLog(config)
        console.log("@ DOING: Creating build directory")
        createDirectory(config.outputDirectory, true, true);
        console.log("@ DONE: Creating build directory");
        // recursively copy all supported file types
        console.log("@ DOING: Copying files of supported types to build directory");
        this.copySupportedFileTypes(config);
        console.log("@ DONE: Copying files of supported types to build directory");
        // preload templates
        if (config.templateDirectories) {
            console.log("@ DOING: Loading templates");
            this.loadTemplates(config);
            console.log("@ DONE: Loading templates");
        }
        // prepare the preamble and postamble
        if (config.preambleLocation) {
            const preamblePath = path.resolve(path.dirname(config.configLocation), config.preambleLocation);
            this._preamble = readFileSync(preamblePath, "utf-8");
        }
        if (config.postambleLocation) {
            const postamblePath = path.resolve(path.dirname(config.configLocation), config.postambleLocation);
            this._postamble = readFileSync(postamblePath, "utf-8");
        }
        // transpile and copy all .emdd files
        console.log("@ DOING: Transpiling .emdd to .html and copying to build directory");
        this.transpileAndCopyEmddToHtmlFiles(config);
        console.log("@ DONE: Transpiling .emdd to .html and copying to build directory");
    }

    loadTemplates(config) {
        let templateFiles = [];
        config.templateDirectories.forEach(templateDirectory => {
            const dir = path.resolve(path.dirname(config.configLocation), templateDirectory);
            console.log("@ INFO: Scanning '" + dir + "' for templates");
            templateFiles.push(...getPathsOfType("emdd", dir));
        });
        if (!templateFiles) {
            console.log("@ INFO: No template files found");
            return;
        }
        // load the data in the template files, parse it and add to the weavers templates
        templateFiles.forEach(file => {
            console.log("@ INFO: Loading data from '" + file + "'");
            const data = readFileSync(file, "utf-8");
            const tokeniser = new Tokeniser(data, ["template"]);
            const parser = new Parser(tokeniser.tokenise());
            const blocks = parser.parse();
            console.log("@ INFO: Loading templates into template weaver");
            blocks.forEach(block => this._weaver.addTemplate(block));
            // deepLog(this._weaver._templates);
        });
    }

    /**
     * Transpiles .emdd files to HTML and copies them to their build location.
     * @param {*} config 
     */
    transpileAndCopyEmddToHtmlFiles(config) {
        // get files to transpile
        let filesToTranspile = getPathsOfType("emdd", path.dirname(config.configLocation));
        const templateDirectories = config.templateDirectories.map(dir => path.resolve(path.dirname(config.configLocation), dir));
        filesToTranspile = filesToTranspile.filter(file => {
            // get the simple directory name only of the file
            let fileDir = path.dirname(file).split(path.sep);
            fileDir = fileDir[fileDir.length - 1];
            for (const templateDirectory of templateDirectories) {
                // get the simple directory name of the template directory only
                let dir = templateDirectory.split(path.sep);
                dir = dir[dir.length - 1];
                if (fileDir === dir) return false; // exclude templates from copying
            }
            return true;
        });

        // transpile each file in preparation to create the files
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

        // create the files with the transpile content in them
        filesToCreate.forEach(file => {
            console.log("@ STATUS: Creating '" + file.relativeFilePath + "' in build directory");
            const outputLocation = path.resolve(path.dirname(config.configLocation), config.outputDirectory);
            const targetLocation = path.resolve(outputLocation, file.relativeFilePath.substring(1));
            if (!existsSync(path.dirname(targetLocation))) mkdirSync(path.dirname(targetLocation), { recursive: true });
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
        let filesToCopy = [];
        config.supportedFileTypes.forEach(type => {
            filesToCopy.push(...getPathsOfType(type, path.dirname(config.configLocation)));
        });
        
        // remove postamble and preamble files
        if (config.preambleLocation || config.postambleLocation) {
            const preamblePath = path.resolve(path.dirname(config.configLocation), config.preambleLocation);
            const postamblePath = path.resolve(path.dirname(config.configLocation), config.postambleLocation);
            filesToCopy = filesToCopy.filter(file => file !== preamblePath && file !== postamblePath);
        }

        // copy each file
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
                return new HtmlDocumentTransformer(this._preamble, this._postamble);
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
            case "template":
                return this._templateProcessor;
            case "weave":
                return this._weaver;
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
    get templateDirectories() { return this._src.templates; }
    get preambleLocation() { return this._src.preamble; }
    get postambleLocation() { return this._src.postamble; }
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