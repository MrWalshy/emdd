import { Block, BlockType } from "../../Parser.js";
import { TranspilerError } from "../../Transpiler.js";
import ContentProcessor from "./ContentProcessor.js";

export default class JSProcessor extends ContentProcessor {

    _context;

    constructor(context = {}) {
        super("js")
        this._context = context;
    }

    getArgs(parameters) {
        const args = {};
        parameters.forEach(parameter => args[parameter.name] = parameter);
        return args;
    }

    transform(blocks) {
        let processed = [];
        
        for (const block of blocks) {
            if (block.identifier === "js") {
                const args = this.getArgs(block.parameters);
                let blockOutput = "";
                if (block.type === BlockType .INLINE_PLUGIN) blockOutput = this.transformInline(args);
                else blockOutput = this.transformBlock(block, args);
                processed.push(new Block(block.type, block.identifier, block.parameters, block.value, blockOutput));
            } else processed.push(block);
        }
        return processed;
    }

    transformBlock(block, args) {
        if (args.call) {
            const tryCallResult = this.tryCall(args);
            if (tryCallResult) return tryCallResult;
        }

        if (args.name && args.defer && args.defer.value === "true") {
            this._context[args.name.value] = new Function("context", block.value.value);
            return "";
        } else if (args.name) {
            // if not deferring execution, store a copy of the function and execute
            this._context[args.name.value] = new Function("context", block.value.value);
        }
        return Function("context", block.value.value)(this._context) || "";
    }

    transformInline(args) {
        this.checkForRequiredInlineArgs(args);
        const tryCallResult = this.tryCall(args)
        if (tryCallResult) return tryCallResult;

        if (args.name && args.defer && args.defer.value === "true") {
            this._context[args.name.value] = new Function("context", args.value.value);
            return "";
        } else if (args.name) {
            // if not deferring execution, store a copy of the function and execute
            this._context[args.name.value] = new Function("context", args.value.value);
        }
        return Function("context", args.value.value)(this._context) || "";
    }

    checkForRequiredInlineArgs(args) {
        if (!args.call && !args.value) throw new TranspilerError("JSTransformer: Could not find 'value' or 'call' argument for inline plugin.");
        if (args.call && args.value) throw new TranspilerError("JSTransformer: 'call' and 'value' cannot both be specified.");
    }

    tryCall(args) {
        if (args.call) try {
            return this._context[args.call.value](this._context);
        } catch (error) {
            console.warn("Function with name '" + args.call.value + "' does not exist in the current context.");
        }
        return null;
    }
}