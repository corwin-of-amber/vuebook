import {EventEmitter} from 'events';
import {Prec} from '@codemirror/state';
import {EditorView, keymap} from '@codemirror/view';
import {defaultKeymap, history, historyKeymap, indentWithTab} from '@codemirror/commands';
import {EditorState, StateField, Compartment} from '@codemirror/state';
import {defaultHighlightStyle, indentUnit, syntaxHighlighting,
        bracketMatching} from '@codemirror/language';
import {pythonLanguage} from '@codemirror/lang-python';
import {autocompletion, Completion, CompletionContext} from '@codemirror/autocomplete';

interface ICodeEditor {
    new(container: HTMLElement, initialContent: string, completions?: Completion[]): CodeEditor
}

class CodeEditor extends EventEmitter {
    cm: EditorView

    _completions: Completion[]

    constructor(container: HTMLElement, initialContent: string = '') {
        super();
        this.cm = new EditorView({
            doc: initialContent,
            extensions: this.extensions,
            parent: container
        });
        this._completions = [];
    }

    get() {
        return this.cm.state.sliceDoc();
    }

    set(text: string) {
        this.cm.setState(EditorState.create(
            {doc: text, extensions: this.extensions}));
    }

    focus() {
        this.cm.focus();
    }

    get extensions() {
        return Setup.of(this);
    }

    set language(v: string) {
        this.cm.dispatch({
            effects: Setup.languageConf.reconfigure(CodeEditor.Languages[v] ?? [])
        });
    }

    get completions(): Completion[] {
        return this._completions;
    }

    set completions(c: Completion[]) {
        this._completions = c;
    }

    static lookupCompletions = {
        async get(prefix: string, word: string): Promise<Completion[] | undefined> {
            return undefined;
        }
    };

    static Languages = {};
}


namespace Setup {

    export const languageConf = new Compartment;

    export function of(o: CodeEditor, lang = 'python') {
        return [extensions, operator.init(() => o),
                languageConf.of(CodeEditor.Languages[lang] ?? [])];
    }

    /**
     * Maintains a reference to the `CodeEditor`, for use in editor actions 
     * in order to submit events.
     */
    export const operator = StateField.define<CodeEditor>({
        create() {
            return null;
        },
        update(v: CodeEditor) {
            return v;
        }
    });

    export const extensions = [
        keymap.of(defaultKeymap), keymap.of(historyKeymap),
        keymap.of([indentWithTab]),
        history(),
        syntaxHighlighting(defaultHighlightStyle), indentUnit.of('    '),
        bracketMatching(),
        updateListener(), nav(),
        autocompletion()
    ];

    export const basicAutocomplete =
        pythonLanguage.data.of({
            autocomplete: (context: CompletionContext) => 
                autoCompletion(context, context.state.field(operator).completions)
        });

    function updateListener() {
        return EditorView.updateListener.of(v => {
            if (v.docChanged) v.state.field(operator).emit('change');
        });
    }

    function nav() {
        let emit = (type: string) => (cm: EditorView) =>
            cm.state.field(operator).emit('action', {type});
        let emit2 = (base: string, shifted: string) => (cm: EditorView, ev?: KeyboardEvent) =>
            (ev?.shiftKey ? emit(shifted) : emit(base))(cm);
        return [
            /* These should override shortcuts of other maps (incl. default) */
            Prec.high(keymap.of([
                {key: "Shift-Enter", run: emit('exec-fwd')},
                {key: "Mod-Enter", run: emit('exec')},
            ])),
            keymap.of([
                {key: "Ctrl-=", run: emit2('insert-after', 'insert-before')},
                {key: "Ctrl--", run: emit('delete')},
                /** @todo these shortcuts are not good (`Shift-+` has no meaning) */
                //{key: 'Ctrl-Shift-+', run: emit('expand-all')},
                //{key: 'Ctrl-Shift--', run: emit('collapse-all')},
            ]),
            /* These should *only* be called when default mapping rejects them
             * (i.e. at beginning/end of cell) */
            Prec.low(keymap.of([
                {key: "ArrowUp", run: emit('go-up')},
                {key: "ArrowDown", run: emit('go-down')},
            ]))];
    }

    export async function autoCompletion(context: CompletionContext, completions: Completion[] = []) {
        let word = context.matchBefore(/\w*/),
            qual = context.matchBefore(/[.\w]*/),
            prefix = qual.text.slice(0, -word.text.length - 1)

        let ns = await CodeEditor.lookupCompletions.get(prefix, word.text);
        if (ns) {
            return {from: word.from, options: ns};
        }

        if (word.from == word.to && !context.explicit)
            return null
        return {
            from: word.from,
            options: completions  /** @todo filter by prefix? or does CodeMirror do that already? */
        }
    }

    CodeEditor.Languages['python'] =
        [pythonLanguage.extension, Setup.basicAutocomplete];
}


export {EditorView} from '@codemirror/view';
export {Completion} from '@codemirror/autocomplete';
export {CodeEditor, ICodeEditor, Setup}