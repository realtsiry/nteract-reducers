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
const byRef = (state = immutable_1.Map(), action) => {
    const typedAction = action;
    switch (action.type) {
        case actionTypes.FETCH_KERNELSPECS_FULFILLED:
            return state.set(typedAction.payload.kernelspecsRef, types_1.makeKernelspecsByRefRecord({
                hostRef: typedAction.payload.hostRef,
                defaultKernelName: typedAction.payload.defaultKernelName,
                byName: immutable_1.Map(Object.keys(typedAction.payload.kernelspecs).reduce((r, k) => {
                    r[k] = types_1.makeKernelspec(typedAction.payload.kernelspecs[k]);
                    return r;
                }, {}))
            }));
        default:
            return state;
    }
};
const refs = (state = immutable_1.List(), action) => {
    let typedAction;
    switch (action.type) {
        case actionTypes.FETCH_KERNELSPECS_FULFILLED:
            typedAction = action;
            return state.includes(typedAction.payload.kernelspecsRef)
                ? state
                : state.push(typedAction.payload.kernelspecsRef);
        default:
            return state;
    }
};
exports.kernelspecs = redux_immutable_1.combineReducers({ byRef, refs }, types_1.makeKernelspecsRecord);
