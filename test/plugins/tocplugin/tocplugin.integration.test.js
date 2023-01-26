import { deepLog, HtmlTocContentProcessor, HtmlTocPostProcessor, Parser, Tokeniser, Transpiler } from "../../../emdd.js";

describe("INTEGRATION TEST: Inserting a Table of Contents", () => {
    let transpiler;

    function transpile(src) {
        const tokeniser = new Tokeniser(src, ["toc"]);
        const parser = new Parser(tokeniser.tokenise());
        const blocks = parser.parse();
        return transpiler.transpile(blocks);
    }

    beforeEach(() => {
        transpiler = new Transpiler([new HtmlTocContentProcessor()], [], [new HtmlTocPostProcessor()]);
    });

    it("Should insert a table of contents into the result", () => {
        // Arrange
        const md = `# My title

@toc();

## My secondary title
`;
        const expected = `<h1>My title</h1>
    <ul class="toc">
        <li class="h1-toc">My title</li>
        <li class="h2-toc">My secondary title</li>
    </ul>
<h2>My secondary title</h2>`;
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should not insert specified exclusions", () => {
        // Arrange
        const md = `# My title

@toc(exclude="h1");

## My secondary title
`;
        const expected = `<h1>My title</h1>
    <ul class="toc">
        <li class="h2-toc">My secondary title</li>
    </ul>
<h2>My secondary title</h2>`;
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should not insert multiple specified exclusions", () => {
        // Arrange
        const md = `# My title

@toc(exclude="h1 h3");

## My secondary title

### My third title
`;
        const expected = `<h1>My title</h1>
    <ul class="toc">
        <li class="h2-toc">My secondary title</li>
    </ul>
<h2>My secondary title</h2>
<h3>My third title</h3>`;
        
        // Act
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });
});