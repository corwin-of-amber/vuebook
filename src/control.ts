import {Model as M, ModelImpl} from './model';


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
                if (action.type === 'exec-fwd')
                    reply = this.goDown(action.cell);
                break;
            case 'insert-after':
                reply = this.insertAfter(action.cell);
                break;
            case 'delete':
                reply = this.model.delete(action.cell);
                break;
            case 'go-up':
                reply = this.goUp(action.cell);
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

    goUp(focusedCell: M.Cell) {
        let focusedCellIndex = this._cellIndex(focusedCell);
        if (focusedCellIndex != 0) {
            focusedCellIndex -= 1;
        }
        return this.model.cells[focusedCellIndex]
    }

    goDown(focusedCell: M.Cell) {
        let focusedCellIndex = this._cellIndex(focusedCell);
        if (focusedCellIndex != this.model.cells.length - 1) {
            focusedCellIndex += 1
        }

        return this.model.cells[focusedCellIndex]
    }

    insertAfter(cell: M.Cell): M.Cell {
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