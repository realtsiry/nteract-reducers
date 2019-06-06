"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// Vendor modules
const actionTypes = __importStar(require("@nteract/actions"));
const commutable_1 = require("@nteract/commutable");
const types_1 = require("@nteract/types");
const immutable_1 = require("immutable");
// Local modules
const file_1 = require("./file");
const notebook_1 = require("./notebook");
const byRef = (state, action) => {
    switch (action.type) {
        case actionTypes.OVERWRITE_METADATA_FIELDS:
            const overwriteMetadataFieldsAction = action;
            const { authors, description, tags, title } = overwriteMetadataFieldsAction.payload;
            return state
                .setIn([
                overwriteMetadataFieldsAction.payload.contentRef,
                "model",
                "notebook",
                "metadata",
                "authors"
            ], authors)
                .setIn([
                overwriteMetadataFieldsAction.payload.contentRef,
                "model",
                "notebook",
                "metadata",
                "description"
            ], description)
                .setIn([
                overwriteMetadataFieldsAction.payload.contentRef,
                "model",
                "notebook",
                "metadata",
                "tags"
            ], tags)
                .setIn([
                overwriteMetadataFieldsAction.payload.contentRef,
                "model",
                "notebook",
                "metadata",
                "title"
            ], title);
        case actionTypes.TOGGLE_HEADER_EDITOR:
            const toggleHeaderAction = action;
            const ref = toggleHeaderAction.payload.contentRef;
            const content = state.get(ref);
            const prevValue = content.get("showHeaderEditor");
            // toggle header
            return state.setIn([ref, "showHeaderEditor"], !prevValue);
        case actionTypes.CHANGE_CONTENT_NAME:
            const changeContentNameAction = action;
            const { contentRef, filepath } = changeContentNameAction.payload;
            return state.setIn([contentRef, "filepath"], filepath);
        case actionTypes.CHANGE_CONTENT_NAME_FAILED:
            return state;
        case actionTypes.FETCH_CONTENT:
            // TODO: we might be able to get around this by looking at the
            // communication state first and not requesting this information until
            // the communication state shows that it should exist.
            const fetchContentAction = action;
            return state.set(fetchContentAction.payload.contentRef, types_1.makeDummyContentRecord({
                filepath: fetchContentAction.payload.filepath || "",
                loading: true
                // TODO: we can set kernelRef when the content record uses it.
            }));
        case actionTypes.LAUNCH_KERNEL_SUCCESSFUL:
            // TODO: is this reasonable? We launched the kernel on behalf of this
            // content... so it makes sense to swap it, right?
            const launchKernelAction = action;
            return state.setIn([launchKernelAction.payload.contentRef, "model", "kernelRef"], launchKernelAction.payload.kernelRef);
        case actionTypes.FETCH_CONTENT_LOADED:
            const fetchContentLoadedAction = action;
            switch (fetchContentLoadedAction.payload.model.type) {
                case "notebook": {
                    const immutableNotebook = commutable_1.fromJS(fetchContentLoadedAction.payload.model.content);
                    return state.set(fetchContentLoadedAction.payload.contentRef, types_1.makeNotebookContentRecord({
                        created: fetchContentLoadedAction.payload.created,
                        lastSaved: fetchContentLoadedAction.payload.lastSaved,
                        filepath: fetchContentLoadedAction.payload.filepath,
                        model: types_1.makeDocumentRecord({
                            notebook: immutableNotebook,
                            savedNotebook: immutableNotebook,
                            transient: immutable_1.Map({
                                keyPathsForDisplays: immutable_1.Map(),
                                cellMap: immutable_1.Map()
                            }),
                            cellFocused: immutableNotebook.getIn(["cellOrder", 0])
                        }),
                        loading: false,
                        saving: false,
                        error: null
                    }));
                }
            }
        case actionTypes.FETCH_CONTENT_FULFILLED:
            const fetchContentFulfilledAction = action;
            switch (fetchContentFulfilledAction.payload.model.type) {
                case "file":
                    return state.set(fetchContentFulfilledAction.payload.contentRef, types_1.makeFileContentRecord({
                        mimetype: fetchContentFulfilledAction.payload.model.mimetype,
                        created: fetchContentFulfilledAction.payload.model.created,
                        lastSaved: fetchContentFulfilledAction.payload.model.last_modified,
                        filepath: fetchContentFulfilledAction.payload.filepath,
                        model: types_1.makeFileModelRecord({
                            text: fetchContentFulfilledAction.payload.model.content
                        }),
                        loading: false,
                        saving: false,
                        error: null
                    }));
                case "directory": {
                    // For each entry in the directory listing, create a new contentRef
                    // and a "filler" contents object
                    // Optional: run through all the current contents to see if they're
                    //           a file we already have (?)
                    // Create a map of <ContentRef, ContentRecord> that we merge into the
                    // content refs state
                    const dummyRecords = immutable_1.Map(fetchContentFulfilledAction.payload.model.content.map((entry) => {
                        return [
                            types_1.createContentRef(),
                            types_1.makeDummyContentRecord({
                                mimetype: entry.mimetype,
                                // TODO: We can store the type of this content,
                                // it just doesn't have a model
                                // entry.type
                                assumedType: entry.type,
                                lastSaved: entry.last_modified,
                                filepath: entry.path
                            })
                        ];
                    }));
                    const items = immutable_1.List(dummyRecords.keys());
                    const sorted = items.sort((aRef, bRef) => {
                        const a = dummyRecords.get(aRef);
                        const b = dummyRecords.get(bRef);
                        if (a.assumedType === b.assumedType) {
                            return a.filepath.localeCompare(b.filepath);
                        }
                        return a.assumedType.localeCompare(b.assumedType);
                    });
                    return (state
                        // Bring in all the listed records
                        .merge(dummyRecords)
                        // Set up the base directory
                        .set(fetchContentFulfilledAction.payload.contentRef, types_1.makeDirectoryContentRecord({
                        model: types_1.makeDirectoryModel({
                            type: "directory",
                            // The listing is all these contents in aggregate
                            items: sorted
                        }),
                        filepath: fetchContentFulfilledAction.payload.filepath,
                        lastSaved: fetchContentFulfilledAction.payload.model.last_modified,
                        created: fetchContentFulfilledAction.payload.model.created,
                        loading: false,
                        saving: false,
                        error: null
                    })));
                }
                case "notebook": {
                    const immutableNotebook = commutable_1.fromJS(fetchContentFulfilledAction.payload.model.content);
                    return state.set(fetchContentFulfilledAction.payload.contentRef, types_1.makeNotebookContentRecord({
                        created: fetchContentFulfilledAction.payload.created,
                        lastSaved: fetchContentFulfilledAction.payload.lastSaved,
                        filepath: fetchContentFulfilledAction.payload.filepath,
                        model: types_1.makeDocumentRecord({
                            notebook: immutableNotebook,
                            savedNotebook: immutableNotebook,
                            transient: immutable_1.Map({
                                keyPathsForDisplays: immutable_1.Map(),
                                cellMap: immutable_1.Map()
                            }),
                            cellFocused: immutableNotebook.getIn(["cellOrder", 0])
                        }),
                        loading: false,
                        saving: false,
                        error: null
                    }));
                }
            }
            // NOTE: There are no other content types (at the moment), so we will just
            //       warn and return the current state
            console.warn("Met some content type we don't support");
            return state;
        case actionTypes.CHANGE_FILENAME: {
            const changeFilenameAction = action;
            return state.updateIn([changeFilenameAction.payload.contentRef], contentRecord => contentRecord.merge({
                filepath: changeFilenameAction.payload.filepath
            }));
        }
        case actionTypes.SAVE_FULFILLED: {
            const saveFulfilledAction = action;
            return state
                .updateIn([saveFulfilledAction.payload.contentRef, "model"], (model) => {
                // Notebook ends up needing this because we store
                // a last saved version of the notebook
                // Alternatively, we could be storing a hash of the
                // content to compare 🤔
                if (model && model.type === "notebook") {
                    return notebook_1.notebook(model, saveFulfilledAction);
                }
                return model;
            })
                .setIn([saveFulfilledAction.payload.contentRef, "lastSaved"], saveFulfilledAction.payload.model.last_modified)
                .setIn([saveFulfilledAction.payload.contentRef, "loading"], false)
                .setIn([saveFulfilledAction.payload.contentRef, "saving"], false)
                .setIn([saveFulfilledAction.payload.contentRef, "error"], null);
        }
        // Defer all notebook actions to the notebook reducer
        case actionTypes.SEND_EXECUTE_REQUEST:
        case actionTypes.FOCUS_CELL:
        case actionTypes.CLEAR_OUTPUTS:
        case actionTypes.CLEAR_ALL_OUTPUTS:
        case actionTypes.RESTART_KERNEL:
        case actionTypes.APPEND_OUTPUT:
        case actionTypes.UPDATE_DISPLAY:
        case actionTypes.FOCUS_NEXT_CELL:
        case actionTypes.FOCUS_PREVIOUS_CELL:
        case actionTypes.FOCUS_CELL_EDITOR:
        case actionTypes.FOCUS_NEXT_CELL_EDITOR:
        case actionTypes.FOCUS_PREVIOUS_CELL_EDITOR:
        case actionTypes.SET_IN_CELL:
        case actionTypes.MOVE_CELL:
        case actionTypes.DELETE_CELL:
        case actionTypes.REMOVE_CELL: // DEPRECATION WARNING: This action type is being deprecated. Please use DELETE_CELL instead
        case actionTypes.CREATE_CELL_BELOW:
        case actionTypes.CREATE_CELL_ABOVE:
        case actionTypes.CREATE_CELL_AFTER: // DEPRECATION WARNING: This action type is being deprecated. Please use CREATE_CELL_BELOW instead
        case actionTypes.CREATE_CELL_BEFORE: // DEPRECATION WARNING: This action type is being deprecated. Please use CREATE_CELL_ABOVE instead
        case actionTypes.CREATE_CELL_APPEND:
        case actionTypes.TOGGLE_CELL_OUTPUT_VISIBILITY:
        case actionTypes.TOGGLE_CELL_INPUT_VISIBILITY:
        case actionTypes.ACCEPT_PAYLOAD_MESSAGE:
        case actionTypes.UPDATE_CELL_STATUS:
        case actionTypes.SET_LANGUAGE_INFO:
        case actionTypes.SET_KERNELSPEC_INFO:
        case actionTypes.OVERWRITE_METADATA_FIELD:
        case actionTypes.DELETE_METADATA_FIELD:
        case actionTypes.COPY_CELL:
        case actionTypes.CUT_CELL:
        case actionTypes.PASTE_CELL:
        case actionTypes.CHANGE_CELL_TYPE:
        case actionTypes.TOGGLE_OUTPUT_EXPANSION:
        case actionTypes.TOGGLE_TAG_IN_CELL:
        case actionTypes.UPDATE_OUTPUT_METADATA:
        case actionTypes.UNHIDE_ALL: {
            const cellAction = action;
            const path = [cellAction.payload.contentRef, "model"];
            const model = state.getIn(path);
            return state.setIn(path, notebook_1.notebook(model, cellAction));
        }
        case actionTypes.UPDATE_FILE_TEXT: {
            const fileAction = action;
            const path = [fileAction.payload.contentRef, "model"];
            const model = state.getIn(path);
            if (model && model.type === "file") {
                return state.setIn(path, file_1.file(model, fileAction));
            }
            return state;
        }
        default:
            return state;
    }
};
exports.contents = (state = types_1.makeContentsRecord(), action) => {
    return state.merge({
        byRef: byRef(state.byRef, action)
    });
};
