import * as actions from "@nteract/actions";
import { FileModelRecord, FileModelRecordProps } from "@nteract/types";
import { RecordOf } from "immutable";
export declare function file(state: FileModelRecord, action: actions.UpdateFileText): RecordOf<FileModelRecordProps>;
