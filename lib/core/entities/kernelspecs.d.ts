import { List, Map } from "immutable";
import { Action, Reducer } from "redux";
export declare const kernelspecs: Reducer<{
    byRef: Map<{}, {}>;
    refs: List<any>;
}, Action<any>>;
