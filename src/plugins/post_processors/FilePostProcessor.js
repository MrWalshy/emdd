import { writeFileSync } from "fs";
import path from "path";
import { createDirectory } from "../../utils/file.js";
import { deepLog } from "../../utils/logging.js";
import PostProcessor from "./PostProcessor.js";

export default class FilePostProcessor extends PostProcessor {

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
        this._fragments = [];
        this._files = [];
        // const output = this.weaveFilesAndFragments(blocks);
        // this.findFilesAndFragments(blocks);
        const files = this.findFiles(blocks);
        const fragments = this.findFragments(blocks);
        const weavedFilesAndFragments = this.weaveFragments(fragments);
        // deepLog(files)
        // deepLog(fragments)
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
        // this._files.forEach(file => {
        //     const fileFragmentsFound = this._fragments.filter(fragment => fragment.fileId === file.id);
        //     const fileContent = this.weaveFragments(fileFragmentsFound);
        //     const outputPath = path.resolve(this._parentDirectory, file.dir, file.name);
        //     createDirectory(path.dirname(outputPath), true, true);
        //     writeFileSync(outputPath, fileContent, "utf-8");
        // });
        // update blocks with new values
        return blocks;
    }

    weaveFragments(fragments) {
        // weave the fragments together
        console.log("HERE")
        let weavedFragments = fragments;
        for (let i = 0; i < 3; i++) {
            let temp = [];
            weavedFragments.forEach(fragment => {
                // if (fragment.type === "fragment") {
                    let newValue = fragment.value;
                    weavedFragments.forEach(innerFragment => {
                        newValue = newValue.replace(`<<${innerFragment.name}>>`, innerFragment.value);
                    });
                    temp.push(new Fragment(fragment.name, fragment.type, fragment.fileId, newValue, fragment.block));
                // } else weavedFragments.push(fragment); // weave structures last
            });
            weavedFragments = temp;
        }
        return weavedFragments;
    }

    weave(fragment, fragments) {
        fragmen
    }

    // weaveFragments(fileFragments) {
    //     const structure = fileFragments.find(fragment => fragment.type === "structure");
    //     if (!structure) return "NO STRUCTURE FOUND";

    //     const fragments = fileFragments.filter(fragment => fragment.type === "fragment");
    //     if (fragments.length === 0) return "NO FRAGMENTS FOUND FOR STRUCTURE";

    //     // weave the fragments together
    //     const weavedFragments = [];
    //     fragments.forEach(fragment => {
    //         let newValue = fragment.value;
    //         fragments.forEach(innerFragment => {
    //             newValue = newValue.replace(`<<${innerFragment.name}>>`, innerFragment.value);
    //         });
    //         weavedFragments.push(new Fragment(fragment.name, fragment.type, fragment.fileId, newValue));
    //     });
    //     deepLog(weavedFragments)

    //     // weave the weaved fragments to the structure

    //     let depth = 0;
    //     let output = structure.value;
    //     while (output.match(/<<[^>]*>>/g)) {
    //         if (depth >= 100) return "MAX FRAGMENT SEARCH DEPTH EXCEEDED";
    //         weavedFragments.forEach(fragment => {
    //             if (output.includes(`<<${fragment.name}>>`)) {
    //                 output = output.replace(`<<${fragment.name}>>`, fragment.value);
    //             }
    //         });
    //         depth++;
    //     }
    //     return output;
    // }

    findFiles(blocks) {
        const files = [];

        blocks.forEach(block => {
            if (block.srcBlock.identifier === "file") {
                let name = null;
                let dir = null;
                let id = null;
                
                block.srcBlock.parameters.forEach(param => {
                    if (param.name === "name") name = param.value;
                    if (param.name === "dir") dir = param.value;
                    if (param.name === "id") id = param.value;
                });
                files.push(new FilePluginData(name, dir, id, block));
            }
        });
        return files;
    }

    findFragments(blocks) {
        const fragments = [];

        blocks.forEach(block => {
            if (block.srcBlock.identifier === "fragment") {
                let type = "fragment";
                let name = null;
                let fileId = null;
    
                block.srcBlock.parameters.forEach(param => {
                    if (param.name === "name") name = param.value;
                    if (param.name === "type") type = param.value;
                    if (param.name === "file") fileId = param.value;
                })
                fragments.push(new Fragment(name, type, fileId, block.srcBlock.value.value, block));
            }
        });
        return fragments;
    }

}

class Fragment {
    _type;
    _fileId;
    _name;
    _value;
    _block;

    constructor(name, type, fileId, value, block) {
        this._name = name;
        this._type = type;
        this._fileId = fileId;
        this._value = value;
        this._block = block;
    }

    get type() { return this._type; }
    get fileId() { return this._fileId; }
    get name() { return this._name; }
    get value() { return this._value; }
    get block() { return this._block; }
}

class FilePluginData {
    _name;
    _dir;
    _id;
    _block;

    constructor(name, dir, id, block) {
        this._name = name;
        this._dir = dir;
        this._id = id;
        this._block = block;
    }

    get name() { return this._name; }
    get dir() { return this._dir; }
    get id() { return this._id; }
    get block() { return this._block; }
}