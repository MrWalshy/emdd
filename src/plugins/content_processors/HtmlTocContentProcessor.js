import ContentProcessor from "./ContentProcessor.js";

export default class HtmlTocContentProcessor extends ContentProcessor {

    constructor() {
        super("toc");
    }

    transform(block) {
        return "";
    }
}