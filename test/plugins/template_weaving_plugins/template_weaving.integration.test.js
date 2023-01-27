import { JSProcessor, Parser, TemplatePreProcessor, Tokeniser, Transpiler, WeaveProcessor } from "../../../emdd.js";

describe("INTEGRATION TEST: Template weaving, literal type", () => {
    let transpiler;

    function transpile(src) {
        const tokeniser = new Tokeniser(src, ["js", "weave", "template"]);
        const parser = new Parser(tokeniser.tokenise());
        const blocks = parser.parse();
        return transpiler.transpile(blocks);
    }

    beforeEach(() => {
        const weaver = new WeaveProcessor();
        const templater = new TemplatePreProcessor(weaver);
        transpiler = new Transpiler([new JSProcessor(), weaver], [templater]);
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

describe("INTEGRATION TEST: Template weaving from data source", () => {
    let transpiler;

    function transpile(src) {
        const tokeniser = new Tokeniser(src, ["js", "weave", "template"]);
        const parser = new Parser(tokeniser.tokenise());
        const blocks = parser.parse();
        return transpiler.transpile(blocks);
    }

    beforeEach(() => {
        const context = {};
        const weaver = new WeaveProcessor(context);
        const templater = new TemplatePreProcessor(weaver);
        transpiler = new Transpiler([new JSProcessor(context), weaver], [templater]);
    });

    it("Should insert a block weaved from a JS data source", () => {
        // Arrange
        const dataSource = `@js(name="dataSource" defer="true" value="return [{ username: 'bob' }, { username: 'sarah' }, { username: 'fred' }];");`;
        const template = `@template(name="data" args="username")
\`\`\`
<li>@username;</li>
\`\`\``;
        const md = `@weave(name="data" argsSource="dataSource");`;
        const expected = "<li>bob</li><li>sarah</li><li>fred</li>";
        
        // Act
        transpile(dataSource);
        transpile(template);
        const actual = transpile(md);

        // Assert
        expect(actual).toEqual(expected);
    });

    it("Should throw an error if the data source function does not exist on the context", () => {
        // Arrange
        const template = `@template(name="data" args="username")
\`\`\`
<li>@username;</li>
\`\`\``;
        const md = `@weave(name="data" argsSource="dataSource");`;
        
        // Act and assert
        transpile(template);
        expect(() => transpile(md))
            .toThrowError("Function with name 'dataSource' not found in WeaveProcessor context.");
    });
});