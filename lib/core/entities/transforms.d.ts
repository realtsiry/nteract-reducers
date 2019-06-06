/// <reference types="react" />
import { List, Map } from "immutable";
import { Action, Reducer } from "redux";
export declare const transforms: Reducer<{
    byId: Map<string, React.ComponentClass>;
    displayOrder: List<any>;
}, Action<any>>;
