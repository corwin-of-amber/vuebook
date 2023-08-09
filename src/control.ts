import {ModelImpl, Model as M} from './model';


class NotebookActions {

    model: ModelImpl

    constructor(model: ModelImpl) {
        this.model = model;
    }

    handleCellAction(action: NotebookActions.CellAction): NotebookActions.CellActionResult {
        let reply = undefined;
        switch (action.type) {
            case 'exec':
            case 'exec-fwd':
                this.model.clearOutputs(action.cell);
                break;
            case 'insert-after':
                this.insertAfter(action.cell);
                break;
            case 'delete':
                this.model.delete(action.cell);
                break;
            case 'go-down':
                reply = this.goDown(action.cell);
                break;
            default:
                console.warn(action)
        }

        return {action: action.type, reply: reply}
    }

    _cellIndex(cell: M.Cell) {
        return this.model.cells.indexOf(cell);
    }

    goDown(focusedCell: M.Cell) {
        let focusedCellIndex = this._cellIndex(focusedCell);
        console.log("fci1 = " + focusedCellIndex);
        if (focusedCellIndex == this.model.cells.length - 1) {
            focusedCellIndex = this._cellIndex(this.insertAfter(focusedCell));
            console.log("fci2 = " + focusedCellIndex);
        }

        return this.model.cells[focusedCellIndex + 1]

    }

    insertAfter(cell: M.Cell) : M.Cell {
        const newCell = this.model.mkCodeCell();
        this.model.insert(cell, newCell, true);
        return newCell;
    }
}


namespace NotebookActions {
    export interface CellAction {
        type: string
        cell: M.Cell
    }

    export interface CellActionResult {
        action: string
        reply?: any
    }
}


export {NotebookActions}