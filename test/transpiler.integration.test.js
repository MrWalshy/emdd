import Parser from "../src/Parser.js";
import Tokeniser from "../src/Tokeniser.js";
import Transpiler from "../src/Transpiler.js";

describe("INTEGRATION TEST: No plugins, Markdown parsing", () => {
    let transpiler;

    function transpile(src) {
        const tokeniser = new Tokeniser(src);
        const parser = new Parser(tokeniser.tokenise());
        const blocks = parser.parse();
        return transpiler.transpile(blocks);
    }

    beforeEach(() => {
        transpiler = new Transpiler();
    });

    it("Should transpile a single line of Markdown to valid HTML", () => {
        // Arrange
        const md = "# This is a h1";
        const expected = "<h1>This is a h1</h1>";
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should transpile multiple lines of Markdown to valid HTML", () => {
        // Arrange
        const md = `# This is a h1

Followed by some text.`;
        const expected = `<h1>This is a h1</h1>
<p>Followed by some text.</p>`;

        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should transpile @ scripts into Markdown", () => {
        // Arrange
        const md = "# This is a h1\n\nSome text @js(value=\"console.log('hello world')\"); yup";
        const expected = "<h1>This is a h1</h1>\n<p>Some text @js(value=\"console.log('hello world')\"); yup</p>";
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });
});