import { BlockType } from "../../Parser.js";
import ContentProcessor from "./ContentProcessor.js";

export default class WeaveProcessor extends ContentProcessor {
    _templates;
    _context;

    constructor(context = {}) {
        super("weave", ["name", "argsType"]);
        this._templates = {};
        this._context = context;
    }

    transform(block) {
        const weaveNameParam = block.parameters.find(param => param.name === "name");
        if (!weaveNameParam) throw new Error("Template weave parameter 'name' not supplied");
        const template = this._templates[weaveNameParam.value];
        if (!template) throw new Error("Could not find template with name '" + weaveNameParam.value + "'");
        if (block.type === BlockType.INLINE_PLUGIN) return this.weaveInline(block, template);
        const weaveArgs = JSON.parse(`{${block.value.value}}`);
        return this.weave(template, weaveArgs);
    }

    addTemplate(block) {
        const templateNameParameter = block.parameters.find(param => param.name === "name");
        if (!templateNameParameter) throw new Error("Cannot create nameless template");
        this._templates[templateNameParameter.value] = block;
    }

    weave(templateBlock, weaveArgs) {
        // expected params of template
        let expectedParams = templateBlock.parameters.find(param => param.name === "args");
        if (expectedParams) expectedParams = expectedParams.length === 0 ? [] : expectedParams.value.split(" ");
        
        // prepare output
        let output = templateBlock.value.value;
        if (expectedParams) expectedParams.forEach(param => output = output.replace(`@${param};`, weaveArgs[param] || ""));

        return output;
    }

    weaveInline(block, template) {
        // capture reserved parameter 'name', every other param is a weave arg
        const weaveArgs = {};
        const params = block.parameters.filter(param => param.name !== "name");
        for (const param of params) {
            weaveArgs[param.name] = param.value;
        }
        if (weaveArgs.argsSource) {
            const fn = this._context[weaveArgs.argsSource];
            if (!fn) throw new Error("Function with name '" + weaveArgs.argsSource + "' not found in WeaveProcessor context.");
            const args = fn();
            let output = [];
            args.forEach(arg => output.push("\n" + "    " + this.weave(template, arg)));
            return output.join("");
        }
        return this.weave(template, weaveArgs);
    }
}