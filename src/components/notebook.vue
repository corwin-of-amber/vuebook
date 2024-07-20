<template>
    <div class="notebook">
        <div v-for="cell in model.cells" :key="keyOf(cell)"
             class="cell-container" :class="{focused: cell === this.focusedCell}"
             @focusin="focusedCell = cell" ref="cellContainers">
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
        cells: ICell[],
        cellContainers: {[key: string]: ICell}
    }

    _keys: AutoIncMap<M.Cell>
    control: NotebookActions
    focusedCell: M.Cell = undefined

    created() {
        this._keys = new AutoIncMap;
        this.control = new NotebookActions(this.model);
    }

    get _options() { return Options.fillin(this.options); }

    cellAction(cell: M.Cell, action: { cell?: M.Cell, type: string }) {
        action = {cell, ...action};
        const cellActionResult = this.control.handleCellAction(action as NotebookActions.CellAction);

        switch (action.type) {
            case 'delete':
                if (cellActionResult != undefined) {
                    this.focusCell(cellActionResult.reply as M.Cell);
                }
                this.cleanup();
                break;
            case 'go-up':
            case 'go-down':
                if (cellActionResult != undefined) {
                    this.focusCell(cellActionResult.reply as M.Cell);
                }
                break;
        }

        this.$emit('cell:action', action);
    }

    command(command: { command: string }) {
        if (this.focusedCell)
            this.cellAction(this.focusedCell, {type: command.command});
    }

    keyOf(cell: M.Cell) {
        return this._keys.getOrAlloc(cell);
    }

    /** Remove deleted cells from key map */
    cleanup() {
        let s = new Set(this.model.cells);
        let redundant = [...this._keys.keys()].filter(k => !s.has(k));
        for (let k of redundant) this._keys.delete(k);

        if (!s.has(this.focusedCell)) this.focusedCell = undefined;
    }

    focusCell(cell: M.Cell) {
        this.focusedCell = cell;
        this.$refs.cellContainers[this.keyOf(cell)].focus();
        this.$refs.cells[this.keyOf(cell)].focus();
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