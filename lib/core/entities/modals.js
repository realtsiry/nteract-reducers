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
const modalType = (state = "", action) => {
    switch (action.type) {
        case actions.OPEN_MODAL:
            return action.payload.modalType;
        case actions.CLOSE_MODAL:
            return "";
        default:
            return state;
    }
};
exports.modals = redux_immutable_1.combineReducers({ modalType }, types_1.makeModalsRecord);
