import ContentProcessor from "./ContentProcessor.js";

/**
* Internal plugin for passing arguments from a document to a DocTypePlugin's transform method.
*/
export default class DocumentArgumentsProcessor extends ContentProcessor {
    constructor() {
        super("docArgs");
    }
 
    transform(block) {
        try {
            return JSON.parse("{" + block.value.value + "}");
        } catch (e) {
            console.warn(e);
            return {};
        }
    }
}