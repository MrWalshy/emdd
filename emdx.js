import { DocArgsPlugin } from './src/plugins.js';
import Parser from './src/Parser.js';
import Tokeniser from './src/Tokeniser.js';

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
