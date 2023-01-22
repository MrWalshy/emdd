# Extensible markdown

Extensible Markdown (.emdd) is a file format for writing web documents, which can then be transpiled with the use of plugins to your desired output, or lack of. This allows Markdown to remain relatively as normal while also promoting extensibility. By default, `.emdd` files will have their Markdown content parsed and output as HTML.

> The API for Extensible Markdown will be classed as unstable until a version 1 release is reached

## The reasoning behind Extensible Markdown

Markdown serves the developer community quite kindly, offering a simple and fast way of writing prose. The major problem to this is when you want something a bit more in your Markdown, this is the reason for creating this project.

If you like this project, feel free to use it as you please.

If you would like to contribute to Extensible Markdown, please visit the GitHub repository for this page and submit a pull request with your contribution (contribution guidelines do not currently exist).

## Example document

The following is an example of an EXMD document:

```md
@docArgs(){
    {
        "title": "Example page"
    }
};

# Title

Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. 
Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. 
Some paragraph text. Some paragraph text. Some paragraph text.

@js(){
    let sum = 3 + 3;
    return `<p>Sum of 3 + 3 is ${sum}</p>`;
};
```

After transpilation to HTML, the contents of the document would roughly look as follows:

```html
<html>
    <head>
        <title>Example page</title>
    </head>
    <body>

        <h1>Title</h1>
        <p>
            Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text.
            Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text.
            Some paragraph text. Some paragraph text. Some paragraph text.
        </p>

        <p>Sum of 3 + 3 is 6</p>
    </body>
</html>
```

## Usage guide

First, install `EMDD` using `npm`:

```
npm install emdd
```

Currently, EMDD can be used by programatically building the transpiler in your program. A static site generator is also included which can be executed from the command-line by passing the location of a valid site configuration file.

### Programmatic usage

First, we must create a valid `emdd` document:

```js
const emdd = `# My title

Some text

@js(){
    let sum = 3 + 3;
    return \`<p>Sum of 3 + 3 is \${sum}</p>\`;
};

Some more markdown following the @ block.

Inline plugins @js(){ return 3 + 3; }; should be supported.
`;
```

Now, we can create a new `Tokeniser`. We must pass the `emdd` source content and an array of plugin identifiers. The plugin identifiers are the names of the content transformation plugins you are using in your document, a **content transformation plugin** is used to transform an `@` block of content.

```js
const tokeniser = new Tokeniser(emdd, ["js", "lit", "docArgs"]);
const tokens = tokeniser.tokenise();
```

After calling the tokenisers `tokenise()` method, we can then parse the tokens into blocks. A block represents a part of the document, whether Markdown, a plugin or an inline-plugin. To do this, create a new parser and call its `parse()` method:

```js
const parser = new Parser(tokens);
const blocks = parser.parse();
```

Now that we have our blocks, we can use a `Transpiler` to transform our `emdd` source into the desired output. First things first though, let's create our plugins:

```js
const contentTransformerPlugins = [new JSTransformer(), new LiteralTransformer(), new DocumentArgumentsTransformer()];
const htmlDocumentTransformer = new HtmlDocumentTransformer();
```

The `contentTransformerPlugins` are used to execute the `@` blocks and return a desired output, the `htmlDocumentTransformer` is used after all of the Markdown has been converted to HTML (and content transformers applied) to convert the transpiled content to a HTML document.

Create a new instance of `Transpiler` and pass it the content transformation plugins as input, then call `transpile()` and pass it the blocks to convert and the document transformer desired:

```js
const transpiler = new Transpiler(contentTransformerPlugins);
console.log(transpiler.transpile(blocks, htmlDocumentTransformer));
```

## EMDD Syntax and other rules

This section concerns the syntactical and other rules of `.emdd` files. 

### @ Blocks

The general syntax for an `@` block is as follows:

```js
@<PLUGIN_IDENTIFIER>(ARG1="VALUE" ARG2="VALUE" ...){
    <CONTENT>
};
```

First, an `@` symbol preceeds the identifier of the plugin. This is immediately followed by a space delimited parameter list surrounded by parenthesis; there must be no space between the identifier and the opening parenthesis to be valid. Each parameter is a `KEY="VALUE"` pair where the `KEY` is a sequence of alpha characters and the value is within double quotes.

After the parameters closing parenthesis must immediately follow an opening curly brace, with the content following this. To signify the end of the content, a closing curly brace followed immediately by a semi-colon is required. To allow nesting of this pattern (`};`), in-case of using a programming plugin like the `JSPlugin`, we can escape either the closing curly brace or the semi-colon using a backslash character:

```js
@js(){
    const stuff = () => {

    }\;
};
```

#### Block level

The `@<PLUGIN_IDENTIFIER>(ARG1 ARG2 ...){};` syntax allows the use of a plugin to do something with the contents of its block. An example could be executing some JavaScript and placing the result in the output document:

```js
@js(){
    let sum = 3 + 3;
    return <p>Sum of 3 + 3 is ${sum}</p>;
};
```

Plugins may also be passed arguments that they expect, we can use the `defer` and `name` parameters to defer the execution of a JS block. Instead, a function with the given name is added to the global `context` object of the plugin (NOT IMPLEMENTED):

```js
@js(defer="true" name="doCalculation"){
    let sum = 3 + 3;
    return <p>Sum of 3 + 3 is ${sum}</p>;
};
```

We can then use the function at a later stage by accessing the `context` object:

```js
@js() { return context.doCalculation(); };
```

#### In-line block level

If an `@` block is used in-line with Markdown content, it's result will be combined with the markdown. For example:

```js
Today is a lovely day, at the time of writing it is day @js() { return new Date().day() + 1; } of the week.
```

could become:

```html
<p>Today is a lovely day, at the time of writing it is day 4 of the week.</p>
```

### Built-in plugins

#### JS Plugin

The JavaScript plugin is almost like having a `<script>` element in your HTML, it allows you to execute JavaScript. Each block you create represents a function:

```
@js(){
    console.log("Hello");
    return "some text";
}
```

The `return` of a function is output into the document.

##### Context

The JS plugin provides a context, this context persists between blocks and documents as long as the same instance of `JSPlugin` is used:

```
@js(){
    context.i = 50;
    let sum = 3 + 3;
    return `<p>Sum of 3 + 3 is ${sum}</p>`;
}

@js(){
    console.log(context.i);
    return `<p>i was ${context.i}</p>`;
}
```

To access the shared context, a global state, use the `context` variable which is automatically accessible.

### Static site generation

To generate a static site, create a valid configuration and pass this to the `generateFromConfig()` method of an `EMDDSiteGenerator`:

```js
const config = loadSiteConfiguration(configLocation);
const generator = new EMDDSiteGenerator();
generator.generateFromConfig(config);
```

A valid configuration would look like:

```json
{
    "output": {
        "type": "html5",
        "directory": "./build"
    },
    "src": {
        "entrypoint": "./index.emdd",
        "copyFilesOfType": ["html", "css", "js"]
    },
    "contentPlugins": ["js", "lit", "docArgs"]
}
```

Supported `output.type`s include:

- `html5`

The `output.directory` is where the build is output.

The `src.entrypoint` is the file which becomes the `index.html` file, if left blank it is expected that you supply an `index.html` file (NOT IMPLEMENTED).

The `src.copyFilesOfType` list allows you to specify file types to copy over directly as is. Files which are not `.emdd` or specified in `src.copyFilesOfType` are ignored. 

#### Generating a site from the command-line

To generate a site from the command-line, run this npm package and pass the `--config` flag:

```
--config="./config.json"
```

## Creating plugins

Plugins are passed to the transpiler to execute some custom functionality.

### Content transformation plugins

A content transformation plugin is created by extending the `ContentTransformerPlugin` class, this has one method and a constructor which accepts a name and parameters for the plugin.

```js
class ExamplePlugin extends ContentTransformerPlugin {
    constructor() {
        super("example", ["arg1"]);
    }

    visit(block) {
        // Do something with the block
    }
}
```

The `block` passed to `visit()` is a block containing the parameter arguments and its content. You may use many `ContentTransformerPlugin`s in a single instance of EMDD.

You can also get the `name` and `parameters` of a plugin using their associated getters:

```js
const name = plugin.name;
const params = plugin.parameters;
```

### Document transformation plugins

An instance of a `DocumentTransformerPlugin` will take the output of parsing the Markdown and applying the plugins, producing the desired output. This could be a JSX component or a HTML document as quick examples.

A `DocumentTransformerPlugin` must implement a single method, `transform(content, args)`. The `args` are supplied if a `@docType(){}` block is specified in the `.emdd` source being converted.

```js
class CustomDocTransformPlugin extends DocumentTransformationPlugin {
    transform(content, args) {
        // do stuff
    }
}
```