import Plugin from "./Plugin.js";
import DocTypePlugin, { CompositeDocTypePlugin } from "./DocTypePlugin.js";
import { readFileSync } from "fs";
import path from "path";
import EMDX from "../emdx.js";

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

export class LiteralDocTypePlugin extends DocTypePlugin {
    transform(content, args) {
        return content;
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
        this._lastSrc = src;
        this._lastArgs = args;
        const argMap = this._validateArgs(args);
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    ${argMap.title}
    ${argMap.links.join("\n" + " ".repeat(8)) || ""}
</head>
<body>
    ${src}
    ${argMap.scripts.join("\n" + " ".repeat(8)) || ""}
</body>
</html>
`;
    }

    _validateArgs(args) {
        const argMap = {};

        // page title
        if (!args.title) {
            console.warn("No <title> provided");
            argMap.title = "<title>Placeholder</title>";
        } else argMap.title = `<title>${args.title}</title>`;

        // page links
        if (!args.links) console.warn("No links provided, embedding and inline CSS can be messy...");
        else argMap.links = args.links.map(arg => `<link rel="stylesheet" href="${arg}" />`);

        if (!args.scripts) console.warn("No scripts provided, embedded and inline JS can be messy...");
        else argMap.scripts = args.scripts.map(arg => `<script src="${arg}"></script>`);

        return argMap;
    }
}

/**
* Internal plugin for passing arguments from a document to a DocTypePlugin's transform method.
*/
export class DocArgsPlugin extends Plugin {
   constructor() {
       super("docArgs");
   }

   parseAtBlock(block) {
       try {
           // console.log("DocArgsPlugin: " + JSON.stringify(block, null, "  "));
           return JSON.parse(block.value);
       } catch (e) {
           console.warn(e);
           return {};
       }
   }
}