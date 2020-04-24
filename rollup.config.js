// rollup.config.js

import babel from "rollup-plugin-babel"
import resolve from "@rollup/plugin-node-resolve"
import commonjs from "rollup-plugin-commonjs"
import url from "rollup-plugin-url"
import { terser } from "rollup-plugin-terser"


const isProduction = !process.env.ROLLUP_WATCH

const prodConfig = {
  input: "./src/index.js",
  output:
  {
    file: "public/dist/vis.umd.js",
    format: "umd",
    sourcemap: false,
    name: "Vis",
  }
  ,
  plugins: [
    babel(
      {
        babelrc: false,
        exclude: "node_modules/**",
        presets: [
          [
            "@babel/preset-env",

            {
              corejs: 3,
              modules: false,
              useBuiltIns: "usage",
              targets: { ie: "11" },
            },
          ],
        ],
      },
    ),
    resolve({ browser: true }), // tells Rollup how to find date-fns in node_modules
    commonjs(), // converts date-fns to ES modules
    isProduction && terser(), // minify, but only in production
    url({
      limit: 10 * 1024, // inline files < 10k, copy files > 10k
      include: ["**/*.svg"], // defaults to .svg, .png, .jpg and .gif files
      emitFiles: true, // defaults to true
    }),

  ],
}

const devConfig = {
  input: "./src/index.js",
  output: {
    file: "public/graphVisualization.js",
    format: "esm",
    sourcemap: true,
    name: "GraphVisualization",
  },
  plugins: [
    babel(
      {
        babelrc: false,
        exclude: "node_modules/**",
        presets: [
          [
            "@babel/preset-env",

            {
              corejs: 3,
              modules: false,
              useBuiltIns: "usage",
              targets: { ie: "11" },
            },
          ],
        ],
      },
    ),
    resolve({ browser: true }), // tells Rollup how to find date-fns in node_modules
    commonjs(), // converts date-fns to ES modules
    isProduction && terser(), // minify, but only in production
    url({
      limit: 10 * 1024, // inline files < 10k, copy files > 10k
      include: ["**/*.svg"], // defaults to .svg, .png, .jpg and .gif files
      emitFiles: true, // defaults to true
    }),

  ],
}


const config = isProduction ? prodConfig : devConfig
export default config
