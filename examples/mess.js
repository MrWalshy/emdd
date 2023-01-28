import { DocumentArgumentsProcessor, HtmlDocumentProcessor, HtmlTocPostProcessor, JSProcessor, LiteralProcessor, TemplatePreProcessor, Tokeniser, WeaveProcessor } from "../emdd.js";
import { Parser } from "../emdd.js";
import { Transpiler } from "../emdd.js";
import HtmlTocContentProcessor from "../src/plugins/content_processors/HtmlTocContentProcessor.js";

///////// MAIN //////////
const emdd = `# My title

## My secondary title

Some text

@js()
\`\`\`
let sum = 3 + 3;
return \`<p>Sum of 3 + 3 is \${sum}</p>\`;
\`\`\`

Inline plugins @js(value="
  let sum = 3 + 3; 
  return sum;
"); should be supported.

@docArgs()
\`\`\`
"title": "Test | Title"
\`\`\`
`;

// @toc();

// @lit()
// \`\`\`
// <p>Here is my literal block, useful for writing HTML in your Markdown.</p>
// \`\`\`

// @template(name="title" args="text lead")
// \`\`\`
// <header>
//     <h1>@text;</h1>
//     <p>@lead;</p>
// </header>
// \`\`\`

// @weave(name="title")
// \`\`\`
// "text": "Hello world",
// "lead": "Some leading text"
// \`\`\`

// @weave(name="title" text="Hello world 2" lead="Some more lead");

// Some more markdown following the @ block.

// @template(name="data" args="username")
// \`\`\`
// <li>@username;</li>
// \`\`\`

// @js(name="dataSource" defer="true" value="return [{ username: 'bob' }, { username: 'sarah' }, { username: 'fred' }];");

// @lit()
// \`\`\`
// <ul>
// \`\`\`
// @weave(name="data" argsSource="dataSource");
// @lit()
// \`\`\`
// </ul>
// \`\`\`
// `;



const tokeniser = new Tokeniser(emdd, ["js", "lit", "docArgs", "template", "weave", "toc"]);
const tokens = tokeniser.tokenise();
// deepLog(tokens);
const parser = new Parser(tokens);
const blocks = parser.parse();
// deepLog(blocks);
const context = {};
const weaver = new WeaveProcessor(context);
const templater = new TemplatePreProcessor(weaver);
// const contentTransformerPlugins = [new JSProcessor(context), new LiteralProcessor(), new DocumentArgumentsProcessor(), new HtmlTocContentProcessor(), weaver];
const contentTransformerPlugins = [new JSProcessor(context)]
const htmlDocumentTransformer = new HtmlDocumentProcessor();
const transpiler = new Transpiler(contentTransformerPlugins);
// // deepLog(blocks);
console.log(transpiler.transpile(blocks, htmlDocumentTransformer));