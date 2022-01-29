const path = require('path');

class Package {
  constructor(pkgPath) {
    this.path = pkgPath;
  }

  get json() {
    return lazy(this, '_json', () => require(path.resolve(this.path, 'package.json')));
  }

  get srcPath() {
    return lazy(this, '_srcPath', () => path.resolve(this.path, 'src'));
  }

  get distPath() {
    return lazy(this, '_distPath', () => path.resolve(this.path, 'dist'));
  }

  get pathInNodeModules() {
    return lazy(this, '_pathInNodeModules', () => path.resolve(this.nodeModulesPath, ...this.json.name.split('/')));
  }

  get tsconfigPath() {
    return lazy(this, '_tsconfigPath', () => path.resolve(this.path, 'tsconfig.build.json'));
  }

  get rootPath() {
    return lazy(this, '_rootPath', () => path.resolve(__dirname, '..'));
  }

  get nodeModulesPath() {
    return lazy(this, '_nodeModulesPath', () => path.resolve(this.rootPath, 'node_modules'));
  }

  get tsPluginCachePath() {
    return lazy(this, '_tsPluginCachePath', () => path.resolve(this.nodeModulesPath, '.cache', 'rts2'));
  }

  get banner() {
    const { name, version } = this.json;

    return `/**
 * ${name} v${version}
 * (c) ${new Date().getFullYear()} Jay Chen
 * @license MIT
 */`;
  }
}

module.exports = Package;

function lazy(target, privateKey, fn) {
  return target[privateKey] ?? (target[privateKey] = fn());
}
