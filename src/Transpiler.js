import { deepLog, DocumentProcessor } from "../emdd.js";
import { Block, BlockType, UnifiedMarkdownParser } from "./Parser.js";

/**
 * Responsible for applying pre-processors, content processors, post-processors and document processors to the given
 * parsed blocks.
 */
export default class Transpiler {
    _contentProcessors;
    _preProcessors;
    _postProcessors;
    _documentArgs;
    _markdownParser;

    constructor(contentProcessors = [], preProcessors = [], postProcessors = [], markdownParser = new UnifiedMarkdownParser()) {
        this._contentProcessors = contentProcessors;
        this._preProcessors = preProcessors;
        this._postProcessors = postProcessors;
        this._markdownParser = markdownParser;
        this._documentArgs = {};
    }

    /**
     * Triggers the transpilation process.
     * 
     * @param {Block[]} blocks 
     * @param {DocumentProcessor} documentProcessor 
     * @returns {*}
     */
    transpile(blocks = [], documentProcessor) {
        const processedBlocks = this.preProcess(blocks);
        let transpiledBlocks = [];
        processedBlocks.forEach(block => {
            const transpilationOutput = this.transpileBlock(block)
            transpiledBlocks.push(new TranspiledBlock(block, transpilationOutput));
        });
        const postProcessedBlocks = this.postProcess(transpiledBlocks);
        // deepLog(postProcessedBlocks);
        if (documentProcessor) return documentProcessor.transform(postProcessedBlocks, this._documentArgs);
        let output = "";
        postProcessedBlocks.forEach(block => output += block.value);
        return output;
    }

    /**
     * Returns the string result of transpilation.
     * 
     * @param {Block} block 
     * @returns {string}
     */
    transpileBlock(block) {
        if (block.type === BlockType.MARKDOWN) return this.transpileMarkdown(block).trim();
        else if (block.type === BlockType.PLUGIN || block.type === BlockType.INLINE_PLUGIN) return this.transpilePlugin(block);
        else if (block.type === BlockType.VALUE) return block.value;
        else throw new TranspilerError("Error (4): Unrecognised block transpilation target.");
    }

    /**
     * Transforms a given Markdown block, also transforming any inline-plugins.
     * 
     * @param {Block} block 
     * @returns {string}
     */
    transpileMarkdown(block) {
        let output = "";
        block.value.forEach(child => output += this.transpileBlock(child));
        return this._markdownParser.parse(output);
    }

    /**
     * Transforms a given plugin if a matching content processor is available and returns its result.
     * 
     * @param {Block} block 
     * @returns {string}
     */
    transpilePlugin(block) {
        const plugin = this._contentProcessors.find(plugin => plugin.name === block.identifier);
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

    /**
     * Applies any found pre-processors to the given blocks, returning a sequence of pre-processed blocks.
     * 
     * @param {Block[]} blocks 
     * @returns {Block[]}
     */
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

    /**
     * Applies any post-processors to the given array of blocks, returning the post-processed blocks.
     * 
     * @param {Block[]} blocks 
     * @returns {Block[]}
     */
    postProcess(blocks) {
        let output = blocks;
        this._postProcessors.forEach(processor => output = processor.transform(blocks));
        return output;
    }
}

/**
 * Represents a transpilation error from the Transpiler.
 */
export class TranspilerError extends Error {
    constructor(message) {
        super(message);
    }
}

/**
 * Represents the result of transpiling a block, containing the original block and its 
 * transpiled value.
 */
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