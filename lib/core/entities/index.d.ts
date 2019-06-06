/// <reference types="react" />
export declare const entities: import("redux").Reducer<{
    contents: import("immutable").RecordOf<import("@nteract/types").ContentsRecordProps>;
    hosts: {
        byRef: import("immutable").Map<string, import("@nteract/types").HostRecord>;
        refs: import("immutable").List<string>;
    };
    kernels: {
        byRef: import("immutable").Map<{}, {}>;
    };
    kernelspecs: {
        byRef: import("immutable").Map<{}, {}>;
        refs: import("immutable").List<any>;
    };
    modals: {
        modalType: string;
    };
    transforms: {
        byId: import("immutable").Map<string, import("react").ComponentClass<{}, any>>;
        displayOrder: import("immutable").List<any>;
    };
}, import("redux").Action<any>>;
