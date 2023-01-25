import ContentTransformerPlugin from "./ContentTransformerPlugin.js";

export default class PreProcessingContentPlugin extends ContentTransformerPlugin {
    constructor(name = "", parameters = []) {
        super(name, parameters, true);
    }

    // Don't return anything from `transform()` if the pre-processor removes
    // a block, otherwise return the pre-processed block
}