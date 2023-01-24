import Parser from "../src/Parser.js";
import Tokeniser from "../src/Tokeniser.js";
import Transpiler, { JSTransformer, TemplatePreProcessor, WeaveTemplatePlugin } from "../src/Transpiler.js";

describe("INTEGRATION TEST: Template weaving, literal type", () => {
    let transpiler;

    function transpile(src) {
        const tokeniser = new Tokeniser(src, ["js", "weave", "template"]);
        const parser = new Parser(tokeniser.tokenise());
        const blocks = parser.parse();
        return transpiler.transpile(blocks);
    }

    beforeEach(() => {
        const weaver = new WeaveTemplatePlugin();
        const templater = new TemplatePreProcessor(weaver);
        transpiler = new Transpiler([new JSTransformer(), weaver], [templater]);
    });

    it("Should insert a block @template on command with block @weave", () => {
        // Arrange
        const template = `@template(name="insertOnCommand")
\`\`\`
<p>insert on command</p>
\`\`\``;
        const md = `@weave(name="insertOnCommand")
\`\`\`

\`\`\``;
        const expected = "<p>insert on command</p>";
        
        // Act
        transpile(template);
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should insert a block @template on command with inline @weave", () => {
        // Arrange
        const template = `@template(name="insertOnCommand")
\`\`\`
<span>insert on command</span>
\`\`\``;
        const md = ` @weave(name="insertOnCommand");`;
        const expected = "<p><span>insert on command</span></p>";
        
        // Act
        transpile(template);
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });
});