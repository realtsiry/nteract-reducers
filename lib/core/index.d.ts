import { Action } from "redux";
declare const core: import("redux").Reducer<{
    currentKernelspecsRef: string;
    entities: {
        contents: any;
        hosts: any;
        kernels: any;
        kernelspecs: any;
        modals: any;
        transforms: any;
    };
    kernelRef: string;
}, Action<any>>;
export default core;
