import { unified } from 'unified';
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeFormat from 'rehype-format';
import remarkGfm from 'remark-gfm';
// import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { TokenType } from './Token.js';
import { deepLog, logTitleBlock } from './utils/logging.js';

export default class Parser {
    _src;
    _tokens;
    _current;

    constructor(tokens = []) {
        this._tokens = tokens;
        this._current = 0;
    }

    parse() {
        const blocks = [];

        while (!this.isAtEnd()) blocks.push(this.block());
        return blocks;
    }

    block() {
        const start = this._current;
        try {
            if (this.check(TokenType.AT) && this.checkAhead(TokenType.PLUGIN_IDENTIFIER, 1)) return this.plugin();
            else return this.markdown(); // markdown is the default, maybe add in a way to choose the default
        } catch (parserError) {
            logTitleBlock("Syntax error encountered", 8);
            console.warn("Line " + parserError.token.line + " [Character: " + parserError.token.linePosition + "]");
            console.warn("ParserError: " + parserError.message);
            console.warn(`Reverting to previous known good state (Line ${this._tokens[start].line} [Character: ${this._tokens[start].linePosition}])\n`);
            this._current = start;
            return this.markdown(parserError);
        }
    }

    atBlockBody() {
        this.consumeCount(TokenType.BACK_TICK, 3, "Expected '```' to signal start of plugin body");
        while (this.peek().lexeme === " ") this.advance();
        this.consume(TokenType.NEWLINE, "Expected newline after '```'");
        let value = "";

        while (!this.isAtEnd()) {
            if (this.check(TokenType.NEWLINE) && this.checkAhead(TokenType.BACK_TICK, 1) && this.checkAhead(TokenType.BACK_TICK, 2) && this.checkAhead(TokenType.BACK_TICK, 3) && (this.checkAhead(TokenType.NEWLINE, 4) || this.checkAhead(TokenType.EOF, 4))) break;
            if (this.check(TokenType.BACKSLASH)) {
                // backslash escapes the next character in @ block body
                this.advance();
                value += this.advance().lexeme;
            }
            // don't care what the token is now, its part of the block
            const token = this.advance();
            value += token.lexeme;
        }
        this.consume(TokenType.NEWLINE, "Expected newline after plugin body.");
        this.consumeCount(TokenType.BACK_TICK, 3, "Expected '```' to signal end of plugin body");
        while (this.peek().lexeme === " ") this.advance();
        if (!this.isAtEnd()) this.consume(TokenType.NEWLINE, "Expected newline or EOF after '```'");
        // try { this.consume(TokenType.NEWLINE, "Expected newline or EOF after '```'"); }
        // catch (error) { this.consume(TokenType.EOF, "Expected newline or EOF after '```'"); }

        return new Block(BlockType.VALUE, null, null, value);
    }

    parameters() {
        while (this.peek().lexeme === " ") this.advance();
        this.consume(TokenType.LEFT_PAREN, "Expected '(' after identifier.");
        const parameters = [];

        // while not EOF and not RIGHT_PAREN
        while (!this.isAtEnd() && !this.check(TokenType.RIGHT_PAREN)) {
            // consume WHITESPACE before parameter name
            while (this.peek().lexeme === " ") this.advance();
            parameters.push(this.parameter());
            if (this.peek().lexeme !== " " && !this.check(TokenType.RIGHT_PAREN)) throw new ParserError("Expected ' ' or ')' after parameter value.", this.previous());
            // consume WHITESPACE after parameter value
            while (this.peek().lexeme === " ") this.advance();
        };
        this.consume(TokenType.RIGHT_PAREN, "Expected ')' after parameter list");
        return parameters; // SUCCESS :O
    }

    parameter() {
        const parameter = {
            name: "",
            value: ""
        };

        while (!this.isAtEnd() && !this.check(TokenType.EQUAL)) {
            if (this.peek().lexeme === " ") break;
            parameter.name += this.advance().lexeme;
        }
        this.validateParameterName(parameter.name);
        while (this.peek().lexeme === " ") this.advance();
        this.consume(TokenType.EQUAL, "Expected an '=' after parameter name");
        // consume whitespace between the equal and first quote of the value
        while (this.peek().lexeme === " ") this.advance();
        this.consume(TokenType.QUOTE, "Expected a '\"' after assignment operator");
        // consume upto closing quote, params are space separated, multi-line
        while (!this.isAtEnd() && !this.check(TokenType.QUOTE)) { parameter.value += this.advance().lexeme; }
        // consume closing quote
        this.consume(TokenType.QUOTE, "Expected a '\"' after argument");
        return new Parameter(parameter.name, parameter.value);
    }

    validateParameterName(name) {
        if (!name.match("^[a-zA-Z_]*$")) throw new ParserError("Invalid parameter name '" + name + "'", this.previous());
    }

    plugin() {
        // const type = !this.previous() || this.previous().tokenType === TokenType.NEWLINE ? BlockType.PLUGIN : BlockType.INLINE_PLUGIN;
        let type;
        if (!this.previous() || this.previous().tokenType === TokenType.NEWLINE) type = BlockType.PLUGIN;
        else type = BlockType.INLINE_PLUGIN;
        this.advance(); // past '@'
        const identifier = this.advance(); // PLUGIN_IDENTIFIER
        const parameters = this.parameters();

        // if (this.peek().type === TokenType.SEMI_COLON) type === BlockType.INLINE_PLUGIN;
        if (type === BlockType.INLINE_PLUGIN) {
            this.consume(TokenType.SEMI_COLON, "Expected ';' after inline plugin arguments. Usage: @<IDENTIFIER>(<ARG1=\"VALUE\"> <...>);");
            return new Block(type, identifier.lexeme, parameters, []);
        }

        while (this.peek().lexeme === " ") this.advance();
        this.consume(TokenType.NEWLINE, "Expected newline before start of plugin body");
        const blockBody = this.atBlockBody();

        return new Block(type, identifier.lexeme, parameters, blockBody);
    }

    markdown(parserError) {
        const valueArray = [];
        let value = "";
        if (parserError) {
            // add the first token, a failed '@' block then proceed as normal
            value += this.advance().lexeme;
        }
        while(!this.isAtEnd() && (!this.check(TokenType.AT) || !this.checkAhead(TokenType.PLUGIN_IDENTIFIER, 1))) {
            // if current token is not a newline, next token is @ and token after is identifier
            // - add current tokens value to value
            // - add current value to value array
            // - reset value
            // - add inline child to value array
            // else
            // - append to value
            if (!this.check(TokenType.NEWLINE) && this.checkAhead(TokenType.AT, 1) && this.checkAhead(TokenType.PLUGIN_IDENTIFIER, 2)) {
                value += this.advance().lexeme;
                valueArray.push(new Block(BlockType.VALUE, null, null, value));
                value = "";
                valueArray.push(this.block());
            } else value += this.advance().lexeme;
        }
        if (value.length > 0) valueArray.push(new Block(BlockType.VALUE, null, null, value));
        return new Block(BlockType.MARKDOWN, null, null, valueArray);
    }

    isAtEnd() {
        return this.peek().tokenType.type === "EOF" || this._current >= this._tokens.length - 1;
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
        return this.peek().tokenType === tokenType;
    }

    checkAhead(tokenType, count) {
        if (this.isAtEnd()) return false;
        return this._tokens[this._current + count]._tokenType === tokenType;
    }

    consume(tokenType, message) {
        if (this.check(tokenType)) return this.advance();
        throw new ParserError(message, this.peek());
    }

    consumeCount(tokenType, count, message) {
        for (let i = 0; i < count; i++) this.consume(tokenType, message);
    }
}

export class Parameter {
    _name;
    _value;

    constructor(name, value) {
        this._name = name;
        this._value = value;
    }

    get name() { return this._name; }
    get value() { return this._value; }
}

export class Block {
    _type;
    _identifier;
    _parameters;
    _value;

    constructor(type, identifier, parameters, value) {
        this._type = type;
        this._identifier = identifier;
        this._parameters = parameters;
        this._value = value;
    }

    get type() { return this._type; }
    get identifier() { return this._identifier; }
    get parameters() { return this._parameters; }
    get value() { return this._value; }
}

export const BlockType = {
    "INLINE_PLUGIN": {
        type: "INLINE_PLUGIN"
    },
    "PLUGIN" : {
        type: "PLUGIN"
    },
    "MARKDOWN": {
        type: "MARKDOWN"
    },
    "VALUE": {
        type: "VALUE"
    }
}

export class MarkdownParser {
    parse(src) {
        throw new UnimplementedError();
    }
}

export class UnifiedMarkdownParser extends MarkdownParser {
    _parser;

    constructor() {
        super();
        this._parser = unified()
            .use(remarkParse)
            // .use(remarkMath)
            .use(remarkGfm)
            .use(remarkRehype, { allowDangerousHtml: true }) // MD AST -> HTML AST
            .use(rehypeKatex) // math symbols, similar to latex
            .use(rehypeFormat)
            .use(rehypeStringify, { allowDangerousCharacters: true, allowDangerousHtml: true }); // HTML AST to HTML text
    }

    parse(src) {
        return this._parser.processSync(src).value;
    }
}

export class UnimplementedError extends Error {
    constructor(message) {
        super(message || "Error (1): Not implemented");
    }
}

class ParserError extends Error {
    _token;

    constructor(message, token) {
        super(message || "Error (2): Unable to parse content");
        this._token = token;
    }

    get token() { return this._token; }
}