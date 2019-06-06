"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Vendor modules
const types_1 = require("@nteract/types");
const redux_immutable_1 = require("redux-immutable");
// Local modules
const contents_1 = require("./contents");
const hosts_1 = require("./hosts");
const kernels_1 = require("./kernels");
const kernelspecs_1 = require("./kernelspecs");
const modals_1 = require("./modals");
const transforms_1 = require("./transforms");
exports.entities = redux_immutable_1.combineReducers({
    contents: contents_1.contents,
    hosts: hosts_1.hosts,
    kernels: kernels_1.kernels,
    kernelspecs: kernelspecs_1.kernelspecs,
    modals: modals_1.modals,
    transforms: transforms_1.transforms
}, types_1.makeEntitiesRecord);
