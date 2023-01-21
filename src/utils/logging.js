import util from 'util';

/**
 * Inspects an object and prints it recursively, with colours enabled.
 * @param {*} obj 
 */
export function deepLog(obj) {
    console.log(util.inspect(obj, {
        showHidden: false,
        depth: null,
        colors: true
    }));
}

/**
 * Logs a single-line title to the console with the given space around the content.
 * 
 * @param {*} content 
 * @param {*} space 
 */
export function logTitleBlock(content, space) {
    const lineLength = content.length + (space * 2);
    const decorativeLine = "=".repeat(lineLength + 6);
    const contentLine = `===${" ".repeat(space)}${content}${" ".repeat(space)}===`;
    console.log(`${decorativeLine}
${contentLine}
${decorativeLine}`);
}