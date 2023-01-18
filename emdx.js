import { unified } from 'unified';
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeFormat from 'rehype-format';
import remarkGfm from 'remark-gfm';
// import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

let currentArgs = null;

export default class EMDX {
    _plugins;
    _tokeniser;
    _parser;

    constructor(plugins=[]) {
        this._plugins = plugins;
        this._plugins.push(new DocArgsPlugin());
    }

    registerPlugin(plugin) {
        this._plugins.push(plugin);
    }

    transpile(src, transformArgs = {}, docTypePlugin = null) {
        // tokenise source
        this._tokeniser = new Tokeniser(src, this._plugins.map(plugin => plugin.name));
        const tokens = this._tokeniser.tokenise();

        // parse tokens into string output
        this._parser = new Parser(tokens, this._plugins, src);
        const parserOutput = this._parser.parse();

        // return just the parsed output
        if (!docTypePlugin) {
            currentArgs = null; // reset args state before next transpilation
            return parserOutput;
        }

        // transformer present, output transformed document
        const output = docTypePlugin.transform(parserOutput, currentArgs || transformArgs);
        currentArgs = null; // reset args state before next transpilation
        return output;
    }
}

export class Plugin {
    _name; 
    _parameters;

    constructor(name="", parameters=[]) {
        this._name = name;
        this._parameters = parameters;
    }

    get name() { return this._name; }
    set name(name) { this._name = name; }
    get parameters() { return this._parameters; }
    set parameters(parameters) { this._parameters = parameters; }

    /**
     * Parses the given block, returning a string.
     * 
     * May have side effects.
     * @param {*} block 
     */
    parseAtBlock(block) {
        throw Error("Not implemented: Plugin unable to parse @ block");
    }
}

export class DocTypePlugin {
    /**
     * Transforms the given content into a document such as React component or HTML document.
     * @param {*} content 
     * @param {*} args 
     */
    transform(content, args) {
        throw Error("Not implemented: Plugin unable to transform document");
    }
}

/**
 * Internal plugin for passing arguments from a document to a DocTypePlugin's transform method.
 */
class DocArgsPlugin extends Plugin {
    constructor() {
        super("docArgs");
    }

    parseAtBlock(block) {
        try {
            // console.log("DocArgsPlugin: " + JSON.stringify(block, null, "  "));
            return JSON.parse(block.value);
        } catch (e) {
            console.warn(e);
            return {};
        }
    }
}

class Parser {
    _tokens;
    _plugins;
    _ast;
    _mdProcessor;
    _src;
    _current;
    _startOfCurrentBlock;
    _atBlockParseFailed;

    constructor(tokens = [], plugins = [], src="") {
        this._tokens = tokens;
        this._plugins = plugins;
        this._src = src;
        this._current = 0;
        this._startOfCurrentBlock = 0;
        this._atBlockParseFailed = false;
        this._mdProcessor = unified()
            .use(remarkParse)
            // .use(remarkMath)
            .use(remarkGfm)
            .use(remarkRehype) // MD AST -> HTML AST
            .use(rehypeKatex) // math symbols, similar to latex
            .use(rehypeFormat)
            .use(rehypeStringify); // HTML AST to HTML text
            // console.log(tokens);
    }

    parse() {
        // if no plugins or only the DocArg plugin, whole document is parsed as markdown
        if (!this._plugins || this._plugins.length === 1) return this.markdownDocument();

        // if plugins present, parse markdown + plugin behaviours
        // - build AST
        // - return parsed string of tokens
        const blocks = [];
        let output = "";

        // parse into AST
        while (!this.isAtEnd()) blocks.push(this.block());

        // iterate over blocks and transpile
        for (let block of blocks) {
            const plugin = this._plugins.find(plug => plug.name === block.name);
            if (block.name === "docArgs") currentArgs = plugin.parseAtBlock(block); // document transformation arguments
            else if (plugin) output += plugin.parseAtBlock(block); // regular plugin
            else output += this._mdProcessor.processSync(block.value).value; // markdown/everything else
        }
        return output;
    }

    markdownDocument() {
        // parses everything as markdown
        return this._mdProcessor.processSync(this._src).value;
    }

    isAtEnd() {
        return this._current >= this._tokens.length || this.peek()._tokenType == "EOF";
    }

    peek() {
        return this._tokens[this._current];
    }

    advance() {
        if (!this.isAtEnd()) this._current++;
        return this.previous();
    }

    previous() {
        if (this._current == 0) return null;
        return this._tokens[this._current - 1];
    }

    check(tokenType) {
        if (this.isAtEnd()) return false;
        return this.peek()._tokenType == tokenType;
    }

    checkAhead(tokenType, count) {
        if (this._current + count >= this._tokens.length || this.isAtEnd()) return false;
        return this._tokens[this._current + count]._tokenType === tokenType;
    }

    consume(tokenType, message) {
        if (this.check(tokenType)) return this.advance();
        console.warn(message);
        return false;
    }

    /**
     * Returns an internal block data structure, block may have a type of MARKDOWN or PLUGIN
     * @returns 
     */
    block() {
        // if next two tokens = @PLUGIN_IDENTIFIER
        if (this.check(TokenType.AT) && this.checkAhead(TokenType.PLUGIN_IDENTIFIER, 1)) {
            // parse plugin block
            this._startOfCurrentBlock = this._current;
            const atToken = this.consume(TokenType.AT, "@ Block identifier missing");
            const atBlockIdentifier = this.consume(TokenType.PLUGIN_IDENTIFIER, "Plugin identifier expected");
            
            // check for parameters
            if (this.check(TokenType.LEFT_PAREN)) return this.atBlock(atToken, atBlockIdentifier);

            // had error, reset current position and parse as markdown
            this._current = this._startOfCurrentBlock;
            this._atBlockParseFailed = true;
        } 
        // markdown block
        return this.markdownBlock();
    }

    atBlock(atToken, atBlockIdentifier) {
        const leftParen = this.consume(TokenType.LEFT_PAREN, "Left parenthesis missing after @ block identifier");
        const parameters = this.parameters();
        let body = null;
        
        if (!this._atBlockParseFailed && this.check(TokenType.LEFT_CURLY)) {
            body = this.atBlockBody();
        }

        if (this._atBlockParseFailed) {
            // console.log("At block parse failed.");
            this._current = this._startOfCurrentBlock;
            return this.markdownBlock();
        }

        return {
            type: "PLUGIN",
            name: atBlockIdentifier._lexeme,
            parameters: parameters,
            value: body
        }
    }

    parameters() {
        const parameters = [];
        // while not EOF and not RIGHT_PAREN
        while (!this.isAtEnd() && !this.check(TokenType.RIGHT_PAREN)) {
            // try build a parameter
            const parameter = {
                name: "",
                value: ""
            };

            // consume upto =
            while (!this.isAtEnd() && !this.check(TokenType.EQUAL)) parameter.name += this.advance()._lexeme;

            // missing equals means error in params
            const equalsToken = this.consume(TokenType.EQUAL, "Expected an equal token");
            if (!equalsToken || equalsToken._lexeme !== "=" || this.isAtEnd()) { this._atBlockParseFailed = true; return null; }
            
            // parse the value
            const startQuote = this.consume(TokenType.QUOTE, "Expected an '\"' before parameter value");
            if (!startQuote) { this._atBlockParseFailed = true; return null; }
            
            // consume upto closing quote, params are space separated
            while (!this.isAtEnd() && !this.check(TokenType.QUOTE)) { parameter.value += this.advance()._lexeme; }

            // shouldn't be at the end
            if (this.isAtEnd()) { this._atBlockParseFailed = true; return null; }

            const closingQuote = this.consume(TokenType.QUOTE, "Expected an '\"' after parameter value");
            if (!closingQuote) { this._atBlockParseFailed = true; return null; }

            // console.log(parameter)
            parameters.push(parameter);
        }

        // if EOF or right paren missing, failed to parse parameters
        if (this.isAtEnd() || !this.consume(TokenType.RIGHT_PAREN, "Expected right parenthesis after parameter list.")) {
            this._atBlockParseFailed = true;
            return null;
        }
        return parameters; // SUCCESS :O
    }

    atBlockBody() {
        let value = "";
        let curlyCount = 1;
        const leftCurly = this.consume(TokenType.LEFT_CURLY, "Expected '{' after parameter list.");
        let rightCurly = null;

        while (!this.isAtEnd() && curlyCount > 0) {
            const token = this.advance();
            if (token._tokenType === TokenType.LEFT_CURLY) curlyCount++;
            else if (token._tokenType === TokenType.RIGHT_CURLY) curlyCount--;
            
            // reached end of body
            if (curlyCount === 0) rightCurly = token;

            // add nested curly or char
            if (curlyCount > 0) value += token._lexeme;
        }

        if (!rightCurly) { this._atBlockParseFailed = true; return null; }
        else return value;
    }

    markdownBlock() {
        const markdownBlock = {
            type: "MARKDOWN",
            value: ""
        };
        this._startOfCurrentBlock = this._current;
        while (!this.isAtEnd() && (this._atBlockParseFailed || (!this.check(TokenType.AT, 1) && !this.checkAhead(TokenType.PLUGIN_IDENTIFIER, 1)))) {
            markdownBlock.value += this.advance()._lexeme;
        }
        this._atBlockParseFailed = false;
        return markdownBlock;
    }
}

class Tokeniser {
    _src;
    _current;
    _tokens;
    _pluginNames;
    _startOfLexeme;

    constructor(src, pluginNames) {
        this._src = src;
        this._pluginNames = pluginNames;
        this._tokens = [];
        this._current = 0;
        this._startOfLexeme = 0;
    }

    tokenise() {
        while (!this.isAtEnd()) {
            this._startOfLexeme = this._current;
            this.scanToken();
        }
        this._tokens.push(new Token(TokenType.EOF, ""));
        return this._tokens;
    }

    scanToken() {
        let currentCharacter = this.next();

        switch (currentCharacter) {
            case "%":
                this._tokens.push(new Token(TokenType.PERCENT, "%"));
                break;
            case "\n":
                this._tokens.push(new Token(TokenType.NEWLINE, "\n"));
                break;
            case "{":
                this._tokens.push(new Token(TokenType.LEFT_CURLY, "{"));
                break;
            case "}":
                this._tokens.push(new Token(TokenType.RIGHT_CURLY, "}"));
                break;
            case "(":
                this._tokens.push(new Token(TokenType.LEFT_PAREN, "("));
                break;
            case ")":
                this._tokens.push(new Token(TokenType.RIGHT_PAREN, ")"));
                break;
            case "\\":
                this._tokens.push(new Token(TokenType.BACKSLASH, "\\"));
                break;
            case "\"":
                this._tokens.push(new Token(TokenType.QUOTE, "\""));
                break;
            case "=":
                this._tokens.push(new Token(TokenType.EQUAL, "="));
                break;
            case "@":
                this._tokens.push(new Token(TokenType.AT, "@"));
                break;
            default:
                if (this.isAlpha(currentCharacter) && this._tokens[this._tokens.length - 1]._lexeme == "@") this.pluginIdentifier(currentCharacter);
                else this._tokens.push(new Token(TokenType.CHARACTER, currentCharacter));
                break;
        }
    }

    /**
     * Returns the next character in the internal src string buffer.
     */
    next() {
        return this._src[this._current++];
    }

    /**
     * Checks if the tokeniser has reached the end of the source stream
     * @returns a boolean
     */
    isAtEnd() {
        if (this._current >= this._src.length) return true;
        else false;
    }

    isAlpha(character="") {
        return character.match("([a-z]|[A-Z])");
    }

    peek() {
        if (this.isAtEnd()) return null;
        return this._src.charAt(this._current);
    }

    pluginIdentifier(current) {
        // console.log("Made it")
        const characters = [new Token(TokenType.CHARACTER, current)];
        let str = current;
        let character;

        while (this.isAlpha(this.peek())) {
            character = this.next();
            characters.push(new Token(TokenType.CHARACTER, character));
            str += character;
        }
        const pluginName = this._pluginNames.find(plugin => plugin == str);
        if (pluginName) this._tokens.push(new Token(TokenType.PLUGIN_IDENTIFIER, str));
        else this._tokens.push(...characters);
    }
}

class Token {
    _tokenType;
    _lexeme;

    constructor(tokenType, lexeme) {
        this._tokenType = tokenType;
        this._lexeme = lexeme;
    }
}

const TokenType = {
    EOF: {
        type: "EOF"
    },
    PERCENT: {
        type: "PERCENT"
    },
    NEWLINE: {
        type: "NEWLINE"
    },
    LEFT_CURLY: {
        type: "LEFT_CURLY"
    },
    RIGHT_CURLY: {
        type: "RIGHT_CURLY"
    },
    LEFT_PAREN: {
        type: "LEFT_PAREN"
    },
    RIGHT_PAREN: {
        type: "RIGHT_PAREN"
    },
    BACKSLASH: {
        type: "BACKSLASH"
    },
    CHARACTER: {
        type: "CHARACTER"
    },
    AT: {
        type: "AT"
    },
    PLUGIN_IDENTIFIER: {
        type: "PLUGIN_IDENTIFIER"
    },
    EQUAL: {
        type: "EQUAL"
    },
    QUOTE: {
        type: "QUOTE"
    }
}