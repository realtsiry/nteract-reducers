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
function updateFileText(state, action) {
    return state.set("text", action.payload.text);
}
function file(state, action) {
    switch (action.type) {
        case actions.UPDATE_FILE_TEXT:
            return updateFileText(state, action);
        default:
            return state;
    }
}
exports.file = file;
