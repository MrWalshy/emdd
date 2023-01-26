import ContentProcessor from "./ContentProcessor.js";

export default class LiteralProcessor extends ContentProcessor {
    constructor() {
        super("lit")
    }

    transform(block) {
        return block.value.value;
    }
}