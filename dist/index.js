import { __read, __spreadArray } from "tslib";
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import strip from '@rollup/plugin-strip';
import typescriptPlugin from '@rollup/plugin-typescript';
import typescript from 'typescript';
var getRollupConfig = function (rollupThis, pkg) {
    var deps = Object.keys(Object.assign({}, pkg.peerDependencies, pkg.dependencies));
    var BUILD_TARGET_MAGIC_STRING = '__BUILD_TARGET__';
    var generateBuildTargetReplaceConfig = function (moduleFormat, languageTarget) {
        var _a;
        var buildTarget = '';
        switch (moduleFormat.toLowerCase()) {
            case 'esm':
                buildTarget += 'esm';
                break;
            case 'cjs':
                buildTarget += 'cjs';
                break;
            default:
                throw Error("unsupported module format ".concat(moduleFormat, ". Valid values are esm and cjs."));
        }
        if (typeof languageTarget !== 'number') {
            throw Error('languageTarget accepts only number');
        }
        // simplified input validation
        if (languageTarget != 5 && languageTarget < 2015) {
            throw Error("invalid languageTarget ".concat(languageTarget, ". Valid values are 5, 2015, 2016, etc."));
        }
        buildTarget += languageTarget;
        return _a = {},
            _a[BUILD_TARGET_MAGIC_STRING] = buildTarget,
            _a.preventAssignment = true,
            _a;
    };
    function emitModulePackageFile() {
        return {
            generateBundle: function () {
                rollupThis.emitFile({
                    fileName: 'package.json',
                    source: '{"type":"module"}',
                    type: 'asset',
                });
            },
            name: 'emit-module-package-file',
        };
    }
    var getPlugIns = function (outDir) {
        return [
            json(),
            strip({
                functions: ['debugAssert.*'],
            }),
            typescriptPlugin({
                outDir: outDir,
                typescript: typescript,
            }),
        ];
    };
    var browserBuilds = [
        {
            external: function (id) { return deps.some(function (dep) { return id === dep || id.startsWith("".concat(dep, "/")); }); },
            input: {
                index: './src/index.ts',
            },
            output: [{ dir: './dist/esm5', format: 'es', sourcemap: true }],
            plugins: __spreadArray(__spreadArray([], __read(getPlugIns('./dist/esm5')), false), [replace(generateBuildTargetReplaceConfig('esm', 5))], false),
        },
        {
            external: function (id) { return deps.some(function (dep) { return id === dep || id.startsWith("".concat(dep, "/")); }); },
            input: {
                index: './src/index.ts',
            },
            output: {
                dir: './dist/esm2017',
                format: 'es',
                sourcemap: true,
            },
            plugins: __spreadArray(__spreadArray([], __read(getPlugIns('./dist/esm2017')), false), [replace(generateBuildTargetReplaceConfig('esm', 2017))], false),
        },
    ];
    var nodeBuilds = [
        {
            external: function (id) { return deps.some(function (dep) { return id === dep || id.startsWith("".concat(dep, "/")); }); },
            input: {
                index: './src/index.ts',
            },
            output: [{ dir: './dist/node', format: 'cjs', sourcemap: true }],
            plugins: __spreadArray(__spreadArray([], __read(getPlugIns('./dist/node')), false), [replace(generateBuildTargetReplaceConfig('cjs', 5))], false),
        },
        {
            external: function (id) { return deps.some(function (dep) { return id === dep || id.startsWith("".concat(dep, "/")); }); },
            input: {
                index: './src/index.ts',
            },
            output: [{ dir: './dist/node-esm', format: 'es', sourcemap: true }],
            plugins: __spreadArray(__spreadArray([], __read(getPlugIns('./dist/node-esm')), false), [
                replace(generateBuildTargetReplaceConfig('esm', 2017)),
                emitModulePackageFile(),
            ], false),
        },
    ];
    return __spreadArray(__spreadArray([], __read(browserBuilds), false), __read(nodeBuilds), false);
};
export { getRollupConfig };
//# sourceMappingURL=index.js.map