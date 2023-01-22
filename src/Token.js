export default class Token {
    _tokenType;
    _lexeme;
    _line;

    constructor(tokenType, lexeme, line) {
        this._tokenType = tokenType;
        this._lexeme = lexeme;
        this._line = line;
    }

    get tokenType() { return this._tokenType; }
    get lexeme() { return this._lexeme; }
    get line() { return this._line; }
    set line(line) { this._line = line; }
}

export const TokenType = {
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
    },
    SEMI_COLON: {
        type: "SEMI_COLON"
    }
};