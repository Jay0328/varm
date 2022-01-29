const Package = require('./package');
const PackageBuilder = require('./packageBuilder');

const pkg = new Package(process.env.PWD);

new PackageBuilder(pkg).clean();
