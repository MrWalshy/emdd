import Token, { TokenType } from './Token.js';

/**
 * Used to produce a flat array of tokens to be parsed into blocks.
 */
export default class Tokeniser {
    _src;
    _current;
    _tokens;
    _pluginIdentifiers;
    _startOfLexeme;
    _line;
    _linePosition;

    constructor(src, pluginIdentifiers = []) {
        this._src = src;
        this._pluginIdentifiers = pluginIdentifiers;
        this._tokens = [];
        this._current = 0;
        this._startOfLexeme = 0;
        this._line = 1;
        this._linePosition = 1;
    }

    /**
     * Adds a new token to the internal token buffer.
     * @param {Token} token 
     */
    addToken(token) {
        token.line = this._line;
        token.linePosition = this._linePosition;
        this._tokens.push(token);
        this._linePosition++;
    }

    /**
     * Triggers the tokenisation process, returning the flat array of tokens.
     * @returns {Token[]}
     */
    tokenise() {
        while (!this.isAtEnd()) {
            this._startOfLexeme = this._current;
            this.scanToken();
        }
        this.addToken(new Token(TokenType.EOF, ""));
        return this._tokens;
    }

    /**
     * Scans the next token, adding it to the internal token buffer.
     */
    scanToken() {
        let currentCharacter = this.next();

        switch (currentCharacter) {
            case "\n":
                this.addToken(new Token(TokenType.NEWLINE, "\n"));
                this._line++;
                this._linePosition = 1;
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
            case "`":
                this.addToken(new Token(TokenType.BACK_TICK, "`"));
                break;
            case ";":
                this.addToken(new Token(TokenType.SEMI_COLON, ";"));
                break;
            case "\r":
            case "\f":
                break;
            default:
                if (this.isAlpha(currentCharacter) && this._tokens[this._tokens.length - 1].lexeme == "@") this.pluginIdentifier(currentCharacter);
                else this.addToken(new Token(TokenType.CHARACTER, currentCharacter));
                break;
        }
    }

    /**
     * Returns the next character in the internal src string buffer.
     * @returns {string}
     */
     next() {
        return this._src[this._current++];
    }

    /**
     * Checks if the tokeniser has reached the end of the source stream
     * @returns {boolean}
     */
    isAtEnd() {
        if (this._current >= this._src.length) return true;
        else false;
    }

    /**
     * Checks if the given character is an alphabetical letter.
     * @param {string} character 
     * @returns {boolean}
     */
    isAlpha(character="") {
        return character.match("([a-z]|[A-Z])");
    }

    /**
     * Returns the next character to be scanned in the buffer, without advancing the pointer past the character.
     * @returns {string}
     */
    peek() {
        if (this.isAtEnd()) return null;
        return this._src.charAt(this._current);
    }

    /**
     * Adds a plugin identifier to the token buffer, or a flat stream of characters if no identifier matches the given keywords.
     * @param {string} current 
     */
    pluginIdentifier(current) {
        // console.log("Made it")
        const characters = [new Token(TokenType.CHARACTER, current, this._line, this.line_position++)];
        let str = current;
        let character;

        while (this.isAlpha(this.peek())) {
            character = this.next();
            characters.push(new Token(TokenType.CHARACTER, character, this._line, this._linePosition++));
            str += character;
        }
        const pluginName = this._pluginIdentifiers.find(plugin => plugin == str);
        if (pluginName) this._tokens.push(new Token(TokenType.PLUGIN_IDENTIFIER, str, this._line, this._linePosition++));
        else this._tokens.push(...characters);
    }
}