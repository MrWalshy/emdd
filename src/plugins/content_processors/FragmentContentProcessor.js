import { deepLog } from "../../utils/logging.js";
import ContentProcessor from "./ContentProcessor.js";

export default class FragmentContentProcessor extends ContentProcessor {

    constructor() {
        super("fragment");
    }

    transform(block) {
        const echo = block.parameters.find(param => param.name === "echo");
        if (echo && echo.value === "off") return "";
        return `<pre><code>${block.value.value}</code></pre>`;
    }
}