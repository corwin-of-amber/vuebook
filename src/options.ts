
type Options = {
    collapsible?: boolean
    editor: {
        completions: {label: string}[],
        virtualKeyboard: boolean
    }
}

namespace Options {

    export const DEFAULTS: Options = {
        collapsible: true,
        editor: {
            completions: [],
            virtualKeyboard: true
        }
    }

    export function fillin(opts: Options) {
        // @todo nested
        return Object.assign({}, DEFAULTS, opts);
    }

}

export {Options}