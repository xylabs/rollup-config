/* eslint-disable @typescript-eslint/no-unused-vars */
import commonjs from '@rollup/plugin-commonjs'
import image from '@rollup/plugin-image'
import json from '@rollup/plugin-json'
import nodeResolvePlugin from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import typescriptPlugin from '@rollup/plugin-typescript'
import typescript from 'typescript'

type Output = 'cjs5' | 'esm5' | 'esm2015' | 'esm2017' | 'node' | 'node-esm'

const findOutput = (output: Output, outputs: Output[]) => outputs.find((item) => item === output)

interface Params {
  pkg: Record<string, unknown>
  browserIndex?: string
  nodeIndex?: string
  tsconfig?: string
  bundlePrefix?: string
  nodeResolve?: boolean
  additionalNodeExternals?: string[]
  additionalBrowserExternals?: string[]
  outputs?: Output[]
}

const getRollupConfig = ({
  pkg,
  browserIndex = './src/index.ts',
  nodeIndex = './src/index.ts',
  tsconfig = 'tsconfig.build.json',
  bundlePrefix = '',
  nodeResolve = false,
  additionalNodeExternals,
  additionalBrowserExternals,
  outputs = ['cjs5', 'esm5', 'esm2015', 'esm2017', 'node', 'node-esm'],
}: Params) => {
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
      typescriptPlugin({
        outDir,
        tsconfig,
        typescript,
      }),
      image({ exclude: ['*.stories.*', '*.spec.*', '*.test.*'] }),
      json({ exclude: ['*.stories.*', '*.spec.*', '*.test.*'] }),
    ]
  }

  const bundlePath = (name: string) => {
    return `./dist/${bundlePrefix}${name}`
  }

  const browserExternals = (id: string) => deps.some((dep) => id === dep || id.startsWith(`${dep}/`) || additionalBrowserExternals?.find((item) => item === id))

  const optionalNodeCommonJsPlugIns = nodeResolve ? [nodeResolvePlugin(), commonjs({ include: 'node_modules/**' })] : [commonjs({})]

  const browserBuilds = [
    {
      external: browserExternals,
      input: {
        index: browserIndex,
      },
      name: 'cjs5',
      output: [{ dir: bundlePath('cjs5'), format: 'cjs', sourcemap: true }],
      plugins: [...getPlugIns(bundlePath('cjs5')), replace(generateBuildTargetReplaceConfig('cjs', 5))],
    },
    {
      external: browserExternals,
      input: {
        index: browserIndex,
      },
      name: 'esm5',
      output: [{ dir: bundlePath('esm5'), format: 'es', sourcemap: true }],
      plugins: [...getPlugIns(bundlePath('esm5')), replace(generateBuildTargetReplaceConfig('esm', 5))],
    },
    {
      external: browserExternals,
      input: {
        index: browserIndex,
      },
      name: 'esm2015',
      output: [{ dir: bundlePath('esm2015'), format: 'es', sourcemap: true }],
      plugins: [...getPlugIns(bundlePath('esm2015')), replace(generateBuildTargetReplaceConfig('esm', 2015))],
    },
    {
      external: browserExternals,
      input: {
        index: browserIndex,
      },
      name: 'esm2017',
      output: {
        dir: bundlePath('esm2017'),
        format: 'es',
        sourcemap: true,
      },
      plugins: [...getPlugIns(bundlePath('esm2017')), replace(generateBuildTargetReplaceConfig('esm', 2017))],
    },
  ]
    .filter((item) => findOutput(item.name as Output, outputs ?? []))
    .map(({ name, ...item }) => item)

  const nodeExternals = (id: string) => deps.some((dep) => id === dep || id.startsWith(`${dep}/`) || additionalNodeExternals?.find((item) => item === id))

  const nodeBuilds = [
    {
      external: nodeExternals,
      input: {
        index: nodeIndex,
      },
      name: 'node',
      output: [{ dir: bundlePath('node'), format: 'cjs', sourcemap: true }],
      plugins: [...getPlugIns(bundlePath('node')), ...optionalNodeCommonJsPlugIns, replace(generateBuildTargetReplaceConfig('cjs', 5))],
    },
    {
      external: nodeExternals,
      input: {
        index: nodeIndex,
      },
      name: 'node-esm',
      output: [{ dir: bundlePath('node-esm'), format: 'es', sourcemap: true }],
      plugins: [...getPlugIns(bundlePath('node-esm')), replace(generateBuildTargetReplaceConfig('esm', 2017)), emitModulePackageFile()],
    },
  ]
    .filter((item) => findOutput(item.name as Output, outputs ?? []))
    .map(({ name, ...item }) => item)

  return [...browserBuilds, ...nodeBuilds]
}

export { getRollupConfig }
