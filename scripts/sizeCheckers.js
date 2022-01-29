const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const { gzipSync } = require('zlib');
const { compress } = require('brotli');

function checkPackageSize(pkg, formats) {
  if (formats.includes('umd')) {
    checkFileSize(path.resolve(pkg.distPath, 'index.umd.js'));
  }
}

function checkFileSize(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const file = fs.readFileSync(filePath);
  const minSize = (file.length / 1024).toFixed(2) + 'kb';
  const gzipped = gzipSync(file);
  const gzippedSize = (gzipped.length / 1024).toFixed(2) + 'kb';
  const compressed = compress(file);
  const compressedSize = (compressed.length / 1024).toFixed(2) + 'kb';

  console.log(
    `${chalk.gray(chalk.bold(path.basename(filePath)))} min:${minSize} / gzip:${gzippedSize} / brotli:${compressedSize}`
  );
}

module.exports = {
  checkPackageSize,
  checkFileSize,
};
