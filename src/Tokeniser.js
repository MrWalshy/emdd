import Token, { TokenType } from './Token.js';

export default class Tokeniser {
    _src;
    _current;
    _tokens;
    _pluginIdentifiers;
    _startOfLexeme;
    _line;

    constructor(src, pluginIdentifiers) {
        this._src = src;
        this._pluginIdentifiers = pluginIdentifiers;
        this._tokens = [];
        this._current = 0;
        this._startOfLexeme = 0;
        this._line = 1;
    }

    addToken(token) {
        token.line = this._line;
        this._tokens.push(token);
    }

    tokenise() {
        while (!this.isAtEnd()) {
            this._startOfLexeme = this._current;
            this.scanToken();
        }
        this.addToken(new Token(TokenType.EOF, ""));
        return this._tokens;
    }

    scanToken() {
        let currentCharacter = this.next();

        switch (currentCharacter) {
            case "\n":
                this.addToken(new Token(TokenType.NEWLINE, "\n"));
                this._line++;
                break;
            case "{":
                this.addToken(new Token(TokenType.LEFT_CURLY, "{"));
                break;
            case "}":
                this.addToken(new Token(TokenType.RIGHT_CURLY, "}"));
                break;
            case "(":
                this.addToken(new Token(TokenType.LEFT_PAREN, "("));
                break;
            case ")":
                this.addToken(new Token(TokenType.RIGHT_PAREN, ")"));
                break;
            case "\\":
                this.addToken(new Token(TokenType.BACKSLASH, "\\"));
                break;
            case "\"":
                this.addToken(new Token(TokenType.QUOTE, "\""));
                break;
            case "=":
                this.addToken(new Token(TokenType.EQUAL, "="));
                break;
            case "@":
                this.addToken(new Token(TokenType.AT, "@"));
                break;
            case "\"":
                this.addToken(new Token(TokenType.QUOTE, "\""));
                break;
            case ";":
                this.addToken(new Token(TokenType.SEMI_COLON, ";"));
                break;
            default:
                if (this.isAlpha(currentCharacter) && this._tokens[this._tokens.length - 1].lexeme == "@") this.pluginIdentifier(currentCharacter);
                else this.addToken(new Token(TokenType.CHARACTER, currentCharacter));
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
        const characters = [new Token(TokenType.CHARACTER, current, this._line)];
        let str = current;
        let character;

        while (this.isAlpha(this.peek())) {
            character = this.next();
            characters.push(new Token(TokenType.CHARACTER, character, this._line));
            str += character;
        }
        const pluginName = this._pluginIdentifiers.find(plugin => plugin == str);
        if (pluginName) this._tokens.push(new Token(TokenType.PLUGIN_IDENTIFIER, str, this._line));
        else this._tokens.push(...characters);
    }
}