import { Block, BlockType } from "../../../Parser.js";
import Token, { TokenType } from "../../../Token.js";
import Tokeniser from "../../../Tokeniser.js";
import { deepLog } from "../../../utils/logging.js";
import PostProcessor from "../../PostProcessor.js";

export default class HtmlTocProcessor extends PostProcessor {
    
    transform(blocks) {
        try {
            let tocBlockIndex = blocks.findIndex(block => block.srcBlock.identifier === "toc");
            if (tocBlockIndex === -1) return blocks;
            const headings = this.identifyHeadings(blocks);
            const html = this.toHtml(headings);

            while (tocBlockIndex != -1) {
                blocks[tocBlockIndex].value = html;
                tocBlockIndex = blocks.findIndex(block => block.srcBlock.identifier  === "toc" && block.value === "");
            }
            return blocks;
        } catch (error) {
            console.error(error)
            return blocks;
        }
    }

    toHtml(headings) {
        const output = ["\n    <ul class=\"toc\">"];
        headings.forEach(heading => {
            output.push(`        <li class="${heading.identifier.lexeme}-toc">${heading.content}</li>`);
        });
        output.push("    <ul>\n");
        return output.join("\n");
    }

    identifyHeadings(blocks) {
        let output = [];
        blocks.forEach(block => {
            const tokens = new HeadingTokeniser(block.value, ["h1", "h2", "h3", "h4", "h5", "h6"]).tokenise();
            // console.log("BLOCK: " + block.value);
            // deepLog(tokens);
            const parser = new HeadingParser(tokens);
            const headings = parser.parse();
            output = [...output, ...headings];
        });
        return output;
    }
}

class HeadingTokeniser extends Tokeniser {

    constructor(src, identifiers) {
        super(src, identifiers);
    }

    pluginIdentifier(current) {
        // console.log("Made it")
        const characters = [new Token(TokenType.CHARACTER, current, this._line, this.line_position++)];
        let str = current;
        let character;

        while (this.isAlphaNumeric(this.peek())) {
            character = this.next();
            characters.push(new Token(TokenType.CHARACTER, character, this._line, this._linePosition++));
            str += character;
        }
        const pluginName = this._pluginIdentifiers.find(plugin => plugin == str);
        if (pluginName) this._tokens.push(new Token(TokenType.PLUGIN_IDENTIFIER, str, this._line, this._linePosition++));
        else this._tokens.push(...characters);
    }

    isAlphaNumeric(char) {
        if (this.isAlpha(char)) return true;
        if (this.isNumeric(char)) return true;
        return false;
    }

    isNumeric(char) {
        return char.match("([1-9])");
    }

    scanToken() {
        let currentCharacter = this.next();

        if (this.isAlphaNumeric(currentCharacter)) this.pluginIdentifier(currentCharacter);
        else this.addToken(new Token(TokenType.CHARACTER, currentCharacter));
    }
}

class HeadingParser {
    _tokens;
    _current;
    _headings;
    _headingOpen;
    _buildingTag;

    constructor(tokens = []) {
        this._tokens = tokens;
        this._headings = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
        this._headingOpen = false;
        this._current = 0;
    }

    parse() {
        const tags = [];
        while (!this.isAtEnd()) {
            if (this.peek().lexeme === "<") {
                this.advance(); // past '<'
                const tag = this.tag();
                if (tag.identifier) tags.push(tag);
            } else this.advance();
        }
        return tags;
    }

    tag() {
        let identifier = null;
        let content = null;
        // console.log(this.peek());
        if (this.check(TokenType.PLUGIN_IDENTIFIER)) {
            identifier = this.parseTagOpener();
        } 
        if (this._headingOpen) {
            content = this.tagContent();
            this.advance(); // past closing '<'
        }
        if (this.peek().lexeme === "/" && this.checkAhead(TokenType.PLUGIN_IDENTIFIER, 1)) {
            this.parseTagCloser();
        } 
        return {
            identifier, content
        }
    }

    parseTagOpener() {
        this._headingOpen = true;
        const identifier = this.advance();
        while (!this.isAtEnd() && !this.peek().lexeme === ">") this.advance();
        this.advance(); // past '>'
        return identifier;
    }

    tagContent() {
        let content = "";
        while (!this.isAtEnd()) {
            let current = this.peek();
            let next = this.peekAhead(1);
            let twoAhead = this.peekAhead(2);
            if (current.lexeme === "<" && next.lexeme === "/" && twoAhead.tokenType === TokenType.PLUGIN_IDENTIFIER) {
                break;
            }
            content += this.advance().lexeme;
        }
        return content;
    }

    parseTagCloser() {
        this._headingOpen = false;
        this.advance(); // past '/';
        this.advance(); // past IDENTIFIER
        this.advance(); // past '>'
    }

    isAtEnd() {
        return this.peek().tokenType.type === "EOF" || this._current >= this._tokens.length - 1;
    }

    peek() {
        return this._tokens[this._current];
    }

    peekAhead(count) {
        if (this._current + count >= this._tokens.length) return null;
        return this._tokens[this._current + count];
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