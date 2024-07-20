<template>
    <div>
        <command-palette ref="cmd" :commands="commands" @command="onCommand"/>
        <notebook ref="notebook" :model="model" :options="_options"
           @cell:action=""/>
    </div>
</template>

<script lang="ts">
import { reactive, watch } from 'vue';
import { Component, Vue, toNative } from 'vue-facing-decorator';
import { useMagicKeys } from '@vueuse/core';

import { ModelImpl } from '../model';
import { NotebookActions } from '../control';
import { Options } from '../options';
//@ts-ignore
import Notebook, { INotebook } from './notebook.vue';
//@ts-ignore
import CommandPalette, { ICommandPalette } from './command-palette/index.vue';

@Component({
  components: { Notebook, CommandPalette }
})
class App extends Vue {
    model: ModelImpl
    control: NotebookActions
    options: Options

    commands = ["exec", "exec-fwd", "insert-after", "go-down", "delete", "clear"]

    $refs: {cmd: ICommandPalette, notebook: INotebook}

    get _options() { return Options.fillin(this.options); }

    created() {
        this.model = reactive(new ModelImpl()).load();
        window.addEventListener('beforeunload', () => this.model.save());

        const keys = useMagicKeys()
        watch(keys['Meta+K'], (v) => v && this.$refs.cmd.open());
        watch(keys['Escape'], (v) => v && this.$refs.cmd.close());
        watch(keys['Down'] , (v) => v && this.$refs.cmd.close())
    }

    onCommand(command: {command: string}) {
        this.$refs.notebook.command(command);
    }
}

export default toNative(App);
</script>