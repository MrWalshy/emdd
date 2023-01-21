import { util } from "prettier";

export function deepLog(obj) {
    console.log(util.inspect(obj, {
        showHidden: false,
        depth: null,
        colors: true
    }));
}