import { Block } from "../../Parser.js";
import ContentProcessor from "./ContentProcessor.js";

export default class HtmlTocContentProcessor extends ContentProcessor {

    constructor() {
        super("toc");
    }

    transform(blocks) {
        let processed = [];
        blocks.forEach(block => {
            if (block.identifier === "toc") {
                processed.push(
                    new Block(block.type, block.identifier, block.parameters, block.value, "")
                );
            } else processed.push(block);
        });
        return processed;
    }
}