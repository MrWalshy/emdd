import { deepLog, DocumentProcessor } from "../emdd.js";
import { Block, BlockType, UnifiedMarkdownParser } from "./Parser.js";

/**
 * Responsible for applying pre-processors, content processors, post-processors and document processors to the given
 * parsed blocks.
 */
export default class Transpiler {
    _contentProcessors;
    _documentArgs;
    _markdownParser;
    _postProcessors;

    constructor(contentProcessors = [], postProcessors = [], markdownParser = new UnifiedMarkdownParser()) {
        this._contentProcessors = contentProcessors;
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
        let filteredBlocks = blocks.filter(block => block.identifier !== "docArgs");

        // built-in processing
        let docArgs = blocks.filter(block => block.identifier === "docArgs");
        docArgs.forEach(block => Object.assign(this._documentArgs, JSON.parse("{" + block.value.value + "}")));

        // content (plugin) processing
        let processedBlocks = filteredBlocks;
        this._contentProcessors.forEach(processor => {
            processedBlocks = processor.transform(processedBlocks);
        });

        // built-in markdown processing last, inline plugins included
        // - inline-plugins lower priority than block plugins, runs later
        let fullyProcessedBlocks = [];
        processedBlocks.forEach(block => {
            if (block.type === BlockType.MARKDOWN) {
                fullyProcessedBlocks.push(
                    new Block(block.type, block.identifier, block.parameters, block.value, this.transpileBlock(block))
                );
            } else fullyProcessedBlocks.push(block);
        });

        // post processing
        let postProcessedBlocks = fullyProcessedBlocks;
        this._postProcessors.forEach(processor => postProcessedBlocks = processor.transform(postProcessedBlocks));

        if (documentProcessor) return documentProcessor.transform(postProcessedBlocks, this._documentArgs);
        let output = "";
        postProcessedBlocks.forEach(block => output += block.outputValue);
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
        else if (block.type === BlockType.INLINE_PLUGIN) return this.transpilePlugin(block);
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
            throw new TranspilerError(`Error (5): Content processor not found for ${block._identifier}`);
        }
        return plugin.transform([block])[0].outputValue;
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