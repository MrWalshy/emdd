import { JSPlugin } from '../src/plugins.js'

describe("Valid JavaScript block parsing", () => {
    let plugin;

    beforeEach(() => {
        plugin = new JSPlugin();
    });

    it("should return the result of an operation", () => {
        const js = "return 5 + 5;";
        const block = { value: js }
        const expected = 10;
        expect(plugin.parseAtBlock(block)).toEqual(expected);
    });

    it("should share variables via a context", () => {
        const blockOne = { value: "context.i = 30;" };
        const blockTwo = { value: "return context.i;"};
        const expected = 30;
        plugin.parseAtBlock(blockOne);
        expect(plugin.parseAtBlock(blockTwo)).toEqual(expected);
    });
})