import image from '@rollup/plugin-image'
import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import strip from '@rollup/plugin-strip'
import typescriptPlugin from '@rollup/plugin-typescript'
import typescript from 'typescript'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getRollupConfig = (pkg: any) => {
  const deps = Object.keys(Object.assign({}, pkg.peerDependencies, pkg.dependencies))

  const BUILD_TARGET_MAGIC_STRING = '__BUILD_TARGET__'

  const generateBuildTargetReplaceConfig = (moduleFormat: string, languageTarget: number) => {
    let buildTarget = ''

    switch (moduleFormat.toLowerCase()) {
      case 'esm':
        buildTarget += 'esm'
        break
      case 'cjs':
        buildTarget += 'cjs'
        break
      default:
        throw Error(`unsupported module format ${moduleFormat}. Valid values are esm and cjs.`)
    }

    if (typeof languageTarget !== 'number') {
      throw Error('languageTarget accepts only number')
    }

    // simplified input validation
    if (languageTarget != 5 && languageTarget < 2015) {
      throw Error(`invalid languageTarget ${languageTarget}. Valid values are 5, 2015, 2016, etc.`)
    }

    buildTarget += languageTarget

    return {
      [BUILD_TARGET_MAGIC_STRING]: buildTarget,
      preventAssignment: true,
    }
  }

  function emitModulePackageFile() {
    return {
      generateBundle() {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const thisObj = this as any
        thisObj.emitFile({
          fileName: 'package.json',
          source: '{"type":"module"}',
          type: 'asset',
        })
      },
      name: 'emit-module-package-file',
    }
  }

  const getPlugIns = (outDir: string) => {
    return [
      image(),
      json(),
      strip({
        functions: ['debugAssert.*'],
      }),
      typescriptPlugin({
        outDir,
        typescript,
      }),
    ]
  }

  const browserBuilds = [
    {
      external: (id: string) => deps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
      input: {
        index: './src/index.ts',
      },
      output: [{ dir: './dist/esm5', format: 'es', sourcemap: true }],
      plugins: [...getPlugIns('./dist/esm5'), replace(generateBuildTargetReplaceConfig('esm', 5))],
    },
    {
      external: (id: string) => deps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
      input: {
        index: './src/index.ts',
      },
      output: {
        dir: './dist/esm2017',
        format: 'es',
        sourcemap: true,
      },
      plugins: [...getPlugIns('./dist/esm2017'), replace(generateBuildTargetReplaceConfig('esm', 2017))],
    },
  ]

  const nodeBuilds = [
    {
      external: (id: string) => deps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
      input: {
        index: './src/index.ts',
      },
      output: [{ dir: './dist/node', format: 'cjs', sourcemap: true }],
      plugins: [...getPlugIns('./dist/node'), replace(generateBuildTargetReplaceConfig('cjs', 5))],
    },
    {
      external: (id: string) => deps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
      input: {
        index: './src/index.ts',
      },
      output: [{ dir: './dist/node-esm', format: 'es', sourcemap: true }],
      plugins: [
        ...getPlugIns('./dist/node-esm'),
        replace(generateBuildTargetReplaceConfig('esm', 2017)),
        emitModulePackageFile(),
      ],
    },
  ]

  return [...browserBuilds, ...nodeBuilds]
}

export { getRollupConfig }
