@docArgs()
```
"title": "EMDD | Guide", 
"links": ["/style.css"]
```

@weave(name="page_header")
```
"title": "Usage guide",
"lead": "A quick-starter guide to the API and built-in apps"
```

## Using the static site generator

## Setting up a custom transpiler

The API for this library is simple to use. To get started, let's create some example content:

@weave(name="code" value="# My title

@toc();

## My secondary title

Some text

@js()
```
let sum = 3 + 3;
return `&lt;p>Sum of 3 + 3 is \${sum}&lt;/p>`;
```

Inline plugins @js(value=\"
  let sum = 3 + 3; 
  return sum;
\"); should be supported.

@docArgs()
```
\"title\": \"Test | Title\"
```

@template(name=\"title\" args=\"text lead\")
```
&lt;header>
    &lt;h1>@text;&lt;/h1>
    &lt;p>@lead;&lt;/p>
&lt;/header>
```

@weave(name=\"title\")
```
\"text\": \"Hello world\",
\"lead\": \"Some leading text\"
```

@weave(name=\"title\" text=\"Hello world 2\" lead=\"Some more lead\");

@template(name=\"data\" args=\"username\")
```
&lt;li>@username;&lt;/li>
```

@js(name=\"dataSource\" defer=\"true\" value=\"return [{ username: 'bob' }, { username: 'sarah' }, { username: 'fred' }];\");

&lt;ul>
@weave(name=\"data\" argsSource=\"dataSource\");
&lt;/ul>
`;
");

Now, we need a tokeniser. This will split the source string into an array of `Token`s, each representing some specific, or non-specific, character type:

```js
const tokeniser = new Tokeniser(emdd, ["js", "docArgs", "template", "weave", "toc"]);
const tokens = tokeniser.tokenise();
```

We pass the identifiers of the content processors and post-processors to the tokenisers constructor, these are keywords that the tokeniser should recognise as an identifier if following an `@` symbol.

- The `js` plugin will run JavaScript code during the build process
- `docArgs` is a built-in plugin which is activated when this keyword is supplied to the tokeniser
- The `template` and `weave` plugins come packaged together, these are used for creating templates and weaving them into a document
- The `toc` plugin is a post-processor which will generate a table of contents at its location, we can also use the `exclude` parameter to specify which HTML element types to exclude. For example, we could pass `exclude="h1 h2"` to exclude `<h1>` and `<h2>` elements.

Once we have the tokens, we can parse them into `Block`'s:

```js
const parser = new Parser(tokens);
const blocks = parser.parse();
```

The parser accepts a sequence of tokens upon instantiation, and produces an array of blocks representing the document when its `parse()` method is called.

Let's now setup the plugins, ready for transpilation. As we want the `weave` blocks to be able to call functions defined in a `js` block as a data source, we pass a context object to both which ties them together:

```js
let processorContext = {};
let contentProcessors = [new WeaveProcessor(context), new JSProcessor(context)];
```

The table of contents, `toc`, processor is a post processor. Let's create that now:

```js
const postProcessors = [new HtmlTocPostProcessor()];
```

We also want a document transformer, in this case to produce a HTML5 document:

```js
const htmlDocumentTransformer = new HtmlDocumentProcessor();
```

We can then create a new `Transpiler`, passing it the content and post-processing plugins:

```js
const transpiler = new Transpiler(contentProcessors, postProcessors);
```

We can then transpile the content to its target:

```js
const output = transpiler.transpile(blocks, htmlDocumentTransformer);
```

The document processor is passed to the `transpile` method, this allows you to produce different document types dependending on your needs.

## Writing documents

### Markdown

### Extensions