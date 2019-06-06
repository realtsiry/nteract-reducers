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
const actions = __importStar(require("@nteract/actions"));
const types_1 = require("@nteract/types");
const redux_immutable_1 = require("redux-immutable");
// Local modules
const entities_1 = require("./entities");
// TODO: This is temporary until we have sessions in place. Ideally, we point to
// a document, which knows about its session and that session knows about its
// kernel. For now, we need to keep a reference to the currently targeted kernel
// around.
const kernelRef = (state = "", action) => {
    let typedAction;
    switch (action.type) {
        case actions.LAUNCH_KERNEL:
        case actions.LAUNCH_KERNEL_BY_NAME:
            typedAction = action;
            return typedAction.payload.selectNextKernel
                ? typedAction.payload.kernelRef
                : state;
        case actions.LAUNCH_KERNEL_SUCCESSFUL:
            typedAction = action;
            return typedAction.payload.selectNextKernel
                ? typedAction.payload.kernelRef
                : state;
        default:
            return state;
    }
};
const currentKernelspecsRef = (state = "", action) => {
    switch (action.type) {
        case actions.FETCH_KERNELSPECS:
            const typedAction = action;
            return typedAction.payload.kernelspecsRef;
        default:
            return state;
    }
};
const core = redux_immutable_1.combineReducers({
    currentKernelspecsRef,
    entities: entities_1.entities,
    kernelRef
}, types_1.makeStateRecord);
exports.default = core;
