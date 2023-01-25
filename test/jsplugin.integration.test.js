import Parser from "../src/Parser.js";
import Tokeniser from "../src/Tokeniser.js";
import Transpiler, { JSTransformer } from "../src/Transpiler.js";

describe("INTEGRATION TEST: Executing and transforming JavaScript to HTML", () => {
    let transpiler;

    function transpile(src) {
        const tokeniser = new Tokeniser(src, ["js"]);
        const parser = new Parser(tokeniser.tokenise());
        const blocks = parser.parse();
        return transpiler.transpile(blocks);
    }

    beforeEach(() => {
        transpiler = new Transpiler([new JSTransformer()]);
    });

    it("Should execute and transpile a block of JavaScript to its result", () => {
        // Arrange
        const md = `@js()
\`\`\`
return 3 + 3;
\`\`\``;
        const expected = "6";
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should execute and transpile an inline-block of JavaScript to its result in a paragraph", () => {
        // Arrange
        const md = ` @js(value="return 3 + 3;");`;
        const expected = "<p>6</p>";
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should execute and transpile multiple lines of JavaScript in an inline-block", () => {
        // Arrange
        const md = ` @js(value="
            let sum = 3 + 3;
            return sum;
        ");`;
        const expected = "<p>6</p>";
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should not execute an invalid @ block of JavaScript", () => {
        // Arrange
        const md = ` @js(value="return 3 + 3;")`;
        const expected = "<p>@js(value=\"return 3 + 3;\")</p>";
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should share values between executions using the context object", () => {
        // Arrange
        const md = ` @js(value="context.x = 3 + 3;");\n @js(value="return context.x;");`;
        const expected = "<p>6</p>";
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should execute and transpile an inline-block of JavaScript to its result even if at the beginning of a line", () => {
        // Arrange
        const md = `@js(value="return 3 + 3;");`;
        const expected = "6";
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should treat inline-blocks at the start of a line as if it was a block call", () => {
        // Arrange
        const md = `@js(value="return 3 + 3;"); Hello world`;
        const expected = "6<p>Hello world</p>";

        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should allow quotes to be escaped in parameters", () => {
        // Arrange
        const md = `@js(value="return \\"hello world\\";");`;
        const expected = "hello world";
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });
});