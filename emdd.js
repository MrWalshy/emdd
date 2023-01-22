#!/usr/bin/env node
import EmddSiteGenerator, { loadSiteConfiguration } from "./src/app/EmddSiteGenerator.js";
import { logTitleBlock } from "./src/utils/logging.js";
import Parser from "./src/Parser.js";
import Tokeniser from "./src/Tokeniser.js";
import Token from "./src/Token.js";
import Transpiler from "./src/Transpiler.js";
import types from "./src/utils/types.js";

export * from './src/Parser.js';
export * from './src/Token.js';
export * from './src/Tokeniser.js';
export * from './src/Transpiler.js';
export * from './src/app/EmddSiteGenerator.js';
export * from './src/utils/file.js';
export * from './src/utils/logging.js';
export { Parser, Token, Tokeniser, Transpiler, EmddSiteGenerator, types };

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

try {
    logTitleBlock("Extensible Markdown Documents (.emdd)", 4);
    const args = getCommandArgs();
    // if (!args.config) throw new CommandArgumentError("(201): '--config=<FILE_PATH>' required");
    if (args.config) {
        const configuration = loadSiteConfiguration(args.config);
        const emddSiteGenerator = new EmddSiteGenerator();
        emddSiteGenerator.generateFromConfig(configuration);
    }
} catch (error) {
    console.log();
    logTitleBlock("FATAL WARNING!", 12);
    console.error(error.message);
    process.exit(1);
}