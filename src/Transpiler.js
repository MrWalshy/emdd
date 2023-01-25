import { BlockType, UnifiedMarkdownParser } from "./Parser.js";

export default class Transpiler {
    _contentTransformerPlugins;
    _preProcessors;
    _documentArgs;
    _markdownParser;

    constructor(contentTransformerPlugins = [], preProcessors = [], markdownParser = new UnifiedMarkdownParser()) {
        this._contentTransformerPlugins = contentTransformerPlugins;
        this._preProcessors = preProcessors;
        this._markdownParser = markdownParser;
        this._documentArgs = {};
    }

    /**
     * Returns the string result of transpilation.
     * @param {*} block 
     * @returns 
     */
    transpileBlock(block) {
        if (block.type === BlockType.MARKDOWN) return this.transpileMarkdown(block).trim();
        else if (block.type === BlockType.PLUGIN || block.type === BlockType.INLINE_PLUGIN) return this.transpilePlugin(block);
        else if (block.type === BlockType.VALUE) return block.value;
        else throw new TranspilerError("Error (4): Unrecognised block transpilation target.");
    }

    transpileMarkdown(block) {
        // transpile each block, there might be nested inline plugin(s)
        // let output = [];
        // block.value.forEach(child => {
        //     output.push({ type: child.type, value: this.transpileBlock(child) });
        // });
        // // only parse the markdown
        // // - inline plugins have already been transpiled and content is ready
        // const parsedOutput = [];
        // for (const target of output) {
        //     if (target.type === BlockType.INLINE_PLUGIN) parsedOutput.push(target.value);
        //     else parsedOutput.push(this._markdownParser.parse(target.value));
        // }
        // return parsedOutput.join("");
        let output = "";
        block.value.forEach(child => output += this.transpileBlock(child));
        return this._markdownParser.parse(output);
    }

    transpilePlugin(block) {
        const plugin = this._contentTransformerPlugins.find(plugin => plugin.name === block.identifier);
        if (!plugin) throw new TranspilerError(`Error (5): Plugin not found for ${block._identifier}`);
        if (plugin.name === "docArgs") {
            this._documentArgs = plugin.transform(block);
            return "";
        }
        else return plugin.transform(block);
    }

    transpile(blocks = [], documentTransformerPlugin) {
        const processedBlocks = this.preProcess(blocks);
        let output = "";
        processedBlocks.forEach(block => output += this.transpileBlock(block));
        if (documentTransformerPlugin) return documentTransformerPlugin.transform(output, this._documentArgs);
        return output;
    }

    preProcess(blocks) {
        const output = [];
        if (this._preProcessors.length === 0) return blocks;
        blocks.forEach(block => {
            const preProcessor = this._preProcessors.find(processor => processor.name === block.identifier);
            if (!preProcessor) output.push(block);
            else {
                const preProcessedBlock = preProcessor.transform(block);
                if (preProcessedBlock) output.push(block);
            }
        });
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
    _preProcess;

    constructor(name = "", parameters = [], preProcess = false) {
        this._name = name;
        this._parameters = parameters;
        this._preProcess = preProcess;
    }

    get name() { return this._name; }
    set name(name) { this._name = name; }
    get parameters() { return this._parameters; }
    set parameters(parameters) { this._parameters = parameters; }

    isPreProcessor() { return this._preProcess; }

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

export class PreProcessingContentPlugin extends ContentTransformerPlugin {
    constructor(name = "", parameters = []) {
        super(name, parameters, true);
    }

    // Don't return anything from `transform()` if the pre-processor removes
    // a block, otherwise return the pre-processed block
}

export class TemplatePreProcessor extends PreProcessingContentPlugin {
    _weaver;

    /**
     * 
     * @param {WeaveTemplatePlugin} weaver 
     */
    constructor(weaver) {
        super("template", ["name", "args", "type"]);
        this._weaver = weaver;
    }

    transform(block) {
        this._weaver.addTemplate(block);
        return "";
    }
}

export class WeaveTemplatePlugin extends ContentTransformerPlugin {
    _templates;

    constructor() {
        super("weave", ["name", "argsType"]);
        this._templates = {};
    }

    transform(block) {
        const weaveNameParam = block.parameters.find(param => param.name === "name");
        if (!weaveNameParam) throw new Error("Template weave parameter 'name' not supplied");
        const template = this._templates[weaveNameParam.value];
        if (!template) throw new Error("Could not find template with name '" + weaveNameParam.value + "'");
        if (block.type === BlockType.INLINE_PLUGIN) return this.weaveInline(block, template);
        const weaveArgs = JSON.parse(`{${block.value.value}}`);
        return this.weave(template, weaveArgs);
    }

    addTemplate(block) {
        const templateNameParameter = block.parameters.find(param => param.name === "name");
        if (!templateNameParameter) throw new Error("Cannot create nameless template");
        this._templates[templateNameParameter.value] = block;
    }

    weave(templateBlock, weaveArgs) {
        // expected params of template
        let expectedParams = templateBlock.parameters.find(param => param.name === "args");
        if (expectedParams) expectedParams = expectedParams.length === 0 ? [] : expectedParams.value.split(" ");
        
        // prepare output
        let output = templateBlock.value.value;
        if (expectedParams) expectedParams.forEach(param => output = output.replace(`@${param};`, weaveArgs[param] || ""));

        return output;
    }

    weaveInline(block, template) {
        // capture reserved parameter 'name', every other param is a weave arg
        const weaveArgs = {};
        const params = block.parameters.filter(param => param.name !== "name");
        for (const param of params) {
            weaveArgs[param.name] = param.value;
        }
        return this.weave(template, weaveArgs);
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
    _preamble;
    _postamble;

    constructor(preamble = "", postamble = "") {
        super();
        this._preamble = preamble;
        this._postamble = postamble;
    }

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
    ${this._preamble}
    ${src}
    ${this._postamble}
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

    _context = {};

    constructor() {
        super("js")
    }

    transform(block) {
        if (block.type === BlockType.INLINE_PLUGIN) {
            const valueParam = block.parameters.find(param => param.name === "value");
            if (!valueParam) throw new TranspilerError("JSTransformer: Could not find 'value' for inline plugin.");
            return Function("context", valueParam.value)(this._context) || "";
        }
        return Function("context", block.value.value)(this._context) || "";
    }
}

export class LiteralTransformer extends ContentTransformerPlugin {
    constructor() {
        super("lit")
    }

    transform(block) {
        return block.value.value;
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
            return JSON.parse("{" + block.value.value + "}");
        } catch (e) {
            console.warn(e);
            return {};
        }
    }
}