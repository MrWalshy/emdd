import { LiteralProcessor, Parser, Tokeniser, Transpiler } from "../../../emdd.js";

describe("INTEGRATION TEST: Transforming literal blocks", () => {
    let transpiler;

    function transpile(src) {
        const tokeniser = new Tokeniser(src, ["lit"]);
        const parser = new Parser(tokeniser.tokenise());
        const blocks = parser.parse();
        return transpiler.transpile(blocks);
    }

    beforeEach(() => {
        transpiler = new Transpiler([new LiteralProcessor()]);
    });

    it("Should transpile a literal block to its result", () => {
        // Arrange
        const md = `@lit()
\`\`\`
<p>Here is my literal block, useful for writing HTML in your Markdown.</p>
\`\`\``;
        const expected = "<p>Here is my literal block, useful for writing HTML in your Markdown.</p>";
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

});