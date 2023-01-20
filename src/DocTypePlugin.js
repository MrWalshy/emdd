export default class DocTypePlugin {
    _lastSrc = "";
    _lastArgs = {};
    /**
     * Transforms the given content into a document such as React component or HTML document.
     * @param {*} content 
     * @param {*} args 
     */
    transform(content, args) {
        throw Error("Not implemented: Plugin unable to transform document");
    }

    get previousSrc() { return this._lastSrc; }
    get previousArgs() { return this._lastArgs; }
}

export class CompositeDocTypePlugin extends DocTypePlugin {
    _plugins;

    constructor(plugins) {
        this._plugins = plugins;
    }
}