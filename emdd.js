#!/usr/bin/env node
import EmddSiteGenerator, { loadSiteConfiguration } from "./src/app/EmddSiteGenerator.js";
import { logTitleBlock } from "./src/utils/logging.js";
import Parser from "./src/Parser.js";
import Tokeniser from "./src/Tokeniser.js";
import Token from "./src/Token.js";
import Transpiler from "./src/Transpiler.js";
import types from "./src/utils/types.js";
import DocumentProcessor from "./src/plugins/document_processors/DocumentProcessor.js";
import ContentProcessor from "./src/plugins/content_processors/ContentProcessor.js";
import PreProcessor from "./src/plugins/pre_processors/PreProcessor.js";
import PostProcessor from "./src/plugins/post_processors/PostProcessor.js";
import DocumentArgumentsProcessor from "./src/plugins/content_processors/DocumentArgumentsProcessor.js";
import HtmlDocumentProcessor from "./src/plugins/document_processors/HtmlDocumentProcessor.js";
import JSProcessor from "./src/plugins/content_processors/JSProcessor.js";
import LiteralProcessor from "./src/plugins/content_processors/LiteralProcessor.js";
import TemplatePreProcessor from "./src/plugins/pre_processors/TemplatePreProcessor.js";
import WeaveProcessor from "./src/plugins/content_processors/WeaveProcessor.js";
import HtmlTocContentProcessor from "./src/plugins/content_processors/HtmlTocContentProcessor.js";
import HtmlTocPostProcessor from "./src/plugins/post_processors/HtmlTocPostProcessor.js";

export * from './src/Parser.js';
export * from './src/Token.js';
export * from './src/Tokeniser.js';
export * from './src/Transpiler.js';
export * from './src/app/EmddSiteGenerator.js';
export * from './src/utils/file.js';
export * from './src/utils/logging.js';
export { 
    Parser, Token, Tokeniser, Transpiler, EmddSiteGenerator, types,
    DocumentProcessor, ContentProcessor, PreProcessor, PostProcessor,
    DocumentArgumentsProcessor, HtmlDocumentProcessor, JSProcessor, LiteralProcessor,
    TemplatePreProcessor, WeaveProcessor,
    HtmlTocContentProcessor, HtmlTocPostProcessor
};

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
        // } else throw new CommandArgumentError("(200): Malformed argument '" + arg + "' supplied.");
        } else args[arg] = true;
    }
    return args;
}

try {
    logTitleBlock("Extensible Markdown Documents (.emdd)", 4);
    const args = getCommandArgs();
    // if (!args.config) throw new CommandArgumentError("(201): '--config=<FILE_PATH>' required");
    switch (process.argv[2]) {
        case "site":
            if (args.config) new EmddSiteGenerator().generateFromConfig(loadSiteConfiguration(args.config));
            break;
    }
} catch (error) {
    console.log();
    logTitleBlock("FATAL WARNING!", 12);
    console.error(error.message);
    process.exit(1);
}