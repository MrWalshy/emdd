import { TranspiledBlock } from "../Transpiler.js";

export default class PostProcessor {

    /**
     * Transforms the given transpiled blocks, returning an array of blocks.
     * 
     * May have side effects.
     * @param {TranspiledBlock[]} blocks 
     * @returns {TranspiledBlock[]} a post processed array of blocks
     */
    transform(blocks) {
        throw UnimplementedError("Not implemented: Plugin unable to parse @ block");
    }
}