export default class Token {
    _tokenType;
    _lexeme;
    _line;
    _linePosition;

    constructor(tokenType, lexeme, line, linePosition) {
        this._tokenType = tokenType;
        this._lexeme = lexeme;
        this._line = line;
        this._linePosition = linePosition;
    }

    get tokenType() { return this._tokenType; }
    get lexeme() { return this._lexeme; }
    get line() { return this._line; }
    set line(line) { this._line = line; }
    get linePosition() { return this._linePosition; }
    set linePosition(linePosition) { this._linePosition = linePosition; }
}

export const TokenType = {
    EOF: {
        type: "EOF"
    },
    NEWLINE: {
        type: "NEWLINE"
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
    },
    BACK_TICK: {
        type: "BACK_TICK"
    }
};