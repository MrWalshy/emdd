import ContentProcessor from "./ContentProcessor.js";

/**
* Internal plugin for passing arguments from a document to a DocTypePlugin's transform method.
*/
export default class DocumentArgumentsProcessor extends ContentProcessor {
    constructor() {
        super("docArgs");
    }
 
    transform(blocks) {
        try {
            let args = {};
            for (const block of blocks) {
                Object.assign(args, JSON.parse("{" + block.value + "}"));
            }
            return args;
        } catch (e) {
            console.warn(e);
            return {};
        }
    }
}