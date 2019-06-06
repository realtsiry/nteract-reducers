import { HostRecord } from "@nteract/types";
import { List, Map } from "immutable";
import { Action, Reducer } from "redux";
export declare const hosts: Reducer<{
    byRef: Map<string, HostRecord>;
    refs: List<string>;
}, Action<any>>;
