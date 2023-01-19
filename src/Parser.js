import { unified } from 'unified';
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import rehypeFormat from 'rehype-format';
import remarkGfm from 'remark-gfm';
// import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { TokenType } from './Token.js';

export default class Parser {
    _tokens;
    _plugins;
    _ast;
    _mdProcessor;
    _src;
    _current;
    _startOfCurrentBlock;
    _atBlockParseFailed;
    _documentArgs;

    constructor(tokens = [], plugins = [], src="") {
        this._tokens = tokens;
        this._plugins = plugins;
        this._src = src;
        this._current = 0;
        this._startOfCurrentBlock = 0;
        this._atBlockParseFailed = false;
        this._documentArgs = null;
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

    get documentArgs() { return this._documentArgs; }

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
            if (block.name === "docArgs") this._documentArgs = plugin.parseAtBlock(block); // document transformation arguments
            else if (plugin) output += plugin.parseAtBlock(block).trim(); // regular plugin
            else output += this._mdProcessor.processSync(block.value).value.trim(); // markdown/everything else
        }
        return output.trim();
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
        else return value.trim();
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