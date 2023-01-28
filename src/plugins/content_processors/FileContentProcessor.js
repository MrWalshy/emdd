import ContentProcessor from "./ContentProcessor.js";

export default class FileContentProcessor extends ContentProcessor {
    constructor() {
        super("file");
    }

    transform(block) {
        return "";
    }
}