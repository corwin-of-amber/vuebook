<template>
    <Command class="root dialog-lightweight"
             :visible="isOpen" theme="simple" @select-item="onSelect"
             @keydown="onKeydown">
        <Command.Input ref="m" placeholder=">" />
        <Command.List>
            <Command.Empty>No results found.</Command.Empty>

            <template v-for="commands in commandChunks">
                <Command.Item v-for="cmd in commands" :data-value="cmd">
                    {{ cmd }}
                </Command.Item>
                <Command.Separator />
            </template>
        </Command.List>
    </Command>           
</template>

<style scoped>
.root { display: none; }
.root[visible=true] {
    display: block;
}
</style>

<script lang="ts">
import { Component, Vue, Prop, Ref, toNative } from 'vue-facing-decorator';
import { Command } from 'vue-command-palette';
import './index.scss';
import './themes/simple.scss';

@Component({
    emits: ['command'],
    components: { Command, 'Command.Input': Command.Input, 
        'Command.Item': Command.Item, 'Command.Group': Command.Group, 
        'Command.Empty': Command.Empty, 'Command.Separator': Command.Separator,
        'Command.List': Command.List }
})
class CommandPalette extends Vue {
    @Prop commands: string[] | string[][]
    @Ref m: typeof Command.Input
    isOpen = false

    Command: typeof Command  /* for vscode */

    onSelect(e: {value: string}) {
        this.$emit('command', {command: e.value});
        this.close();
    }

    open() {
        this.isOpen = true;
        requestAnimationFrame(() => this.m.$el.focus());
    }

    close() { this.isOpen = false; }

    get commandChunks() {
        let c = this.commands;
        return Array.isArray(c[0]) ? c : [c];
    }

    onKeydown(ev: KeyboardEvent) {
        if (ev.key === 'Escape') this.close();
    }
}

export { CommandPalette as ICommandPalette }
export default toNative(CommandPalette)
</script>