import Token, { TokenType } from './Token.js';

export default class Tokeniser {
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