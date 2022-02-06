const Package = require('./package');
const PackageBuilder = require('./packageBuilder');

const pkg = new Package(process.cwd());

new PackageBuilder(pkg).clean();
