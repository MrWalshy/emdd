import ContentTransformerPlugin from "../ContentTransformerPlugin.js";

export default class LiteralTransformer extends ContentTransformerPlugin {
    constructor() {
        super("lit")
    }

    transform(block) {
        return block.value.value;
    }
}