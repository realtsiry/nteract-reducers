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
const byRef = (state = immutable_1.Map(), action) => {
    let typedAction;
    switch (action.type) {
        case actions.PUBLISH_TO_BOOKSTORE:
            // This is more of a pass thru. This action
            // kicks off an epic saves a `notebook` to the contents
            // API. It then returns an action that saves
            // the notebook to `Bookstore`.
            return state;
        case actions.PUBLISH_TO_BOOKSTORE_AFTER_SAVE:
            // This action kicks off an epic which establishes
            // a connection to bookstore and saves a `notebook`
            // to the appropriate S3 bucket.
            return state;
        case actions.PUBLISH_TO_BOOKSTORE_SUCCEEDED:
            // This action signfies that the content was saved
            // to `Bookstore` successfully.
            // TODO: Add last saved timestamp for published bookstore content
            return state;
        case actions.PUBLISH_TO_BOOKSTORE_FAILED:
            return state;
        case actions.ADD_HOST:
            typedAction = action;
            switch (typedAction.payload.host.type) {
                case "jupyter": {
                    return state.set(typedAction.payload.hostRef, types_1.makeJupyterHostRecord(typedAction.payload.host));
                }
                case "local": {
                    return state.set(typedAction.payload.hostRef, types_1.makeLocalHostRecord(typedAction.payload.host));
                }
                default:
                    throw new Error(`Unrecognized host type "${typedAction.payload.host.type}".`);
            }
        case actions.REMOVE_HOST:
            typedAction = action;
            return state.remove(typedAction.payload.hostRef);
        default:
            return state;
    }
};
const refs = (state = immutable_1.List(), action) => {
    switch (action.type) {
        case actions.ADD_HOST:
            return state.push(action.payload.hostRef);
        case actions.REMOVE_HOST:
            return state.filter(hostRef => hostRef !== action.payload.hostRef);
        default:
            return state;
    }
};
exports.hosts = redux_immutable_1.combineReducers({ byRef, refs }, types_1.makeHostsRecord);
