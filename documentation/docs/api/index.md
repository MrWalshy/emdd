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

---

## `Token`

## `TokenType`

## `Parser`

## `Block`

## `BlockType`

## `Parameter`

## `Parameters`

## `Transpiler`

## `DocumentProcessor`

## `ContentProcessor`

## `PreProcessor`

## `PostProcessor`

## Built-in processors

### Document processors

#### `HtmlDocumentProcessor`

### Content processors

#### `DocumentArgumentsProcessor`

#### `JSProcessor`

#### `LiteralProcessor`

#### `HtmlTocContentProcessor`

#### `WeaveProcessor`

### Pre-processors

#### `TemplatePreProcessor`

### Post-processors

#### `HTMLTocPostProcessor`