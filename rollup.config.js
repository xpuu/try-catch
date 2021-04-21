import resolve from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import alias from '@rollup/plugin-alias'
import json from '@rollup/plugin-json'
import svelte from 'rollup-plugin-svelte'
import babel from '@rollup/plugin-babel'
import { terser } from 'rollup-plugin-terser'
import config from 'sapper/config/rollup.js'
import pkg from './package.json'

const mode = process.env.NODE_ENV
const dev = mode === 'development'
const legacy = !!process.env.SAPPER_LEGACY_BUILD

let aliasCfg = alias({ entries: [{ find: '~', replacement: __dirname + '/src' }] })

let replaceCfg = replace({
  preventAssignment: true,
  values: {
    'process.browser': true,
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
})

let { preprocess } = require('./svelte.config.js')

const logless = warning => {
  let { message, filename, start } = warning
  return { message: `${message} ${filename} line ${start.line}` }
}

const onwarn = (warning, handler) => {
  let { code, message } = warning
  switch (true) {
    // Wretcher
    case code === 'THIS_IS_UNDEFINED':
    // Sapper defaults
    case code === 'MISSING_EXPORT' && /'preload'/.test(message):
    case code === 'CIRCULAR_DEPENDENCY' && /[/\\]@sapper[/\\]/.test(message):
      return
    case 'PLUGIN_WARNING' && /Unused CSS selector/.test(message):
      return handler(logless(warning))
    default:
      handler(warning)
  }
}

const svelteOnWarn = (warning, handler) => {
  let { code, message } = warning
  if (code.match(/^a11y/)) handler(logless(warning))
  else handler(warning)
}

export default {
  client: {
    input: config.client.input(),
    output: config.client.output(),
    plugins: [
      json(),
      aliasCfg,
      replaceCfg,
      svelte({
        preprocess,
        onwarn: svelteOnWarn,
        compilerOptions: {
          dev,
          hydratable: true,
        },
      }),
      resolve({
        browser: true,
        dedupe: ['svelte'],
      }),
      commonjs(),

      legacy &&
        babel({
          extensions: ['.js', '.mjs', '.html', '.svelte'],
          babelHelpers: 'runtime',
          exclude: ['node_modules/@babel/**'],
          presets: [['@babel/preset-env', { targets: '> 0.25%, not dead' }]],
          plugins: [
            '@babel/plugin-syntax-dynamic-import',
            [
              '@babel/plugin-transform-runtime',
              {
                useESModules: true,
              },
            ],
          ],
        }),

      !dev &&
        terser({
          module: true,
        }),
    ],

    preserveEntrySignatures: false,
    onwarn,
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      json(),
      aliasCfg,
      replaceCfg,
      svelte({
        preprocess,
        onwarn: svelteOnWarn,
        compilerOptions: {
          dev,
          generate: 'ssr',
          hydratable: true,
        },
      }),
      resolve({
        dedupe: ['svelte'],
      }),
      commonjs(),
    ],
    external: Object.keys(pkg.dependencies).concat(
      require('module').builtinModules || Object.keys(process.binding('natives'))
    ),

    preserveEntrySignatures: 'strict',
    onwarn,
  },

  /*
  serviceworker: {
    input: config.serviceworker.input(),
    output: config.serviceworker.output(),
    plugins: [
      resolve(),
      replaceCfg,
      commonjs(),
      !dev && terser(),
    ],

    preserveEntrySignatures: false,
    onwarn,
  },
  */
}
