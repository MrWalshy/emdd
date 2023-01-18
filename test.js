import { readFileSync, writeFile } from "fs";
import path from "path";
import EMDX from "./emdx.js";
import { Plugin } from "./emdx.js";
import JSXPlugin, { HtmlDocTypePlugin, JSPlugin, LiteralPlugin, ReactDocTypePlugin } from "./plugins.js";

const emdxExample = readFileSync("./example.emdx", "utf-8");

const jsx = new JSXPlugin();
const js = new JSPlugin();
const reactTransformPlugin = new ReactDocTypePlugin();
const htmlTransformPlugin = new HtmlDocTypePlugin();
const literalPlugin = new LiteralPlugin();
const emdx = new EMDX([jsx, js, literalPlugin]);
const output = emdx.transpile(emdxExample, null, htmlTransformPlugin);
console.log(JSON.stringify(output, null, "  "));

writeFile(path.resolve("./example.jsx"), output, err => {
    if (err) console.error(err);
});