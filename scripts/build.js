const Package = require('./package');
const PackageBuilder = require('./packageBuilder');
const { checkPackageSize } = require('./sizeCheckers');

const args = require('minimist')(process.argv.slice(2));
const release = args.release || false;

build();

async function build() {
  const pkg = new Package(process.env.PWD);
  const builder = new PackageBuilder(pkg);
  const formats = ['esm', 'cjs', 'umd'];

  if (release) builder.cleanCache();

  builder.clean();
  builder.prepare();

  for (const format of formats) {
    await builder.build(format);
  }

  builder.syncDistToNodeModules();
  checkPackageSize(pkg, formats);
}
