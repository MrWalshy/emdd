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