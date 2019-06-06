"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Vendor modules
const actionTypes = __importStar(require("@nteract/actions"));
const commutable_1 = require("@nteract/commutable");
const types_1 = require("@nteract/types");
const escape_carriage_1 = require("escape-carriage");
const immutable_1 = require("immutable");
const lodash_1 = require("lodash");
const v4_1 = __importDefault(require("uuid/v4"));
/**
 * An output can be a stream of data that does not arrive at a single time. This
 * function handles the different types of outputs and accumulates the data
 * into a reduced output.
 *
 * @param {Object} outputs - Kernel output messages
 * @param {Object} output - Outputted to be reduced into list of outputs
 * @return {List<Object>} updated-outputs - Outputs + Output
 */
function reduceOutputs(outputs = immutable_1.List(), output) {
    // Find the last output to see if it's a stream type
    // If we don't find one, default to null
    const last = outputs.last(null);
    if (!last || !last.output_type) {
        return outputs.push(commutable_1.createImmutableOutput(output));
    }
    if (output.output_type !== "stream" || last.output_type !== "stream") {
        // If the last output type or the incoming output type isn't a stream
        // we just add it to the outputs
        // This is kind of like a "break" between streams if we get error,
        // display_data, execute_result, etc.
        return outputs.push(commutable_1.createImmutableOutput(output));
    }
    const streamOutput = output;
    if (typeof streamOutput.name === "undefined") {
        return outputs.push(commutable_1.createImmutableOutput(streamOutput));
    }
    function appendText(text) {
        if (typeof streamOutput.text === "string") {
            return escape_carriage_1.escapeCarriageReturnSafe(text + streamOutput.text);
        }
        return text;
    }
    // Invariant: size > 0, outputs.last() exists
    if (last.name === streamOutput.name) {
        return outputs.updateIn([outputs.size - 1, "text"], appendText);
    }
    // Check if there's a separate stream to merge with
    const nextToLast = outputs.butLast().last(null);
    if (nextToLast &&
        nextToLast.output_type === "stream" &&
        nextToLast.name === streamOutput.name) {
        return outputs.updateIn([outputs.size - 2, "text"], appendText);
    }
    // If nothing else matched, just append it
    return outputs.push(commutable_1.createImmutableOutput(streamOutput));
}
exports.reduceOutputs = reduceOutputs;
function cleanCellTransient(state, id) {
    // Clear out key paths that should no longer be referenced
    return state
        .setIn(["cellPagers", id], immutable_1.List())
        .updateIn(["transient", "keyPathsForDisplays"], (kpfd) => (kpfd || immutable_1.Map()).map((keyPaths) => keyPaths.filter((keyPath) => keyPath.get(2) !== id)))
        .setIn(["transient", "cellMap", id], immutable_1.Map());
}
exports.cleanCellTransient = cleanCellTransient;
function setNotebookCheckpoint(state) {
    // Use the current version of the notebook document
    return state.set("savedNotebook", state.get("notebook"));
}
function focusCell(state, action) {
    return state.set("cellFocused", action.payload.id);
}
function clearOutputs(state, action) {
    const id = action.payload.id ? action.payload.id : state.cellFocused;
    if (!id) {
        return state;
    }
    const type = state.getIn(["notebook", "cellMap", id, "cell_type"]);
    const cleanedState = cleanCellTransient(state, id);
    if (type === "code") {
        return cleanedState
            .setIn(["notebook", "cellMap", id, "outputs"], immutable_1.List())
            .setIn(["notebook", "cellMap", id, "execution_count"], null);
    }
    return cleanedState;
}
function toggleTagInCell(state, action) {
    const { id, tag } = action.payload;
    return state.updateIn(["notebook", "cellMap", id, "metadata", "tags"], tags => {
        if (tags) {
            return tags.has(tag) ? tags.remove(tag) : tags.add(tag);
        }
        else {
            return immutable_1.Set([tag]);
        }
    });
}
function clearAllOutputs(state, action) {
    // If we get a restart kernel action that said to clear outputs, we'll
    // handle it
    if (action.type === actionTypes.RESTART_KERNEL &&
        action.payload.outputHandling !== "Clear All") {
        return state;
    }
    // For every cell, clear the outputs and execution counts
    const cellMap = state
        .getIn(["notebook", "cellMap"])
        // NOTE: My kingdom for a mergeMap
        .map((cell) => {
        if (cell.get("cell_type") === "code") {
            return cell.merge({
                outputs: immutable_1.List(),
                execution_count: null
            });
        }
        return cell;
    });
    // Clear all the transient data too
    const transient = immutable_1.Map({
        keyPathsForDisplays: immutable_1.Map(),
        cellMap: cellMap.map(() => immutable_1.Map())
    });
    return state
        .setIn(["notebook", "cellMap"], cellMap)
        .set("transient", transient);
}
function appendOutput(state, action) {
    const output = action.payload.output;
    const cellId = action.payload.id;
    /**
     * If it is not a display_data or execute_result with
     * a display_id, then treat it as a normal output and don't
     * add its index to the keyPaths.
     */
    if ((output.output_type !== "execute_result" &&
        output.output_type !== "display_data") ||
        !lodash_1.has(output, "transient.display_id")) {
        return state.updateIn(["notebook", "cellMap", cellId, "outputs"], (outputs) => reduceOutputs(outputs, output));
    }
    // We now have a display_data that includes a transient display_id
    // output: {
    //   data: { 'text/html': '<b>woo</b>' }
    //   metadata: {}
    //   transient: { display_id: '12312' }
    // }
    // We now have a display to track
    let displayID;
    let typedOutput;
    if (output.output_type === "execute_result") {
        typedOutput = output;
    }
    else {
        typedOutput = output;
    }
    displayID = typedOutput.transient.display_id;
    // Every time we see a display id we're going to capture the keypath
    // to the output
    // Determine the next output index
    const outputIndex = state
        .getIn(["notebook", "cellMap", cellId, "outputs"])
        .count();
    // Construct the path to the output for updating later
    const keyPath = immutable_1.List([
        "notebook",
        "cellMap",
        cellId,
        "outputs",
        outputIndex
    ]);
    const keyPaths = (state
        // Extract the current list of keypaths for this displayID
        .getIn(["transient", "keyPathsForDisplays", displayID]) || immutable_1.List())
        // Append our current output's keyPath
        .push(keyPath);
    const immutableOutput = commutable_1.createImmutableOutput(output);
    // We'll reduce the overall state based on each keypath, updating output
    return state
        .updateIn(keyPath, () => immutableOutput)
        .setIn(["transient", "keyPathsForDisplays", displayID], keyPaths);
}
function updateDisplay(state, action) {
    const { content } = action.payload;
    if (!(content && content.transient && content.transient.display_id)) {
        return state;
    }
    const displayID = content.transient.display_id;
    const keyPaths = state.getIn([
        "transient",
        "keyPathsForDisplays",
        displayID
    ]);
    const updatedContent = {
        data: commutable_1.createFrozenMediaBundle(content.data),
        metadata: immutable_1.fromJS(content.metadata || {})
    };
    return keyPaths.reduce((currState, kp) => currState.updateIn(kp, output => {
        return output.merge(updatedContent);
    }), state);
}
function focusNextCell(state, action) {
    const cellOrder = state.getIn(["notebook", "cellOrder"]);
    const id = action.payload.id ? action.payload.id : state.get("cellFocused");
    // If for some reason we neither have an ID here or a focused cell, we just
    // keep the state consistent
    if (!id) {
        return state;
    }
    const curIndex = cellOrder.findIndex((foundId) => id === foundId);
    const curCellType = state.getIn(["notebook", "cellMap", id, "cell_type"]);
    const nextIndex = curIndex + 1;
    // When at the end, create a new cell
    if (nextIndex >= cellOrder.size) {
        if (!action.payload.createCellIfUndefined) {
            return state;
        }
        const cellId = v4_1.default();
        const cell = curCellType === "code" ? commutable_1.emptyCodeCell : commutable_1.emptyMarkdownCell;
        const notebook = state.get("notebook");
        return state
            .set("cellFocused", cellId)
            .set("notebook", commutable_1.insertCellAt(notebook, cell, cellId, nextIndex));
    }
    // When in the middle of the notebook document, move to the next cell
    return state.set("cellFocused", cellOrder.get(nextIndex));
}
function focusPreviousCell(state, action) {
    const cellOrder = state.getIn(["notebook", "cellOrder"]);
    const curIndex = cellOrder.findIndex((id) => id === action.payload.id);
    const nextIndex = Math.max(0, curIndex - 1);
    return state.set("cellFocused", cellOrder.get(nextIndex));
}
function focusCellEditor(state, action) {
    return state.set("editorFocused", action.payload.id);
}
function focusNextCellEditor(state, action) {
    const cellOrder = state.getIn(["notebook", "cellOrder"]);
    const id = action.payload.id ? action.payload.id : state.get("editorFocused");
    // If for some reason we neither have an ID here or a focused editor, we just
    // keep the state consistent
    if (!id) {
        return state;
    }
    const curIndex = cellOrder.findIndex((foundId) => id === foundId);
    const nextIndex = curIndex + 1;
    return state.set("editorFocused", cellOrder.get(nextIndex));
}
function focusPreviousCellEditor(state, action) {
    const cellOrder = state.getIn(["notebook", "cellOrder"]);
    const curIndex = cellOrder.findIndex((id) => id === action.payload.id);
    const nextIndex = Math.max(0, curIndex - 1);
    return state.set("editorFocused", cellOrder.get(nextIndex));
}
function moveCell(state, action) {
    return state.updateIn(["notebook", "cellOrder"], (cellOrder) => {
        const oldIndex = cellOrder.findIndex((id) => id === action.payload.id);
        const newIndex = cellOrder.findIndex((id) => id === action.payload.destinationId) + (action.payload.above ? 0 : 1);
        if (oldIndex === newIndex) {
            return cellOrder;
        }
        return cellOrder
            .splice(oldIndex, 1)
            .splice(newIndex - (oldIndex < newIndex ? 1 : 0), 0, action.payload.id);
    });
}
// DEPRECATION WARNING: The action type RemoveCell is being deprecated. Please use DeleteCell instead
function deleteCellFromState(state, action) {
    const id = action.payload.id ? action.payload.id : state.cellFocused;
    if (!id) {
        return state;
    }
    return cleanCellTransient(state.update("notebook", (notebook) => commutable_1.deleteCell(notebook, id)), id);
}
function createCellBelow(state, action) {
    const id = action.payload.id ? action.payload.id : state.cellFocused;
    if (!id) {
        return state;
    }
    const { cellType, source } = action.payload;
    const cell = cellType === "markdown" ? commutable_1.emptyMarkdownCell : commutable_1.emptyCodeCell;
    const cellId = v4_1.default();
    return state.update("notebook", (notebook) => {
        const index = notebook.get("cellOrder", immutable_1.List()).indexOf(id) + 1;
        return commutable_1.insertCellAt(notebook, cell.set("source", source), cellId, index);
    });
}
function createCellAbove(state, action) {
    const id = action.payload.id ? action.payload.id : state.cellFocused;
    if (!id) {
        return state;
    }
    const { cellType } = action.payload;
    const cell = cellType === "markdown" ? commutable_1.emptyMarkdownCell : commutable_1.emptyCodeCell;
    const cellId = v4_1.default();
    return state.update("notebook", (notebook) => {
        const cellOrder = notebook.get("cellOrder", immutable_1.List());
        const index = cellOrder.indexOf(id);
        return commutable_1.insertCellAt(notebook, cell, cellId, index);
    });
}
function createCellAfter(state, action) {
    console.log("DEPRECATION WARNING: This function is being deprecated. Please use createCellBelow() instead");
    const id = action.payload.id ? action.payload.id : state.cellFocused;
    if (!id) {
        return state;
    }
    const { cellType, source } = action.payload;
    const cell = cellType === "markdown" ? commutable_1.emptyMarkdownCell : commutable_1.emptyCodeCell;
    const cellId = v4_1.default();
    return state.update("notebook", (notebook) => {
        const index = notebook.get("cellOrder", immutable_1.List()).indexOf(id) + 1;
        return commutable_1.insertCellAt(notebook, cell.set("source", source), cellId, index);
    });
}
function createCellBefore(state, action) {
    console.log("DEPRECATION WARNING: This function is being deprecated. Please use createCellAbove() instead");
    const id = action.payload.id ? action.payload.id : state.cellFocused;
    if (!id) {
        return state;
    }
    const { cellType } = action.payload;
    const cell = cellType === "markdown" ? commutable_1.emptyMarkdownCell : commutable_1.emptyCodeCell;
    const cellId = v4_1.default();
    return state.update("notebook", (notebook) => {
        const cellOrder = notebook.get("cellOrder", immutable_1.List());
        const index = cellOrder.indexOf(id);
        return commutable_1.insertCellAt(notebook, cell, cellId, index);
    });
}
function createCellAppend(state, action) {
    const { cellType } = action.payload;
    const notebook = state.get("notebook");
    const cellOrder = notebook.get("cellOrder", immutable_1.List());
    const cell = cellType === "markdown" ? commutable_1.emptyMarkdownCell : commutable_1.emptyCodeCell;
    const index = cellOrder.count();
    const cellId = v4_1.default();
    return state.set("notebook", commutable_1.insertCellAt(notebook, cell, cellId, index));
}
function acceptPayloadMessage(state, action) {
    const id = action.payload.id;
    const payload = action.payload.payload;
    if (payload.source === "page") {
        // append pager
        return state.updateIn(["cellPagers", id], l => (l || immutable_1.List()).push(payload.data));
    }
    else if (payload.source === "set_next_input") {
        if (payload.replace) {
            // this payload is sent in IPython when you use %load
            // and is intended to replace cell source
            return state.setIn(["notebook", "cellMap", id, "source"], payload.text);
        }
        else {
            // create the next cell
            // FIXME: This is a weird pattern. We're basically faking a dispatch here
            // inside a reducer and then appending to the result. I think that both of
            // these reducers should just handle the original action.
            return createCellBelow(state, {
                type: actionTypes.CREATE_CELL_BELOW,
                payload: {
                    cellType: "code",
                    // TODO: is payload.text guaranteed to be defined?
                    source: payload.text || "",
                    id,
                    contentRef: action.payload.contentRef
                }
            });
        }
    }
    // If the payload is unsupported, just return the current state
    return state;
}
function sendExecuteRequest(state, action) {
    const id = action.payload.id ? action.payload.id : state.cellFocused;
    const contentRef = action.payload.contentRef;
    if (!id) {
        return state;
    }
    // TODO: Record the last execute request for this cell
    // * Clear outputs
    // * Set status to queued, as all we've done is submit the execution request
    // FIXME: This is a weird pattern. We're basically faking a dispatch here
    // inside a reducer and then appending to the result. I think that both of
    // these reducers should just handle the original action.
    return clearOutputs(state, {
        type: "CLEAR_OUTPUTS",
        payload: {
            id,
            contentRef
        }
    }).setIn(["transient", "cellMap", id, "status"], "queued");
}
function setInCell(state, action) {
    return state.setIn(["notebook", "cellMap", action.payload.id].concat(action.payload.path), action.payload.value);
}
function toggleCellOutputVisibility(state, action) {
    const id = action.payload.id ? action.payload.id : state.cellFocused;
    if (!id) {
        return state;
    }
    return state.setIn(["notebook", "cellMap", id, "metadata", "outputHidden"], !state.getIn(["notebook", "cellMap", id, "metadata", "outputHidden"]));
}
function unhideAll(state, action) {
    return state.updateIn(["notebook", "cellMap"], cellMap => cellMap.map((cell) => {
        if (cell.get("cell_type") === "code") {
            return cell.mergeIn(["metadata"], {
                // TODO: Verify that we convert to one namespace
                // for hidden input/output
                outputHidden: action.payload.outputHidden,
                inputHidden: action.payload.inputHidden
            });
        }
        return cell;
    }));
}
function toggleCellInputVisibility(state, action) {
    const id = action.payload.id ? action.payload.id : state.cellFocused;
    if (!id) {
        return state;
    }
    return state.setIn(["notebook", "cellMap", id, "metadata", "inputHidden"], !state.getIn(["notebook", "cellMap", id, "metadata", "inputHidden"]));
}
function updateCellStatus(state, action) {
    const { id, status } = action.payload;
    return state.setIn(["transient", "cellMap", id, "status"], status);
}
function updateOutputMetadata(state, action) {
    const { id, metadata, index, mediaType } = action.payload;
    const currentOutputs = state.getIn(["notebook", "cellMap", id, "outputs"]);
    const updatedOutputs = currentOutputs.update(index, (item) => item.set("metadata", immutable_1.fromJS({
        [mediaType]: metadata
    })));
    return state.setIn(["notebook", "cellMap", id, "outputs"], updatedOutputs);
}
function setLanguageInfo(state, action) {
    const langInfo = immutable_1.fromJS(action.payload.langInfo);
    return state.setIn(["notebook", "metadata", "language_info"], langInfo);
}
function setKernelspecInfo(state, action) {
    const { kernelInfo } = action.payload;
    return state
        .setIn(["notebook", "metadata", "kernelspec"], immutable_1.fromJS({
        name: kernelInfo.name,
        language: kernelInfo.spec.language,
        display_name: kernelInfo.spec.display_name
    }))
        .setIn(["notebook", "metadata", "kernel_info", "name"], kernelInfo.name);
}
function overwriteMetadataField(state, action) {
    const { field, value } = action.payload;
    return state.setIn(["notebook", "metadata", field], immutable_1.fromJS(value));
}
function deleteMetadataField(state, action) {
    const { field } = action.payload;
    return state.deleteIn(["notebook", "metadata", field]);
}
function copyCell(state, action) {
    const id = action.payload.id || state.cellFocused;
    const cell = state.getIn(["notebook", "cellMap", id]);
    if (!cell) {
        return state;
    }
    return state.set("copied", cell);
}
function cutCell(state, action) {
    const id = action.payload.id ? action.payload.id : state.cellFocused;
    if (!id) {
        return state;
    }
    const cell = state.getIn(["notebook", "cellMap", id]);
    if (!cell) {
        return state;
    }
    // FIXME: If the cell that was cut was the focused cell, focus the cell below
    return state
        .set("copied", cell)
        .update("notebook", (notebook) => commutable_1.deleteCell(notebook, id));
}
function pasteCell(state) {
    const copiedCell = state.get("copied");
    const pasteAfter = state.cellFocused;
    if (!copiedCell || !pasteAfter) {
        return state;
    }
    // Create a new cell with `id` that will come after the currently focused cell
    // using the contents of the originally copied cell
    const id = v4_1.default();
    return state.update("notebook", (notebook) => commutable_1.insertCellAfter(notebook, copiedCell, id, pasteAfter));
}
function changeCellType(state, action) {
    const id = action.payload.id ? action.payload.id : state.cellFocused;
    if (!id) {
        return state;
    }
    const { to } = action.payload;
    const cell = state.getIn(["notebook", "cellMap", id]);
    const from = cell.cell_type;
    // NOOP, since we're already that cell type
    if (from === to) {
        return state;
    }
    let nextState = state;
    // from === "code"
    if (from === "code") {
        nextState = cleanCellTransient(state
            .deleteIn(["notebook", "cellMap", id, "execution_count"])
            .deleteIn(["notebook", "cellMap", id, "outputs"]), id);
    }
    switch (to) {
        case "code":
            return nextState.setIn(["notebook", "cellMap", id], commutable_1.makeCodeCell({
                source: cell.source
            }));
        case "markdown":
            return nextState.setIn(["notebook", "cellMap", id], commutable_1.makeMarkdownCell({
                source: cell.source
            }));
        case "raw":
            return nextState.setIn(["notebook", "cellMap", id], commutable_1.makeRawCell({
                source: cell.source
            }));
    }
    // If we didn't match on the `to`, we should change nothing as we don't implement
    // other cell types (as there aren't any)
    return state;
}
function toggleOutputExpansion(state, action) {
    const id = action.payload.id ? action.payload.id : state.cellFocused;
    if (!id) {
        return state;
    }
    return state.updateIn(["notebook", "cellMap"], (cells) => cells.setIn([id, "metadata", "outputExpanded"], !cells.getIn([id, "metadata", "outputExpanded"])));
}
const defaultDocument = types_1.makeDocumentRecord({
    notebook: commutable_1.emptyNotebook
});
function notebook(state = defaultDocument, action) {
    switch (action.type) {
        case actionTypes.TOGGLE_TAG_IN_CELL:
            return toggleTagInCell(state, action);
        case actionTypes.SEND_EXECUTE_REQUEST:
            return sendExecuteRequest(state, action);
        case actionTypes.SAVE_FULFILLED:
            return setNotebookCheckpoint(state);
        case actionTypes.FOCUS_CELL:
            return focusCell(state, action);
        case actionTypes.CLEAR_OUTPUTS:
            return clearOutputs(state, action);
        case actionTypes.CLEAR_ALL_OUTPUTS:
        case actionTypes.RESTART_KERNEL:
            return clearAllOutputs(state, action);
        case actionTypes.APPEND_OUTPUT:
            return appendOutput(state, action);
        case actionTypes.UPDATE_DISPLAY:
            return updateDisplay(state, action);
        case actionTypes.FOCUS_NEXT_CELL:
            return focusNextCell(state, action);
        case actionTypes.FOCUS_PREVIOUS_CELL:
            return focusPreviousCell(state, action);
        case actionTypes.FOCUS_CELL_EDITOR:
            return focusCellEditor(state, action);
        case actionTypes.FOCUS_NEXT_CELL_EDITOR:
            return focusNextCellEditor(state, action);
        case actionTypes.FOCUS_PREVIOUS_CELL_EDITOR:
            return focusPreviousCellEditor(state, action);
        case actionTypes.SET_IN_CELL:
            return setInCell(state, action);
        case actionTypes.MOVE_CELL:
            return moveCell(state, action);
        case actionTypes.DELETE_CELL:
            return deleteCellFromState(state, action);
        case actionTypes.CREATE_CELL_BELOW:
            return createCellBelow(state, action);
        case actionTypes.CREATE_CELL_ABOVE:
            return createCellAbove(state, action);
        case actionTypes.REMOVE_CELL:
            console.log("DEPRECATION WARNING: This action type is being deprecated. Please use DELETE_CELL instead");
            return deleteCellFromState(state, action);
        case actionTypes.CREATE_CELL_AFTER:
            console.log("DEPRECATION WARNING: This action type is being deprecated. Please use CREATE_CELL_BELOW instead");
            return createCellAfter(state, action);
        case actionTypes.CREATE_CELL_BEFORE:
            console.log("DEPRECATION WARNING: This action type is being deprecated. Please use CREATE_CELL_ABOVE instead");
            return createCellBefore(state, action);
        case actionTypes.CREATE_CELL_APPEND:
            return createCellAppend(state, action);
        case actionTypes.TOGGLE_CELL_OUTPUT_VISIBILITY:
            return toggleCellOutputVisibility(state, action);
        case actionTypes.TOGGLE_CELL_INPUT_VISIBILITY:
            return toggleCellInputVisibility(state, action);
        case actionTypes.ACCEPT_PAYLOAD_MESSAGE:
            return acceptPayloadMessage(state, action);
        case actionTypes.UPDATE_CELL_STATUS:
            return updateCellStatus(state, action);
        case actionTypes.UPDATE_OUTPUT_METADATA:
            return updateOutputMetadata(state, action);
        case actionTypes.SET_LANGUAGE_INFO:
            return setLanguageInfo(state, action);
        case actionTypes.SET_KERNELSPEC_INFO:
            return setKernelspecInfo(state, action);
        case actionTypes.OVERWRITE_METADATA_FIELD:
            return overwriteMetadataField(state, action);
        case actionTypes.DELETE_METADATA_FIELD:
            return deleteMetadataField(state, action);
        case actionTypes.COPY_CELL:
            return copyCell(state, action);
        case actionTypes.CUT_CELL:
            return cutCell(state, action);
        case actionTypes.PASTE_CELL:
            return pasteCell(state);
        case actionTypes.CHANGE_CELL_TYPE:
            return changeCellType(state, action);
        case actionTypes.TOGGLE_OUTPUT_EXPANSION:
            return toggleOutputExpansion(state, action);
        case actionTypes.UNHIDE_ALL:
            return unhideAll(state, action);
        default:
            return state;
    }
}
exports.notebook = notebook;
