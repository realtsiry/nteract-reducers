import { CommMessageAction, CommOpenAction, RegisterCommTargetAction } from "@nteract/actions";
import { CommsRecord } from "@nteract/types";
declare type CommAction = RegisterCommTargetAction | CommMessageAction | CommOpenAction;
export default function (state: import("immutable").RecordOf<import("@nteract/types").CommsRecordProps> | undefined, action: CommAction): CommsRecord;
export {};
