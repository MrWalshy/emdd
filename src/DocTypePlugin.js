export default class DocTypePlugin {
    /**
     * Transforms the given content into a document such as React component or HTML document.
     * @param {*} content 
     * @param {*} args 
     */
    transform(content, args) {
        throw Error("Not implemented: Plugin unable to transform document");
    }
}