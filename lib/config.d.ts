import { MergeConfigAction, SetConfigAction } from "@nteract/actions";
import { ConfigState } from "@nteract/types";
import { Map } from "immutable";
declare type ConfigAction = SetConfigAction<any> | MergeConfigAction;
export declare function setConfigAtKey(state: ConfigState, action: SetConfigAction<any>): Map<string, any>;
export declare function mergeConfig(state: ConfigState, action: MergeConfigAction): Map<string, any>;
export default function handleConfig(state: Map<string, any> | undefined, action: ConfigAction): Map<string, any>;
export {};
