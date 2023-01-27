import { UnimplementedError } from "../../Parser.js";

export default class PreProcessor {
    _name;
    _parameters;

    constructor(name = "", parameters = []) {
        this._name = name;
        this._parameters = parameters;
    }

    get name() { return this._name; }
    set name(name) { this._name = name; }
    get parameters() { return this._parameters; }
    set parameters(parameters) { this._parameters = parameters; }

    // Don't return anything from `transform()` if the pre-processor removes
    // a block, otherwise return the pre-processed block
    transform(block) {
        throw new UnimplementedError("PreProcessor: transform() not implemented");
    }
}