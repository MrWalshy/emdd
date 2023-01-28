import { HtmlDocumentProcessor, HtmlTocPostProcessor, JSProcessor, Tokeniser, WeaveProcessor } from "../emdd.js";
import { Parser } from "../emdd.js";
import { Transpiler } from "../emdd.js";

///////// MAIN //////////
const emdd = `# My title

@toc();

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

<p>Here is my literal block, useful for writing HTML in your Markdown.</p>

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

@template(name="data" args="username")
\`\`\`
<li>@username;</li>
\`\`\`

@js(name="dataSource" defer="true" value="return [{ username: 'bob' }, { username: 'sarah' }, { username: 'fred' }];");

<ul>
@weave(name="data" argsSource="dataSource");
</ul>
`;

const tokeniser = new Tokeniser(emdd, ["js", "docArgs", "template", "weave", "toc"]);
const tokens = tokeniser.tokenise();
// deepLog(tokens);
const parser = new Parser(tokens);
const blocks = parser.parse();
// deepLog(blocks);
const context = {};
const weaver = new WeaveProcessor(context);
const contentTransformerPlugins = [new JSProcessor(context), new WeaveProcessor(context)];
const postProcessors = [new HtmlTocPostProcessor()];
const htmlDocumentTransformer = new HtmlDocumentProcessor();
const transpiler = new Transpiler(contentTransformerPlugins, postProcessors);
// // deepLog(blocks);
console.log(transpiler.transpile(blocks, htmlDocumentTransformer));