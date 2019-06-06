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
const immutable_1 = require("immutable");
const redux_immutable_1 = require("redux-immutable");
const byId = (state = immutable_1.Map(), action) => {
    let typedAction;
    switch (action.type) {
        case actions.ADD_TRANSFORM:
            typedAction = action;
            return state.set(typedAction.payload.mediaType, typedAction.payload.component);
        case actions.REMOVE_TRANSFORM:
            typedAction = action;
            return state.delete(typedAction.payload.mediaType);
        default:
            return state;
    }
};
const displayOrder = (state = immutable_1.List(), action) => {
    let typedAction;
    switch (action.type) {
        case actions.ADD_TRANSFORM:
            typedAction = action;
            return state.push(typedAction.payload.mediaType);
        case actions.REMOVE_TRANSFORM:
            typedAction = action;
            return state.delete(state.indexOf(typedAction.payload.mediaType));
        default:
            return state;
    }
};
exports.transforms = redux_immutable_1.combineReducers({ byId, displayOrder }, types_1.makeTransformsRecord);
