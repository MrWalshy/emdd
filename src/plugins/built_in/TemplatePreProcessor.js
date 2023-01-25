import PreProcessingContentPlugin from "../PreProcessingContentPlugin.js";

export default class TemplatePreProcessor extends PreProcessingContentPlugin {
    _weaver;

    /**
     * 
     * @param {WeaveTemplatePlugin} weaver 
     */
    constructor(weaver) {
        super("template", ["name", "args", "type"]);
        this._weaver = weaver;
    }

    transform(block) {
        this._weaver.addTemplate(block);
        return "";
    }
}