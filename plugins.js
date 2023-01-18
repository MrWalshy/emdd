import { DocTypePlugin, Plugin } from "./emdx.js";

export default class JSXPlugin extends Plugin {
    constructor() {
        super("jsx", ["type"]);
    }

    parseAtBlock(block) {
        if (block.parameters.find(b => b.name === "type" && b.value === "literal")) return block.value;
        return block.value;
    }
}

export class JSPlugin extends Plugin {

    // Shared context between parses
    _context = {};

    constructor() {
        super("js")
    }

    parseAtBlock(block) {
        return Function("context", block.value)(this._context);
    }
}

export class LiteralPlugin extends Plugin {
    constructor() {
        super("lit")
    }

    parseAtBlock(block) {
        return block.value;
    }
}

export class ReactDocTypePlugin extends DocTypePlugin {

    transform(content, args) {
        console.log(args);
        return `import React from 'react';

export default function ${args.name}(props) {

    return (
        <>${content}</>
    );
}
`
    }
}

export class HtmlDocTypePlugin extends DocTypePlugin {

    transform(src, args) {
        return `<html>
    <head>
        ${"<title>" + args.title + "</title>" || ""}
    </head>
    <body>
        ${src}
    </body>
</html>
`;
    }
}