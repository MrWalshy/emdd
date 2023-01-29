@docArgs()
```
"title": "EMDD | API", 
"links": ["/emdd/style.css"]
```

@weave(name="page_header")
```
"title": "API Documentation",
"lead": "A peek inside..."
```

<article class="pb-16 pt-16">

## `Tokeniser`

Used to produce a flat array of tokens to be parsed into blocks.

---

### `constructor(src, pluginIdentifiers = [])`

Accepts a source string of text and identifiers to use in the tokenisation process.

---

### `addToken(token)`

Adds a new token to the internal token buffer, setting its line number and position in that line. Increments the line position after setting the line position of the token.

**Parameters**

- `Token token`: A new token to add to the tokenised tokens

---

### `tokenise()`

**Return type**: `Token[]`

Triggers the tokenisation process, returning the flat array of tokens.

---

### `scanToken()`

**Return type**: `string`

Scans the next token, adding it to the internal token buffer.

---

### `next()`

**Return type**; `string`

Returns the next character in the internal src string buffer.

---

### `isAtEnd()`

**Return type**: `boolean`

Checks if the tokeniser has reached the end of the source stream.

---

### `isAlpha(character)`

**Return type**: `boolean`

Checks if the given character is an alphabetical letter.

**Parameters**

- `string character`: A character to check

---

### `peek()`

**Return type**: `string | null`

Returns the next character to be scanned in the buffer, without advancing the pointer past the character.

Returns `null` if the end of the source string has been reached.

---

### `pluginIdentifier(current)`

Adds a plugin identifier to the token buffer, or a flat stream of character tokens if no identifier matches the given keywords.

**Parameters**

- `string current`: The current character

</article>

<article class="pb-16 pt-16">

## `Token`

Represents a lexeme, produced as output from the tokeniser.

---

</article>

<article class="pb-16 pt-16">

## `TokenType`

Represents the type of the `Token`.

---

</article>

<article class="pb-16 pt-16">

## `Parser`

Parses a sequence of tokens into `Block`'s which can be manipulated via content, post and document processors during transpilation.

---

</article>

<article class="pb-16 pt-16">

## `Block`

Represents a valid grouping of tokens.

---

</article>

<article class="pb-16 pt-16">

## `BlockType`

Represents the type of `Block` produced by the `Parser`.

---

</article>

<article class="pb-16 pt-16">

## `Parameter`

Represents a name and value parameter pairing for a `Block`.

---

</article>

<article class="pb-16 pt-16">

## `Parameters`

Represents a grouping of `Parameter`.

---

</article>

<article class="pb-16 pt-16">

## `Transpiler`

</article>

<article class="pb-16 pt-16">

## `DocumentProcessor`

</article>

<article class="pb-16 pt-16">

## `ContentProcessor`

</article>

<article class="pb-16 pt-16">

## `PostProcessor`

</article>

<article class="pb-16 pt-16">

## Built-in processors

### Document processors

#### `HtmlDocumentProcessor`

### Content processors

#### `DocumentArgumentsProcessor`

#### `JSProcessor`

#### `WeaveProcessor`

### Post-processors

#### `HTMLTocPostProcessor`

</article>