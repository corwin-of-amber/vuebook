import {EventEmitter} from 'events';
import {EditorView, keymap} from '@codemirror/view';
import {defaultKeymap, history, historyKeymap, indentWithTab} from '@codemirror/commands';
import {EditorState, StateField} from '@codemirror/state';
import {defaultHighlightStyle, indentUnit, syntaxHighlighting} from '@codemirror/language';
import {pythonLanguage} from '@codemirror/lang-python';
import {autocompletion, Completion, CompletionContext, completeFromList} from '@codemirror/autocomplete';

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
}


namespace Setup {

    export function of(o: CodeEditor) {
        return [extensions, operator.init(() => o),
                basicAutocomplete(o)];
    }

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
        updateListener(), nav(),
        autocompletion(),
        pythonLanguage.extension
    ];

    export function basicAutocomplete(o: CodeEditor) {
        return pythonLanguage.data.of({
            autocomplete: (context: CompletionContext) => 
                autoCompletion(context, o.completions)
        });
    }

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
            {key: "Ctrl-Shift-=", run: emit('insert-before')},
            {key: "Ctrl--", run: emit('delete')},
            {key: "ArrowUp", run: emit('go-up')},
            {key: "ArrowDown", run: emit('go-down')},
            /** @todo these shortcuts are not good (`Shift-+` has no meaning) */
            //{key: 'Ctrl-Shift-+', run: emit('expand-all')},
            //{key: 'Ctrl-Shift--', run: emit('collapse-all')},
        ]);
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
            options: completions
        }
    }
}


const DIR = {
    'os': ['CLD_CONTINUED', 'CLD_DUMPED', 'CLD_EXITED', 'CLD_KILLED', 'CLD_STOPPED', 'CLD_TRAPPED', 'DirEntry', 'EX_CANTCREAT', 'EX_CONFIG', 'EX_DATAERR', 'EX_IOERR', 'EX_NOHOST', 'EX_NOINPUT', 'EX_NOPERM', 'EX_NOUSER', 'EX_OK', 'EX_OSERR', 'EX_OSFILE', 'EX_PROTOCOL', 'EX_SOFTWARE', 'EX_TEMPFAIL', 'EX_UNAVAILABLE', 'EX_USAGE', 'F_LOCK', 'F_OK', 'F_TEST', 'F_TLOCK', 'F_ULOCK', 'GenericAlias', 'Mapping', 'MutableMapping', 'NGROUPS_MAX', 'O_ACCMODE', 'O_APPEND', 'O_ASYNC', 'O_CLOEXEC', 'O_CREAT', 'O_DIRECTORY', 'O_DSYNC', 'O_EVTONLY', 'O_EXCL', 'O_EXEC', 'O_EXLOCK', 'O_FSYNC', 'O_NDELAY', 'O_NOCTTY', 'O_NOFOLLOW', 'O_NOFOLLOW_ANY', 'O_NONBLOCK', 'O_RDONLY', 'O_RDWR', 'O_SEARCH', 'O_SHLOCK', 'O_SYMLINK', 'O_SYNC', 'O_TRUNC', 'O_WRONLY', 'POSIX_SPAWN_CLOSE', 'POSIX_SPAWN_DUP2', 'POSIX_SPAWN_OPEN', 'PRIO_DARWIN_BG', 'PRIO_DARWIN_NONUI', 'PRIO_DARWIN_PROCESS', 'PRIO_DARWIN_THREAD', 'PRIO_PGRP', 'PRIO_PROCESS', 'PRIO_USER', 'P_ALL', 'P_NOWAIT', 'P_NOWAITO', 'P_PGID', 'P_PID', 'P_WAIT', 'PathLike', 'RTLD_GLOBAL', 'RTLD_LAZY', 'RTLD_LOCAL', 'RTLD_NODELETE', 'RTLD_NOLOAD', 'RTLD_NOW', 'R_OK', 'SCHED_FIFO', 'SCHED_OTHER', 'SCHED_RR', 'SEEK_CUR', 'SEEK_DATA', 'SEEK_END', 'SEEK_HOLE', 'SEEK_SET', 'ST_NOSUID', 'ST_RDONLY', 'TMP_MAX', 'WCONTINUED', 'WCOREDUMP', 'WEXITED', 'WEXITSTATUS', 'WIFCONTINUED', 'WIFEXITED', 'WIFSIGNALED', 'WIFSTOPPED', 'WNOHANG', 'WNOWAIT', 'WSTOPPED', 'WSTOPSIG', 'WTERMSIG', 'WUNTRACED', 'W_OK', 'X_OK', '_Environ', '__all__', '__builtins__', '__doc__', '__file__', '__loader__', '__name__', '__package__', '__spec__', '_check_methods', '_execvpe', '_exists', '_exit', '_fspath', '_fwalk', '_fwalk_close', '_fwalk_walk', '_fwalk_yield', '_get_exports_list', '_spawnvef', '_walk_symlinks_as_files', '_wrap_close', 'abc', 'abort', 'access', 'altsep', 'chdir', 'chflags', 'chmod', 'chown', 'chroot', 'close', 'closerange', 'confstr', 'confstr_names', 'cpu_count', 'ctermid', 'curdir', 'defpath', 'device_encoding', 'devnull', 'dup', 'dup2', 'environ', 'environb', 'error', 'execl', 'execle', 'execlp', 'execlpe', 'execv', 'execve', 'execvp', 'execvpe', 'extsep', 'fchdir', 'fchmod', 'fchown', 'fdopen', 'fork', 'forkpty', 'fpathconf', 'fsdecode', 'fsencode', 'fspath', 'fstat', 'fstatvfs', 'fsync', 'ftruncate', 'fwalk', 'get_blocking', 'get_exec_path', 'get_inheritable', 'get_terminal_size', 'getcwd', 'getcwdb', 'getegid', 'getenv', 'getenvb', 'geteuid', 'getgid', 'getgrouplist', 'getgroups', 'getloadavg', 'getlogin', 'getpgid', 'getpgrp', 'getpid', 'getppid', 'getpriority', 'getsid', 'getuid', 'grantpt', 'initgroups', 'isatty', 'kill', 'killpg', 'lchflags', 'lchmod', 'lchown', 'linesep', 'link', 'listdir', 'lockf', 'login_tty', 'lseek', 'lstat', 'major', 'makedev', 'makedirs', 'minor', 'mkdir', 'mkfifo', 'mknod', 'name', 'nice', 'open', 'openpty', 'pardir', 'path', 'pathconf', 'pathconf_names', 'pathsep', 'pipe', 'popen', 'posix_openpt', 'posix_spawn', 'posix_spawnp', 'pread', 'preadv', 'process_cpu_count', 'ptsname', 'putenv', 'pwrite', 'pwritev', 'read', 'readlink', 'readv', 'register_at_fork', 'remove', 'removedirs', 'rename', 'renames', 'replace', 'rmdir', 'scandir', 'sched_get_priority_max', 'sched_get_priority_min', 'sched_yield', 'sendfile', 'sep', 'set_blocking', 'set_inheritable', 'setegid', 'seteuid', 'setgid', 'setgroups', 'setpgid', 'setpgrp', 'setpriority', 'setregid', 'setreuid', 'setsid', 'setuid', 'spawnl', 'spawnle', 'spawnlp', 'spawnlpe', 'spawnv', 'spawnve', 'spawnvp', 'spawnvpe', 'st', 'stat', 'stat_result', 'statvfs', 'statvfs_result', 'strerror', 'supports_bytes_environ', 'supports_dir_fd', 'supports_effective_ids', 'supports_fd', 'supports_follow_symlinks', 'symlink', 'sync', 'sys', 'sysconf', 'sysconf_names', 'system', 'tcgetpgrp', 'tcsetpgrp', 'terminal_size', 'times', 'times_result', 'truncate', 'ttyname', 'umask', 'uname', 'uname_result', 'unlink', 'unlockpt', 'unsetenv', 'urandom', 'utime', 'wait', 'wait3', 'wait4', 'waitid', 'waitid_result', 'waitpid', 'waitstatus_to_exitcode', 'walk', 'write', 'writev'],
    'os.path': ['__all__', '__builtins__', '__doc__', '__file__', '__loader__', '__name__', '__package__', '__spec__', '_get_sep', '_varprog', '_varprogb', 'abspath', 'altsep', 'basename', 'commonpath', 'commonprefix', 'curdir', 'defpath', 'devnull', 'dirname', 'errno', 'exists', 'expanduser', 'expandvars', 'extsep', 'genericpath', 'getatime', 'getctime', 'getmtime', 'getsize', 'isabs', 'isdevdrive', 'isdir', 'isfile', 'isjunction', 'islink', 'ismount', 'join', 'lexists', 'normcase', 'normpath', 'os', 'pardir', 'pathsep', 'realpath', 'relpath', 'samefile', 'sameopenfile', 'samestat', 'sep', 'split', 'splitdrive', 'splitext', 'splitroot', 'stat', 'supports_unicode_filenames', 'sys']
}



export {EditorView} from '@codemirror/view';
export {Completion} from '@codemirror/autocomplete';
export {CodeEditor, ICodeEditor, Setup}