import { BlockType, UnifiedMarkdownParser } from "./Parser.js";
import types from './utils/types.js';

export default class Transpiler {
    _contentTransformerPlugins;
    _documentArgs;
    _markdownParser;

    constructor(contentTransformerPlugins, markdownParser = new UnifiedMarkdownParser()) {
        this._contentTransformerPlugins = contentTransformerPlugins;
        this._markdownParser = markdownParser;
        this._documentArgs = {};
    }

    /**
     * Returns the string result of transpilation.
     * @param {*} block 
     * @returns 
     */
    transpileBlock(block) {
        if (block.type === BlockType.MARKDOWN) return this.transpileMarkdown(block);
        else if (block.type === BlockType.PLUGIN || block.type === BlockType.INLINE_PLUGIN) return this.transpilePlugin(block);
        else throw new TranspilerError("Error (4): Unrecognised block transpilation target.");
    }

    transpileMarkdown(block) {
        let output = "";
        block.value.forEach(src => {
            if (types.get(src) === types.string) output += src;
            else if (types.get(src) === types.object) output += this.transpileBlock(src);
            else throw new TranspilerError("Error (3): Unrecognised Markdown transpilation target.");
        });
        return this._markdownParser.parse(output);
    }

    transpilePlugin(block) {
        const plugin = this._contentTransformerPlugins.find(plugin => plugin.name === block._identifier);
        if (!plugin) throw new TranspilerError(`Error (4): Plugin not found for ${block._identifier}`);
        if (plugin.name === "docArgs") this._documentArgs = plugin.transform(block);
        else return plugin.transform(block);
        return "";
    }

    transpile(blocks = [], documentTransformerPlugin) {
        let output = "";
        blocks.forEach(block => output += this.transpileBlock(block));
        if (documentTransformerPlugin) return documentTransformerPlugin.transform(output, this._documentArgs);
        return output;
    }
}

export class TranspilerError extends Error {
    constructor(message) {
        super(message);
    }
}

export class ContentTransformerPlugin {
    _name;
    _parameters;

    constructor(name="", parameters=[]) {
        this._name = name;
        this._parameters = parameters;
    }

    get name() { return this._name; }
    set name(name) { this._name = name; }
    get parameters() { return this._parameters; }
    set parameters(parameters) { this._parameters = parameters; }

    /**
     * Parses the given block, returning a string.
     * 
     * May have side effects.
     * @param {*} block 
     */
    transform(block) {
        throw UnimplementedError("Not implemented: Plugin unable to parse @ block");
    }
}

export class DocumentTransformerPlugin {
    /**
     * Transforms the given content into a document such as React component or HTML document.
     * @param {*} content 
     * @param {*} args 
     */
     transform(src, args) {
        throw Error("Not implemented: Plugin unable to transform document");
    }
}

export class HtmlDocumentTransformer extends DocumentTransformerPlugin {
    transform(src, args) {
        const argMap = this._validateArgs(args);
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${argMap.title}
    ${argMap.links.join("\n" + " ".repeat(4)) || ""}
</head>
<body>
    ${src}
    ${argMap.scripts.join("\n" + " ".repeat(4)) || ""}
</body>
</html>
`;
    }

    _validateArgs(args) {
        const argMap = {
            links: [],
            scripts: []
        };

        // page title
        if (!args.title) {
            console.warn("WARNING: No <title> provided");
            argMap.title = "<title>Placeholder</title>";
        } else argMap.title = `<title>${args.title}</title>`;

        // page links
        if (!args.links) console.warn("WARNING: No links provided, embedding and inline CSS can be messy...");
        else argMap.links = args.links.map(arg => `<link rel="stylesheet" href="${arg}" />`);

        if (!args.scripts) console.warn("WARNING: No scripts provided, embedded and inline JS can be messy...");
        else argMap.scripts = args.scripts.map(arg => `<script src="${arg}"></script>`);

        return argMap;
    }
}


export class JSTransformer extends ContentTransformerPlugin {

    // Shared context between parses
    _context = {};

    constructor() {
        super("js")
    }

    transform(block) {
        return Function("context", block.value)(this._context);
    }
}

export class LiteralTransformer extends ContentTransformerPlugin {
    constructor() {
        super("lit")
    }

    transform(block) {
        return block.value;
    }
}

/**
* Internal plugin for passing arguments from a document to a DocTypePlugin's transform method.
*/
export class DocumentArgumentsTransformer extends ContentTransformerPlugin {
    constructor() {
        super("docArgs");
    }
 
    transform(block) {
        try {
            return JSON.parse(block.value);
        } catch (e) {
            console.warn(e);
            return {};
        }
    }
}