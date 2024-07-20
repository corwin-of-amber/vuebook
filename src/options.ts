
type Options = {
    collapsible?: boolean
}

namespace Options {

    export const DEFAULTS: Options = {
        collapsible: true
    }

    export function fillin(opts: Options) {
        return Object.assign({}, DEFAULTS, opts);
    }

}

export {Options}