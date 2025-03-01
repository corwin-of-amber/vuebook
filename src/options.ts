
type Options = {
    collapsible?: boolean
    editor: {
        completions: {label: string}[]
    }
}

namespace Options {

    export const DEFAULTS: Options = {
        collapsible: true,
        editor: {
            completions: []
        }
    }

    export function fillin(opts: Options) {
        // @todo nested
        return Object.assign({}, DEFAULTS, opts);
    }

}

export {Options}