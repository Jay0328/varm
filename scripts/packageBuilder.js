const path = require('path');
const fs = require('fs-extra');
// const glob = require('glob');
const { rollup } = require('rollup');
const ts = require('rollup-plugin-typescript2');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const replace = require('@rollup/plugin-replace');
const { terser } = require('rollup-plugin-terser');

const formatToRollupFormat = {
  esm: 'es',
  cjs: 'cjs',
  umd: 'umd',
};

const globals = {
  '@mono/shared': 'MonoShared',
  '@mono/core': 'MonoCore',
};

class PackageBuilder {
  constructor(pkg) {
    this.pkg = pkg;
  }

  clean() {
    fs.rmSync(this.pkg.distPath, {
      force: true,
      recursive: true,
    });
    fs.rmSync(this.pkg.pathInNodeModules, {
      force: true,
      recursive: true,
    });
  }

  cleanCache() {
    fs.rmSync(this.pkg.tsPluginCachePath, {
      force: true,
      recursive: true,
    });
  }

  prepare() {
    fs.mkdirSync(this.pkg.distPath);

    /**
     * copy LICENSE
     */
    const licensePath = path.resolve(this.pkg.rootPath, 'LICENSE');
    const licenseDistPath = path.resolve(this.pkg.distPath, 'LICENSE');

    fs.copyFileSync(licensePath, licenseDistPath);

    /**
     * copy README.md/package.json
     */
    ['README.md', 'package.json'].forEach((file) => {
      const readmeFilePath = path.resolve(this.pkg.path, file);
      const readmeDistpath = path.resolve(this.pkg.distPath, file);

      fs.copyFileSync(readmeFilePath, readmeDistpath);
    });
  }

  build(format) {
    return rollupBuild(this.createOptions(format));
  }

  syncDistToNodeModules() {
    fs.copySync(this.pkg.distPath, this.pkg.pathInNodeModules);
  }

  createOptions(format) {
    const rollupFormat = formatToRollupFormat[format];
    const isEsm = format === 'esm';
    const isUmd = rollupFormat === 'umd';
    const { dependencies = {}, peerDependencies = {}, sideEffects = false, version } = this.pkg.json;
    const externalDependencies = Object.keys({
      ...dependencies,
      ...peerDependencies,
    });
    const output = {
      banner: this.pkg.banner,
      file: path.resolve(this.pkg.distPath, `index.${format}.js`),
      exports: 'named',
      externalLiveBindings: false,
      format: rollupFormat,
      globals,
      // preserveModules: true,
      // preserveModulesRoot: pkg.srcPath,
    };

    if (isUmd) {
      output.name = globals[this.pkg.json.name];
    }

    return {
      input: path.resolve(this.pkg.srcPath, 'index.ts'),
      external(id) {
        if (externalDependencies.some((ext) => id.startsWith(ext))) {
          return true;
        }

        return false;
      },
      output,
      plugins: [
        replace({
          preventAssignment: true,
          values: {
            __VERSION__: `'${version}'`,
            __DEV__: isEsm ? `(process.env.NODE_ENV !== 'production')` : 'false',
          },
        }),
        ts({
          check: true,
          cacheRoot: this.pkg.tsPluginCachePath,
          tsconfig: this.pkg.tsconfigPath,
          tsconfigOverride: {
            compilerOptions: {
              allowUnreachableCode: true,
            },
          },
        }),
        commonjs(),
        nodeResolve(),
        isUmd &&
          terser({
            module: isEsm,
            compress: {
              ecma: 2015,
              pure_getters: true,
            },
            safari10: true,
          }),
      ].filter(Boolean),
      treeshake: {
        moduleSideEffects: sideEffects,
      },
    };
  }
}

async function rollupBuild({ output, ...options }) {
  const bundle = await rollup(options);

  if (Array.isArray(output)) {
    await Promise.all(output.map((o) => bundle.write(o)));
  } else {
    await bundle.write(output);
  }
}

// function getFilesByGlob(globPath) {
//   return new Promise((resolve, reject) => {
//     glob(globPath, (error, files) => {
//       if (error) {
//         reject(error);
//       }

//       resolve(files);
//     });
//   });
// }

module.exports = PackageBuilder;
