<template>
    <div class="notebook">
        <div v-for="cell in model.cells" :key="keyOf(cell)"
             class="cell-container" :class="{focused: cell === focusedCell}"
             @focusin="focusedCell = cell">
            <cell :model="cell" ref="cells" :options="_options" @action="cellAction(cell, $event)"/>
        </div>
    </div>
</template>

<style>
.focused {
    border-left: 3px solid blue;
    margin-left: -3px;
}
</style>

<script lang="ts">
import * as vue from 'vue';
import {Component, Prop, toNative, Vue} from 'vue-facing-decorator';
import {NotebookActions} from '../control';
import type {Model as M, ModelImpl} from '../model';
import {Options} from '../options';
// @ts-ignore
import Cell, {ICell} from './cell.vue';

@Component({
    emits: ["cell:action"],
    components: {Cell}
})
class INotebook extends Vue {
    @Prop model: ModelImpl
    @Prop options: Options
    $refs: {
        cells: ICell[]
    }

    _keys: AutoIncMap<M.Cell>
    control: NotebookActions
    focusedCell: M.Cell = undefined
    executingCell: NotebookActions.CellAction

    created() {
        this._keys = new AutoIncMap;
        this.$watch('model', m =>
            this.control = new NotebookActions(m),
            {immediate: true}
        );
    }

    get _options() { return Options.fillin(this.options); }

    get toc() {
        this.model.cells.length; // edict dependency on the list
        return Object.fromEntries(
            this.$refs.cells.map(x => [this.keyOf(x.model), x]));
    }

    cellAction(cell: M.Cell, action: Partial<NotebookActions.CellAction>) {
        let cellAction = {cell, ...action} as NotebookActions.CellAction;
        const cellActionResult = this.control.handleCellAction(cellAction);

        switch (action.type) {
            case 'exec':
            case 'exec-fwd':
                this.executingCell = cellAction;
                break;
        }

        this.cleanup();

        if (cellActionResult?.reply != undefined) {
            requestAnimationFrame(() =>
                this.focusCell(cellActionResult.reply));
        }

        this.$emit('cell:action', cellAction);
    }

    command(command: { command: string }) {
        if (this.focusedCell)
            this.cellAction(this.focusedCell, {type: command.command});
    }

    keyOf(cell: M.Cell) {
        return this._keys.getOrAlloc(vue.toRaw(cell));
    }

    /** Remove deleted cells from key map */
    cleanup() {
        let s = new Set(this.model.cells.map(x => vue.toRaw(x)));
        let redundant = [...this._keys.keys()].filter(k => !s.has(k));
        for (let k of redundant) this._keys.delete(k);

        if (!s.has(this.focusedCell)) this.focusedCell = undefined;
    }

    focusCell(cell: M.Cell) {
        this.focusedCell = cell;
        let viewCell = this.toc[this.keyOf(cell)];
        if (viewCell) {
            viewCell.$el.closest('.cell-container')?.focus();
            viewCell.focus();
        }
    }

    expandAll() {
        this.$refs.cells.forEach(c => c.expand());
    }

    collapseAll() {
        this.$refs.cells.forEach(c => c.collapse());
    }

}

/** Auxiliary for cell keys */
class AutoIncMap<K> extends Map<K, number> {
    _fresh = -1

    getOrAlloc(k: K) {
        let v = this.get(k);
        if (v === undefined)
            this.set(k, v = ++this._fresh);
        return v;
    }
}


export {INotebook}
export default toNative(INotebook);
</script>