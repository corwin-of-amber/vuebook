import {EventEmitter} from 'events';
import {EditorView, keymap} from '@codemirror/view';
import {defaultKeymap, history, historyKeymap, indentWithTab} from '@codemirror/commands';
import {EditorState, StateField} from '@codemirror/state';
import {defaultHighlightStyle, indentUnit, syntaxHighlighting} from '@codemirror/language';
import {python, pythonLanguage} from '@codemirror/lang-python';
import {autocompletion, Completion, CompletionContext} from '@codemirror/autocomplete';

interface ICodeEditor {
    new(container: HTMLElement, initialContent: string, completions?: Completion[]): CodeEditor
}

class CodeEditor extends EventEmitter {
    cm: EditorView

    _completions?: Completion[]

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

    get completions(): Completion[] {
        return this._completions;
    }

    set completions(c: Completion[]) {
        this._completions = c;
        this.cm.setState(EditorState.create(
            {doc: this.cm.state.doc, extensions: this.extensions}
        ));
    }
}


namespace Setup {

    export function of(o: CodeEditor) {
        return [extensions(o.completions), operator.init(() => o)];
    }

    export const operator = StateField.define<CodeEditor>({
        create() {
            return null;
        },
        update(v: CodeEditor) {
            return v;
        }
    });

    export const extensions = completions => [
        keymap.of(defaultKeymap), keymap.of(historyKeymap),
        keymap.of([indentWithTab]),
        history(),
        syntaxHighlighting(defaultHighlightStyle), indentUnit.of('    '),
        updateListener(), nav(),
        autocompletion(),
        python(),
        pythonLanguage.data.of({autocomplete: context => autoCompletion(context, completions)})
    ];

    function updateListener() {
        return EditorView.updateListener.of(v => {
            if (v.docChanged) v.state.field(operator).emit('change');
        });
    }

    function nav() {
        let emit = (type: string) => (cm: EditorView) =>
            cm.state.field(operator).emit('action', {type});
        return keymap.of([
            {key: "Shift-Enter", run: emit('exec-fwd')},
            {key: "Mod-Enter", run: emit('exec')},
            {key: "Ctrl-=", run: emit('insert-after')},
            {key: "Ctrl-+", run: emit('insert-before')},
            {key: "Ctrl--", run: emit('delete')},
            {key: "ArrowUp", run: emit('go-up')},
            {key: "ArrowDown", run: emit('go-down')},
            {key: 'Ctrl-Shift-+', run: emit('expand-all')},
            {key: 'Ctrl-Shift--', run: emit('collapse-all')},
        ]);
    }

    export function autoCompletion(context: CompletionContext, completions: Completion[] = []) {
        let word = context.matchBefore(/\w*/)
        if (word.from == word.to && !context.explicit)
            return null
        return {
            from: word.from,
            options: completions
        }
    }

}

export {EditorView} from '@codemirror/view';
export {Completion} from '@codemirror/autocomplete';
export {CodeEditor, ICodeEditor, Setup}