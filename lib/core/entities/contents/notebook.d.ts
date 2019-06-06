import * as actionTypes from "@nteract/actions";
import { ImmutableOutput, OnDiskOutput } from "@nteract/commutable";
import { DocumentRecordProps, NotebookModel } from "@nteract/types";
import { List, RecordOf } from "immutable";
/**
 * An output can be a stream of data that does not arrive at a single time. This
 * function handles the different types of outputs and accumulates the data
 * into a reduced output.
 *
 * @param {Object} outputs - Kernel output messages
 * @param {Object} output - Outputted to be reduced into list of outputs
 * @return {List<Object>} updated-outputs - Outputs + Output
 */
export declare function reduceOutputs(outputs: List<ImmutableOutput> | undefined, output: OnDiskOutput): List<ImmutableOutput>;
export declare function cleanCellTransient(state: NotebookModel, id: string): RecordOf<DocumentRecordProps>;
declare type DocumentAction = actionTypes.ToggleTagInCell | actionTypes.FocusPreviousCellEditor | actionTypes.FocusPreviousCell | actionTypes.FocusNextCellEditor | actionTypes.FocusNextCell | actionTypes.FocusCellEditor | actionTypes.FocusCell | actionTypes.ClearOutputs | actionTypes.AppendOutput | actionTypes.UpdateDisplay | actionTypes.MoveCell | actionTypes.DeleteCell | actionTypes.RemoveCell | actionTypes.CreateCellBelow | actionTypes.CreateCellAbove | actionTypes.CreateCellAfter | actionTypes.CreateCellBefore | actionTypes.CreateCellAppend | actionTypes.ToggleCellOutputVisibility | actionTypes.ToggleCellInputVisibility | actionTypes.UpdateCellStatus | actionTypes.UpdateOutputMetadata | actionTypes.SetLanguageInfo | actionTypes.SetKernelspecInfo | actionTypes.OverwriteMetadataField | actionTypes.DeleteMetadataField | actionTypes.CopyCell | actionTypes.CutCell | actionTypes.PasteCell | actionTypes.ChangeCellType | actionTypes.ToggleCellExpansion | actionTypes.AcceptPayloadMessage | actionTypes.SendExecuteRequest | actionTypes.SaveFulfilled | actionTypes.RestartKernel | actionTypes.ClearAllOutputs | actionTypes.SetInCell<any> | actionTypes.UnhideAll;
export declare function notebook(state: RecordOf<DocumentRecordProps> | undefined, action: DocumentAction): RecordOf<DocumentRecordProps>;
export {};
