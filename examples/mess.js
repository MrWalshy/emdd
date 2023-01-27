import { DocumentArgumentsProcessor, HtmlDocumentProcessor, HtmlTocPostProcessor, JSProcessor, LiteralProcessor, TemplatePreProcessor, Tokeniser, WeaveProcessor } from "../emdd.js";
import { Parser } from "../emdd.js";
import { Transpiler } from "../emdd.js";
import { FileContentProcessor, FilePostProcessor, FragmentContentProcessor } from "../src/app/LiterateProgram.js";
import HtmlTocContentProcessor from "../src/plugins/content_processors/HtmlTocContentProcessor.js";

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

@template(name="data" args="username")
\`\`\`
<li>@username;</li>
\`\`\`

@js(name="dataSource" defer="true" value="return [{ username: 'bob' }, { username: 'sarah' }, { username: 'fred' }];");

@lit()
\`\`\`
<ul>
\`\`\`
@weave(name="data" argsSource="dataSource");
@lit()
\`\`\`
</ul>
\`\`\`

@file(name="test.js" dir="src" id="testjs");

My program will take a string of space-delimited numbers from the console and add them together,
this will require reading from a line.

@fragment(type="structure" file="testjs")
\`\`\`
<<IMPORTS>>

<<VARIABLES>>
<<READ_ADD_OUTPUT>>
\`\`\`

This will require importing \`readline\`:

@fragment(file="testjs" name="IMPORTS")
\`\`\`
const readline = require("readline");
\`\`\`

I will then need to setup \`readline\` to read from standard in and output to standard out:

@fragment(file="testjs" name="VARIABLES")
\`\`\`
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
\`\`\`

Then I will need to get the input of numbers from the user:

@fragment(file="testjs" name="READ_ADD_OUTPUT")
\`\`\`
rl.question("Please enter numbers separated by a space to add together: ", <<ANSWER>>);
\`\`\`

Once I have those numbers, they will need to be added together and output to the console:

@fragment(file="testjs" name="ANSWER")
\`\`\`
(numbers) => {
  rl.close();
  let sum = 0;
  numbers.split(" ").forEach(number => sum += Number(number));
  console.log("SUM: " + sum);
}
\`\`\`
`;

const tokeniser = new Tokeniser(emdd, ["js", "lit", "docArgs", "template", "weave", "toc", "file", "fragment"]);
const tokens = tokeniser.tokenise();
// deepLog(tokens);
const parser = new Parser(tokens);
const blocks = parser.parse();
// deepLog(blocks);
const context = {};
const weaver = new WeaveProcessor(context);
const templater = new TemplatePreProcessor(weaver);
const contentTransformerPlugins = [new JSProcessor(context), new LiteralProcessor(), new DocumentArgumentsProcessor(), new HtmlTocContentProcessor(), weaver, new FragmentContentProcessor(), new FileContentProcessor()];
const htmlDocumentTransformer = new HtmlDocumentProcessor();
const transpiler = new Transpiler(contentTransformerPlugins, [templater], [new HtmlTocPostProcessor(), new FilePostProcessor("examples/mess/build")]);
// // deepLog(blocks);
console.log(transpiler.transpile(blocks, htmlDocumentTransformer));