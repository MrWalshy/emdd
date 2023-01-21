import { existsSync, mkdirSync, readdirSync, rmSync } from 'fs';
import path from 'path';

export function createDirectory(dir, dropIfExists = false, recursive = false) {
    const dirExists = existsSync(dir);
    if (dirExists && !dropIfExists) return;
    if (dirExists && dropIfExists) rmSync(dir, { force: true, recursive: recursive });
    mkdirSync(dir, { recursive: recursive });
    // console.log(`Created directory with configuration:
    //          dir: ${dir}
    // dropIfExists: ${dropIfExists}
    //    recursive: ${recursive}`);
}

export function getPathsOfType(type, dir, recursive=true) {
    // console.log("Getting paths of type '" + type + "' from '" + dir + "'");
    
    const files = getFiles(dir);
    const filesOfType = files.filter(file => path.extname(file.name) === `.${type}`)
                             .map(file => path.resolve(dir, file.name));
                            //  .map(file => file.name);
    if (recursive) {
        // get nested files
        const nestedFiles = files.filter(file => file.isDirectory())
                             .map(nestedDir => getPathsOfType(type, path.resolve(dir, nestedDir.name)))
                             .filter(files => files.length > 0);
        // if nested file is an array, push its spread into matching filesOfType x
        // otherwise push the name of the file and its directories relative to teh config
        if (nestedFiles.length > 0) nestedFiles.forEach(nestedFile => {
            if (nestedFile.length) filesOfType.push(...nestedFile);
            else filesOfType.push(nestedFile);
        });
    }
    return filesOfType;
}

export function getFiles(dir) {
    return readdirSync(dir, { withFileTypes: true });
}