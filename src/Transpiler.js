import { deepLog } from "../emdd.js";
import { BlockType, UnifiedMarkdownParser } from "./Parser.js";

export default class Transpiler {
    _contentTransformerPlugins;
    _preProcessors;
    _postProcessors;
    _documentArgs;
    _markdownParser;

    constructor(contentTransformerPlugins = [], preProcessors = [], postProcessors = [], markdownParser = new UnifiedMarkdownParser()) {
        this._contentTransformerPlugins = contentTransformerPlugins;
        this._preProcessors = preProcessors;
        this._postProcessors = postProcessors;
        this._markdownParser = markdownParser;
        this._documentArgs = {};
    }

    transpile(blocks = [], documentTransformerPlugin) {
        const processedBlocks = this.preProcess(blocks);
        let output = "";
        let transpiledBlocks = [];
        processedBlocks.forEach(block => {
            const transpilationOutput = this.transpileBlock(block)
            output += transpilationOutput;
            transpiledBlocks.push(new TranspiledBlock(block, transpilationOutput));
        });
        const postProcessedBlocks = this.postProcess(transpiledBlocks);
        // deepLog(postProcessedBlocks);
        if (documentTransformerPlugin) return documentTransformerPlugin.transform(postProcessedBlocks, this._documentArgs);
        return output;
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
        if (!plugin) {
            deepLog(block)
            throw new TranspilerError(`Error (5): Plugin not found for ${block._identifier}`);
        }
        if (plugin.name === "docArgs") {
            this._documentArgs = plugin.transform(block);
            return "";
        }
        else return plugin.transform(block);
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
        // deepLog(output)
        return output;
    }

    postProcess(blocks) {
        let output = blocks;
        this._postProcessors.forEach(processor => output = processor.transform(blocks));
        return output;
    }
}

export class TranspilerError extends Error {
    constructor(message) {
        super(message);
    }
}

export class TranspiledBlock {
    _srcBlock;
    _value;

    constructor(srcBlock, value) {
        this._srcBlock = srcBlock;
        this._value = value;
    }

    get srcBlock() { return this._srcBlock; }
    get value() { return this._value; }
    set value(val) { this._value = val; }
}