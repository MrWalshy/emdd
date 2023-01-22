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
            // if (this.previous()._tokenType === TokenType.NEWLINE && this.check(TokenType.AT) && this.checkAhead(TokenType.PLUGIN_IDENTIFIER)) return this.inlinePlugin();
            if (this.check(TokenType.AT) && this.checkAhead(TokenType.PLUGIN_IDENTIFIER, 1)) return this.plugin();
            else return this.markdown();
        } catch (parserError) {
            logTitleBlock("Syntax error encountered", 8);
            console.warn("ParserError: " + parserError.message);
            console.warn(`Reverting to previous known good state (token: [${start}])\n`);
            this._current = start;
            return this.markdown(parserError);
        }
    }

    atBlockBody() {
        if (!this.check(TokenType.LEFT_CURLY)) throw new ParserError("Expected '{' after parameter list.");
        this.advance();
        let value = "";

        while (!this.isAtEnd()) {
            if (this.check(TokenType.RIGHT_CURLY) && this.checkAhead(TokenType.SEMI_COLON, 1)) break;
            const token = this.advance();
            value += token._lexeme;

            if (this.check(TokenType.BACKSLASH)) {
                // backslash escapes the next character in @ block body
                this.advance();
                value += this.advance()._lexeme;
            }
        }
        if (!this.check(TokenType.RIGHT_CURLY) || !this.checkAhead(TokenType.SEMI_COLON, 1)) throw new ParserError("Expected '};' after @ block body");
        this.advance();
        if (!this.check(TokenType.SEMI_COLON)) throw new ParserError("Expected ';' after end of @ block body");
        this.advance();
        return value.trim();
    }

    parameters() {
        if (!this.check(TokenType.LEFT_PAREN)) throw new ParserError("Expected '(' after identifier.");
        this.advance(); // past '('
        const parameters = [];

        // while not EOF and not RIGHT_PAREN
        while (!this.check(TokenType.RIGHT_PAREN)) {
            // consume WHITESPACE
            while (this.peek()._lexeme === " ") this.advance();
            parameters.push(this.parameter());
            // consume WHITESPACE
            while (this.peek()._lexeme === " ") this.advance();
        };

        // if EOF or right paren missing, failed to parse parameters
        if (!this.check(TokenType.RIGHT_PAREN)) throw new ParserError("Expected ')' after parameters");
        this.advance(); // past ')'
        return parameters; // SUCCESS :O
    }

    parameter() {
        const parameter = {
            name: "",
            value: ""
        };

        // consume upto =
        while (!this.isAtEnd() && !this.check(TokenType.EQUAL)) parameter.name += this.advance()._lexeme;

        // missing equals means error in params
        if (!this.check(TokenType.EQUAL)) throw new ParserError("Expected an '=' after parameter name");
        const equalsToken = this.advance();
        
        // parse the value
        if (!this.check(TokenType.QUOTE)) throw new ParserError("Expected a '\"' after assignment operator");
        this.advance();
        
        // consume upto closing quote, params are space separated
        while (!this.isAtEnd() && !this.check(TokenType.QUOTE)) { parameter.value += this.advance()._lexeme; }

        // consume closing quote
        if (!this.check(TokenType.QUOTE)) throw new ParserError("Expected a '\"' after argument")
        this.advance();

        return new Parameter(parameter.name, parameter.value);
    }

    plugin() {
        const type = !this.previous() || this.previous()._tokenType === TokenType.NEWLINE ? BlockType.PLUGIN : BlockType.INLINE_PLUGIN;
        this.advance(); // past '@'
        const identifier = this.advance(); // PLUGIN_IDENTIFIER

        // check for parameters
        const parameters = this.parameters();
        const blockBody = this.atBlockBody();

        return new Block(type, identifier._lexeme, parameters, blockBody);
    }

    markdown(parserError) {
        const valueArray = [];
        let value = "";
        if (parserError) {
            // add the first token, a failed '@' block then proceed as normal
            value += this.advance()._lexeme;
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
                value += this.advance()._lexeme;
                valueArray.push(value);
                value = "";
                valueArray.push(this.block());
            } else value += this.advance()._lexeme;
        }
        if (value.length > 0) valueArray.push(value);
        return new Block(BlockType.MARKDOWN, null, null, valueArray);
    }

    isAtEnd() {
        return this.peek()._tokenType.type === "EOF" || this._current >= this._tokens.length - 1;
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
        if (this.isAtEnd()) return false;
        return this._tokens[this._current + count]._tokenType === tokenType;
    }

    consume(tokenType, message) {
        if (this.check(tokenType)) return this.advance();
        console.warn(message);
        return false;
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
            .use(remarkRehype) // MD AST -> HTML AST
            .use(rehypeKatex) // math symbols, similar to latex
            .use(rehypeFormat)
            .use(rehypeStringify); // HTML AST to HTML text
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
    constructor(message) {
        super(message || "Error (2): Unable to parse content");
    }
}