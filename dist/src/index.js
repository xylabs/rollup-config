"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRollupConfig = void 0;
const tslib_1 = require("tslib");
const plugin_json_1 = (0, tslib_1.__importDefault)(require("@rollup/plugin-json"));
const plugin_replace_1 = (0, tslib_1.__importDefault)(require("@rollup/plugin-replace"));
const plugin_strip_1 = (0, tslib_1.__importDefault)(require("@rollup/plugin-strip"));
const plugin_typescript_1 = (0, tslib_1.__importDefault)(require("@rollup/plugin-typescript"));
const typescript_1 = (0, tslib_1.__importDefault)(require("typescript"));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getRollupConfig = (rollupThis, pkg) => {
    const deps = Object.keys(Object.assign({}, pkg.peerDependencies, pkg.dependencies));
    const BUILD_TARGET_MAGIC_STRING = '__BUILD_TARGET__';
    const generateBuildTargetReplaceConfig = (moduleFormat, languageTarget) => {
        let buildTarget = '';
        switch (moduleFormat.toLowerCase()) {
            case 'esm':
                buildTarget += 'esm';
                break;
            case 'cjs':
                buildTarget += 'cjs';
                break;
            default:
                throw Error(`unsupported module format ${moduleFormat}. Valid values are esm and cjs.`);
        }
        if (typeof languageTarget !== 'number') {
            throw Error('languageTarget accepts only number');
        }
        // simplified input validation
        if (languageTarget != 5 && languageTarget < 2015) {
            throw Error(`invalid languageTarget ${languageTarget}. Valid values are 5, 2015, 2016, etc.`);
        }
        buildTarget += languageTarget;
        return {
            [BUILD_TARGET_MAGIC_STRING]: buildTarget,
            preventAssignment: true,
        };
    };
    function emitModulePackageFile() {
        return {
            generateBundle() {
                rollupThis.emitFile({
                    fileName: 'package.json',
                    source: '{"type":"module"}',
                    type: 'asset',
                });
            },
            name: 'emit-module-package-file',
        };
    }
    const getPlugIns = (outDir) => {
        return [
            (0, plugin_json_1.default)(),
            (0, plugin_strip_1.default)({
                functions: ['debugAssert.*'],
            }),
            (0, plugin_typescript_1.default)({
                outDir,
                typescript: typescript_1.default,
            }),
        ];
    };
    const browserBuilds = [
        {
            external: (id) => deps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
            input: {
                index: './src/index.ts',
            },
            output: [{ dir: './dist/esm5', format: 'es', sourcemap: true }],
            plugins: [...getPlugIns('./dist/esm5'), (0, plugin_replace_1.default)(generateBuildTargetReplaceConfig('esm', 5))],
        },
        {
            external: (id) => deps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
            input: {
                index: './src/index.ts',
            },
            output: {
                dir: './dist/esm2017',
                format: 'es',
                sourcemap: true,
            },
            plugins: [...getPlugIns('./dist/esm2017'), (0, plugin_replace_1.default)(generateBuildTargetReplaceConfig('esm', 2017))],
        },
    ];
    const nodeBuilds = [
        {
            external: (id) => deps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
            input: {
                index: './src/index.ts',
            },
            output: [{ dir: './dist/node', format: 'cjs', sourcemap: true }],
            plugins: [...getPlugIns('./dist/node'), (0, plugin_replace_1.default)(generateBuildTargetReplaceConfig('cjs', 5))],
        },
        {
            external: (id) => deps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
            input: {
                index: './src/index.ts',
            },
            output: [{ dir: './dist/node-esm', format: 'es', sourcemap: true }],
            plugins: [
                ...getPlugIns('./dist/node-esm'),
                (0, plugin_replace_1.default)(generateBuildTargetReplaceConfig('esm', 2017)),
                emitModulePackageFile(),
            ],
        },
    ];
    return [...browserBuilds, ...nodeBuilds];
};
exports.getRollupConfig = getRollupConfig;
//# sourceMappingURL=index.js.map