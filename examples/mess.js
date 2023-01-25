import {deepLog, TemplatePreProcessor, Tokeniser, WeaveTemplatePlugin} from "../emdd.js";
import { Parser, BlockType, UnifiedMarkdownParser, UnimplementedError } from "../emdd.js";
import { Transpiler, DocumentArgumentsTransformer, HtmlDocumentTransformer, JSTransformer, LiteralTransformer } from "../emdd.js";
import HtmlTocContentProcessor from "../src/plugins/built_in/content_processors/HtmlTocContentProcessor.js";
import HtmlTocProcessor from "../src/plugins/built_in/post_processors/HtmlTocProcessor.js";

///////// MAIN //////////
const emdd = `# My title

## My secondary title

Some text

@toc();

@js()
\`\`\`
let sum = 3 + 3;
return \`<p>Sum of 3 + 3 is \${sum}</p>\`;
\`\`\`

@docArgs()
\`\`\`
"title": "Test | Title"
\`\`\`

@lit()
\`\`\`
<p>Here is my literal block, useful for writing HTML in your Markdown.</p>
\`\`\`

@template(name="title" args="text lead")
\`\`\`
<header>
    <h1>@text;</h1>
    <p>@lead;</p>
</header>
\`\`\`

@weave(name="title")
\`\`\`
"text": "Hello world",
"lead": "Some leading text"
\`\`\`

@weave(name="title" text="Hello world 2" lead="Some more lead");

Some more markdown following the @ block.

Inline plugins @js(value="
  let sum = 3 + 3; 
  return sum;
"); should be supported.
`;



const tokeniser = new Tokeniser(emdd, ["js", "lit", "docArgs", "template", "weave", "toc"]);
const tokens = tokeniser.tokenise();
// deepLog(tokens);
const parser = new Parser(tokens);
const blocks = parser.parse();
// deepLog(blocks);
const weaver = new WeaveTemplatePlugin();
const templater = new TemplatePreProcessor(weaver);
const contentTransformerPlugins = [new JSTransformer(), new LiteralTransformer(), new DocumentArgumentsTransformer(), new HtmlTocContentProcessor(), weaver];
const htmlDocumentTransformer = new HtmlDocumentTransformer();
const transpiler = new Transpiler(contentTransformerPlugins, [templater], [new HtmlTocProcessor()]);
// // deepLog(blocks);
console.log(transpiler.transpile(blocks, htmlDocumentTransformer));