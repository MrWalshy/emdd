import { BlockType } from "../../Parser.js";
import DocumentTransformerPlugin from "../DocumentTransformerPlugin.js";

export default class HtmlDocumentTransformer extends DocumentTransformerPlugin {
    _preamble;
    _postamble;

    constructor(preamble = "", postamble = "") {
        super();
        this._preamble = preamble;
        this._postamble = postamble;
    }

    transform(blocks, args) {
        const argMap = this._validateArgs(args);
        const content = this._contentFromBlocks(blocks);
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${argMap.title}
    ${argMap.links.join("\n" + " ".repeat(4)) || ""}
</head>
<body>
    ${this._preamble}
    ${content}
    ${this._postamble}
    ${argMap.scripts.join("\n" + " ".repeat(4)) || ""}
</body>
</html>
`;
    }

    _contentFromBlocks(blocks) {
        let output = "";
        blocks.forEach(block => output += block.value);
        return output;
    }

    _validateArgs(args) {
        const argMap = {
            links: [],
            scripts: []
        };

        // page title
        if (!args.title) {
            console.warn("WARNING: No <title> provided");
            argMap.title = "<title>Placeholder</title>";
        } else argMap.title = `<title>${args.title}</title>`;

        // page links
        if (!args.links) console.warn("WARNING: No links provided, embedding and inline CSS can be messy...");
        else argMap.links = args.links.map(arg => `<link rel="stylesheet" href="${arg}" />`);

        if (!args.scripts) console.warn("WARNING: No scripts provided, embedded and inline JS can be messy...");
        else argMap.scripts = args.scripts.map(arg => `<script src="${arg}"></script>`);

        return argMap;
    }
}