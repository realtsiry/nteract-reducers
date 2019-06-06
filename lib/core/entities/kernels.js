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
const types_1 = require("@nteract/types");
const immutable_1 = require("immutable");
const redux_immutable_1 = require("redux-immutable");
// TODO: we need to clean up references to old kernels at some point. Listening
// for KILL_KERNEL_SUCCESSFUL seems like a good candidate, but I think you can
// also end up with a dead kernel if that fails and you hit KILL_KERNEL_FAILED.
const byRef = (state = immutable_1.Map(), action) => {
    let typedAction;
    switch (action.type) {
        case actionTypes.SET_LANGUAGE_INFO:
            // TODO: Should the kernel hold language info?
            return state;
        case actionTypes.KILL_KERNEL_SUCCESSFUL:
            typedAction = action;
            return state.setIn([typedAction.payload.kernelRef, "status"], "killed");
        case actionTypes.KILL_KERNEL_FAILED:
            typedAction = action;
            return state.setIn([typedAction.payload.kernelRef, "status"], "failed to kill");
        case actionTypes.RESTART_KERNEL:
            typedAction = action;
            return state.setIn([typedAction.payload.kernelRef, "status"], "restarting");
        case actionTypes.LAUNCH_KERNEL:
            typedAction = action;
            return state.set(typedAction.payload.kernelRef, types_1.makeKernelNotStartedRecord({
                status: "launching",
                kernelSpecName: typedAction.payload.kernelSpec.name
            }));
        case actionTypes.LAUNCH_KERNEL_BY_NAME:
            typedAction = action;
            return state.set(typedAction.payload.kernelRef, types_1.makeKernelNotStartedRecord({
                status: "launching",
                kernelSpecName: typedAction.payload.kernelSpecName
            }));
        case actionTypes.CHANGE_KERNEL_BY_NAME:
            typedAction = action;
            return state.setIn([typedAction.payload.oldKernelRef, "status"], "changing");
        case actionTypes.SET_KERNEL_INFO:
            typedAction = action;
            let codemirrorMode = typedAction.payload.info.codemirrorMode;
            // If the codemirror mode isn't set, fallback on the language name
            if (!codemirrorMode) {
                codemirrorMode = typedAction.payload.info.languageName;
            }
            switch (typeof codemirrorMode) {
                case "string":
                    // already set as we want it
                    break;
                case "object":
                    codemirrorMode = immutable_1.Map(codemirrorMode);
                    break;
                default:
                    // any other case results in falling back to language name
                    codemirrorMode = typedAction.payload.info.languageName;
            }
            const helpLinks = typedAction.payload.info.helpLinks
                ? immutable_1.List(typedAction.payload.info.helpLinks.map(types_1.makeHelpLinkRecord))
                : immutable_1.List();
            return state.setIn([typedAction.payload.kernelRef, "info"], types_1.makeKernelInfoRecord(typedAction.payload.info).merge({
                helpLinks,
                codemirrorMode
            }));
        case actionTypes.SET_EXECUTION_STATE:
            typedAction = action;
            return state.setIn([typedAction.payload.kernelRef, "status"], typedAction.payload.kernelStatus);
        case actionTypes.LAUNCH_KERNEL_SUCCESSFUL:
            typedAction = action;
            switch (typedAction.payload.kernel.type) {
                case "zeromq":
                    return state.set(typedAction.payload.kernelRef, types_1.makeLocalKernelRecord(typedAction.payload.kernel));
                case "websocket":
                    return state.set(typedAction.payload.kernelRef, types_1.makeRemoteKernelRecord(typedAction.payload.kernel));
                default:
                    throw new Error(`Unrecognized kernel type in kernel ${typedAction.payload.kernel}.`);
            }
        default:
            return state;
    }
};
exports.kernels = redux_immutable_1.combineReducers({ byRef }, types_1.makeKernelsRecord);
