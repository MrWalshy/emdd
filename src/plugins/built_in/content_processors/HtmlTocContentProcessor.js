import ContentTransformerPlugin from "../../ContentTransformerPlugin.js";

export default class HtmlTocContentProcessor extends ContentTransformerPlugin {

    constructor() {
        super("toc");
    }

    transform(block) {
        return "";
    }
}