import {Tokeniser} from "../emdd.js";
import { Parser, BlockType, UnifiedMarkdownParser, UnimplementedError } from "../emdd.js";
import { Transpiler, DocumentArgumentsTransformer, HtmlDocumentTransformer, JSTransformer, LiteralTransformer } from "../emdd.js";

///////// MAIN //////////
const emdd = `# My title

Some text

@js(){
    let sum = 3 + 3;
    return \`<p>Sum of 3 + 3 is \${sum}</p>\`;
};

Some more markdown following the @ block.

Inline plugins @js(){ return 3 + 3; }; should be supported.
`;



const tokeniser = new Tokeniser(emdd, ["js", "lit", "docArgs"]);
const tokens = tokeniser.tokenise();
const parser = new Parser(tokens);
const blocks = parser.parse();
const contentTransformerPlugins = [new JSTransformer(), new LiteralTransformer(), new DocumentArgumentsTransformer()];
const htmlDocumentTransformer = new HtmlDocumentTransformer();
const transpiler = new Transpiler(contentTransformerPlugins);
// deepLog(blocks);
console.log(transpiler.transpile(blocks, htmlDocumentTransformer));