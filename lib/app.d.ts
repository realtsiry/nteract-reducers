import { Save, SaveFailed, SaveFulfilled, SetAppHostAction, SetGithubTokenAction, SetNotificationSystemAction } from "@nteract/actions";
import { AppRecordProps } from "@nteract/types";
import { RecordOf } from "immutable";
export default function handleApp(state: RecordOf<AppRecordProps> | undefined, action: SetNotificationSystemAction | SetGithubTokenAction | Save | SaveFulfilled | SaveFailed | SetAppHostAction): RecordOf<AppRecordProps>;
