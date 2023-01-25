export default class ContentTransformerPlugin {
    _name;
    _parameters;
    _preProcess;

    constructor(name = "", parameters = [], preProcess = false) {
        this._name = name;
        this._parameters = parameters;
        this._preProcess = preProcess;
    }

    get name() { return this._name; }
    set name(name) { this._name = name; }
    get parameters() { return this._parameters; }
    set parameters(parameters) { this._parameters = parameters; }

    isPreProcessor() { return this._preProcess; }

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