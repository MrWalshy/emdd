import util from 'util';

export function deepLog(obj) {
    console.log(util.inspect(obj, {
        showHidden: false,
        depth: null,
        colors: true
    }));
}