import { existsSync, writeFileSync } from "fs";
import path from "path";
import { ContentProcessor, createDirectory, deepLog, PostProcessor, PreProcessor } from "../../emdd.js";

export default class LiterateProgram {

    generate(config) {

    }
}

export class FileContentProcessor extends ContentProcessor {
    constructor() {
        super("file");
    }

    transform(block) {
        return "";
    }
}

export class FilePostProcessor extends PostProcessor {

    _files;
    _fragments;
    _parentDirectory;

    constructor(parentDirectory = "") {
        super();
        this._fragments = [];
        this._files = [];
        this._parentDirectory = parentDirectory;
    }

    transform(blocks) {
        // deepLog(blocks);
        this.findFilesAndFragments(blocks);
        // console.log("FILES:")
        // deepLog(this._files)
        // console.log("FRAGMENTS:")
        // deepLog(this._fragments)

        // for each file in files
        // 1. let fileFragments be an empty array
        // 2. for each fragment in fragments
        //   1. if fragment.fileId = file.id
        //     1. push fragment into fileFragments
        // 3. let fileContent be the result of weaving file fragments
        // 4. output fileContent to file location
        this._files.forEach(file => {
            const fileFragmentsFound = this._fragments.filter(fragment => fragment.fileId === file.id);
            const fileContent = this.weaveFragments(fileFragmentsFound);
            const outputPath = path.resolve(this._parentDirectory, file.dir, file.name);
            createDirectory(path.dirname(outputPath), true, true);
            writeFileSync(outputPath, fileContent, "utf-8");
        });
        return blocks;
    }

    weaveFragments(fileFragments) {
        const structure = fileFragments.find(fragment => fragment.type === "structure");
        if (!structure) return "NO STRUCTURE FOUND";

        const fragments = fileFragments.filter(fragment => fragment.type === "fragment");
        if (fragments.length === 0) return "NO FRAGMENTS FOUND FOR STRUCTURE";

        let depth = 0;
        let output = structure.value;
        while (output.match(/<<[^>]*>>/g)) {
            if (depth >= 10000) return "MAX FRAGMENT SEARCH DEPTH EXCEEDED";
            fragments.forEach(fragment => {
                if (output.includes(`<<${fragment.name}>>`)) {
                    output = output.replace(`<<${fragment.name}>>`, fragment.value);
                }
            });
            depth++;
        }
        return output;
    }

    addFragment(fragment) {
        this._fragments.push(fragment);
    }
 
    findFilesAndFragments(blocks) {
        for (const block of blocks) {
            this.addIfFile(block);
            this.addIfFragment(block);
        }
    }

    addIfFile(block) {
        if (block.srcBlock.identifier === "file") {
            let name = null;
            let dir = null;
            let id = null;
            
            block.srcBlock.parameters.forEach(param => {
                if (param.name === "name") name = param.value;
                if (param.name === "dir") dir = param.value;
                if (param.name === "id") id = param.value;
            });
            this._files.push(new FilePluginData(name, dir, id));
        }
    }

    addIfFragment(block) {
        if (block.srcBlock.identifier === "fragment") {
            let type = "fragment";
            let name = null;
            let fileId = null;

            block.srcBlock.parameters.forEach(param => {
                if (param.name === "name") name = param.value;
                if (param.name === "type") type = param.value;
                if (param.name === "file") fileId = param.value;
            })
            this._fragments.push(new Fragment(name, type, fileId, block.srcBlock.value.value));
        }
    }
}

class Fragment {
    _type;
    _fileId;
    _name;
    _value;

    constructor(name, type, fileId, value) {
        this._name = name;
        this._type = type;
        this._fileId = fileId;
        this._value = value;
    }

    get type() { return this._type; }
    get fileId() { return this._fileId; }
    get name() { return this._name; }
    get value() { return this._value; }
}

class FilePluginData {
    _name;
    _dir;
    _id;

    constructor(name, dir, id) {
        this._name = name;
        this._dir = dir;
        this._id = id;
    }

    get name() { return this._name; }
    get dir() { return this._dir; }
    get id() { return this._id; }
}

export class FragmentContentProcessor extends ContentProcessor {

    constructor() {
        super("fragment");
    }

    transform(block) {
        return `<pre><code>${block.value.value}</code></pre>`;
    }
}