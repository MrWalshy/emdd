export default class ContentProcessor {
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

    /**
     * Parses the given block, returning a string.
     * 
     * May have side effects.
     * @param {*} block 
     */
    transform(block) {
        throw UnimplementedError("Not implemented: Plugin unable to parse @ block");
    }
}