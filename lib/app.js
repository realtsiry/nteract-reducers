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
function setGithubToken(state, action) {
    return state.set("githubToken", action.payload.githubToken);
}
function save(state) {
    return state.set("isSaving", true);
}
function saveFailed(state) {
    return state.set("isSaving", false);
}
function saveFulfilled(state) {
    return state.set("isSaving", false).set("lastSaved", new Date());
}
function setNotificationsSystem(state, action) {
    if (!action.payload || !action.payload.notificationSystem) {
        return state;
    }
    return state.set("notificationSystem", action.payload.notificationSystem);
}
function setAppHost(state, action) {
    return state.set("host", action.payload);
}
function handleApp(state = types_1.makeAppRecord(), action) {
    switch (action.type) {
        case actions.SAVE:
            return save(state);
        case actions.SAVE_FAILED:
            return saveFailed(state);
        case actions.SAVE_FULFILLED:
            return saveFulfilled(state);
        case actions.SET_NOTIFICATION_SYSTEM:
            return setNotificationsSystem(state, action);
        case actions.SET_GITHUB_TOKEN:
            return setGithubToken(state, action);
        case actions.SET_APP_HOST:
            return setAppHost(state, action);
        default:
            return state;
    }
}
exports.default = handleApp;
