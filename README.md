# Extensible markdown

Extensible Markdown (EXMD) is a file format for writing web documents, which can then be transpiled with the use of plugins to 
your desired output, or lack of. This allows Markdown to remain relatively as normal while also promoting extensibility.

## Example document

The following is an example of an EXMD document:

```
@docArgs(){
    {
        "title": "Example page"
    }
}

# Title

Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. 
Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. Some paragraph text. 
Some paragraph text. Some paragraph text. Some paragraph text.

@js(){
    let sum = 3 + 3;
    return `<p>Sum of 3 + 3 is ${sum}</p>`;
}
```

After transpilation to HTML, the contents of the document looks as follows:

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

To use EMDX, import its type and the `HtmlDocTypePlugin` and the `JSPlugin`:

```js
import EMDX from "./emdx.js";
import { HtmlDocTypePlugin, JSPlugin } from "./plugins.js";
```

The `JSPlugin` is a `Plugin` used during parsing to alter the contents of a document according to a custom `parseAtBlock` method. The `HtmlDocTypePlugin` is a `DocTypePlugin`, these use a custom `transform` method to produce a final output. 

> If a `DocTypePlugin` is not used during transpilation, the parsers output before transformation is returned.

Once we have the plugins and `EMDX`, create an instance of each of them:

```js
const jsPlugin = new JSPlugin();
const htmlTransformPlugin = new HtmlDocTypePlugin();
const emdx = new EMDX([jsPlugin]);
```

The `Plugin`'s are passed as a list to each instance of `EMDX`. The `transpile` method can then be called on a source string to transform it using a given `DocTypePlugin`:

```js
const output = emdx.transpile("# Hello world", null, htmlTransformPlugin);
```

### JS Plugin

The JavaScript plugin is almost like having a `<script>` element in your HTML, it allows you to execute JavaScript. Each block you create represents a function:

```
@js(){
    console.log("Hello");
    return "some text";
}
```

The `return` of a function is output into the document.

#### Context

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

## EMDD Syntax and other rules

This section concerns the syntactical and other rules of `.emdd` files. 

### @ Blocks

#### Block level

The `@<plugin>(arg1, arg2, ...){}` syntax allows the use of a plugin to do something with the contents of its block. An example could be executing some JavaScript and placing the result in the output document:

```js
@js(){
    let sum = 3 + 3;
    return <p>Sum of 3 + 3 is ${sum}</p>;
};
```

Plugins may also be passed arguments that they expect, we can use the `defer` and `name` parameters to defer the execution of a JS block. Instead, a function with the given name is added to the global `context` object of the plugin:

```js
@js(defer="true" name="doCalculation"){
    let sum = 3 + 3;
    return <p>Sum of 3 + 3 is ${sum}</p>;
};
```

We can then use the function at a later stage by accessing the `context` object:

```js
@js() { return context.doCalculation(); }
```

#### In-line block level

If an `@` block is used in-line with Markdown content, it's result will be combined with the markdown. For example:

```js
Today is a lovely day, at the time of writing it is @js() { return new Date().day(); }.
```

could become:

```js
Today is a lovely day, at the time of writing it is @js() { return new Date().day(); }.
```

### Static site generation

To generate a static site, create a valid configuration and pass this configuration to an instance of `EMDDSiteGenerator`, then call its `generate()` method to generate the static site:

```js
const generator = new EMDDSiteGenerator(path.resolve(__dirname, "./config.json"));
generator.generate();
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
        "copyFilesOfType": [
            "js",
            "css",
            "html"
        ]
    }
}
```

Supported `output.type`s include:

- `html5`
- `react`

The `output.directory` is relative to the config files location, or absolute if an absolute path is supplied. This is where the build is output.

The `src.entrypoint` is the file which becomes the `index.html` file, if left blank it is expected that you supply an `index.html` file.

The `src.copyFilesOfType` list allows you to specify file types to copy over directly as is. Files which are not `.emdd` or specified in `src.copyFilesOfType` are ignored. 

## Creating plugins

### Content transformation plugins

A plugin is created by extending the `ContentTransformerPlugin` class, this has one methods and a constructor which accepts a name and parameters for the plugin.

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

### Document transformation plugins

An instance of a `DocumentTransformationPlugin` will take the output of parsing the Markdown and applying the plugins, producing the desired output. This could be a JSX component or a HTML document as quick examples.

A `DocumentTransformationPlugin` must implement a single method, `transform(content, args)`. The `args` are supplied if a `@docType(){}` block is specified.

```js
class CustomDocTransformPlugin extends DocumentTransformationPlugin {
    transform(content, args) {
        // do stuff
    }
}
```