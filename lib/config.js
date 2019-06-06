"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = require("immutable");
function setConfigAtKey(state, action) {
    const { key, value } = action.payload;
    return state.set(key, value);
}
exports.setConfigAtKey = setConfigAtKey;
function mergeConfig(state, action) {
    const { config } = action.payload;
    return state.merge(config);
}
exports.mergeConfig = mergeConfig;
function handleConfig(state = immutable_1.Map(), action) {
    switch (action.type) {
        case "SET_CONFIG_AT_KEY":
            return setConfigAtKey(state, action);
        case "MERGE_CONFIG":
            return mergeConfig(state, action);
        default:
            return state;
    }
}
exports.default = handleConfig;
