declare const getRollupConfig: (rollupThis: any, pkg: any) => ({
    external: (id: string) => boolean;
    input: {
        index: string;
    };
    output: {
        dir: string;
        format: string;
        sourcemap: boolean;
    };
    plugins: import("rollup").Plugin[];
} | {
    external: (id: string) => boolean;
    input: {
        index: string;
    };
    output: {
        dir: string;
        format: string;
        sourcemap: boolean;
    }[];
    plugins: (import("rollup").Plugin | {
        generateBundle(): void;
        name: string;
    })[];
})[];
export { getRollupConfig };
