import EMDX from "../emdx.js";
import { LiteralDocTypePlugin } from "../src/plugins.js";

describe("Valid markdown compiled to HTML", () => {
    let emdx;

    beforeEach(() => {
        emdx = new EMDX();
    });

    it("should transpile a heading", () => {
        const md = "# Example h1";
        const expected = "<h1>Example h1</h1>";
        const actual = emdx.transpile(md);
        expect(actual).toEqual(expected);
    });

    it("should transpile a heading and paragraph text", () => {
        const md = "# Example h1\n\nSome paragraph text";
        const expected = "<h1>Example h1</h1>\n<p>Some paragraph text</p>";
        const actual = emdx.transpile(md);
        expect(actual).toEqual(expected);
    })
});

describe("Valid markdown with invalid @ blocks", () => {
    let emdx;

    beforeEach(() => {
        emdx = new EMDX();
    });

    it("should transpile as markdown if @ block not recognised", () => {
        const md = "# Example heading\n@oops(){ x+xx<<>>x; }";
        const expected = "<p>@oops(){ x\+xx&#x3C;&#x3C;>>x; }</p>";
        const literalDocTypePlugin = new LiteralDocTypePlugin();
        const actual = emdx.transpile(md, null, literalDocTypePlugin);
        expect(actual).toContain(expected);
    });

    it("should transpile as markdown if parameters are malformed", () => {
        const md = "@oops(exo = \"\"){ x+xx<<>>x; }";
        const expected = "<p>@oops(exo = \"\"){ x\+xx&#x3C;&#x3C;>>x; }</p>";
        const literalDocTypePlugin = new LiteralDocTypePlugin();
        const actual = emdx.transpile(md, null, literalDocTypePlugin);
        expect(actual).toContain(expected);
    });

    it("should transpile as markdown if body is malformed", () => {
        const md = "@oops() x+xx<<>>x; }";
        const expected = "<p>@oops() x\+xx&#x3C;&#x3C;>>x; }</p>";
        const literalDocTypePlugin = new LiteralDocTypePlugin();
        const actual = emdx.transpile(md, null, literalDocTypePlugin);
        expect(actual).toContain(expected);
    });
})