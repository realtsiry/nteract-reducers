"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("@nteract/types");
const immutable_1 = require("immutable");
function registerCommTarget(state, action) {
    return state.setIn(["targets", action.name], action.handler);
}
function processCommOpen(state, action) {
    const { target_name, target_module, data, comm_id } = action;
    const commInfo = {
        target_module,
        target_name
    };
    return state
        .setIn(["info", comm_id], immutable_1.fromJS(commInfo))
        .setIn(["models", comm_id], immutable_1.fromJS(data));
}
function processCommMessage(state, action) {
    const { data, comm_id } = action;
    const commInfo = state.getIn(["info", comm_id]);
    if (commInfo &&
        commInfo.get("target_module") === "reducers" &&
        commInfo.get("target_name") === "setIn") {
        const path = data.path;
        const value = immutable_1.fromJS(data.value);
        // set `value` into `path` of the model data
        return state.updateIn(["models", comm_id], model => model.setIn(path, value));
    }
    // Default to overwrite / replace for now
    return state.setIn(["models", comm_id], immutable_1.fromJS(data));
}
function default_1(state = types_1.makeCommsRecord(), action) {
    switch (action.type) {
        case "REGISTER_COMM_TARGET":
            return registerCommTarget(state, action);
        case "COMM_OPEN":
            return processCommOpen(state, action);
        case "COMM_MESSAGE":
            return processCommMessage(state, action);
        default:
            return state;
    }
}
exports.default = default_1;
