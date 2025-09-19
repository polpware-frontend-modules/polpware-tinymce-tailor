// scripts/postbuild.js

const fs = require('fs');
const path = require('path');

// Path to the original package.json in the root directory
const originalPackageJsonPath = path.resolve(__dirname, '../package.json');

// Path where the new package.json will be created in the dist directory
const distPackageJsonPath = path.resolve(__dirname, '../dist/package.json');

// Read the original package.json file
const originalPackageJson = JSON.parse(fs.readFileSync(originalPackageJsonPath, 'utf8'));

// Create a new object for the distributable package.json
// We only pick the fields that are necessary for publishing
const distPackageJson = {
  name: originalPackageJson.name,
  version: originalPackageJson.version,
  description: originalPackageJson.description,
  // Adjust paths to be relative to the 'dist' folder
  main: originalPackageJson.main.replace('dist/', ''),
  module: originalPackageJson.module.replace('dist/', ''),
  types: originalPackageJson.types.replace('dist/', ''),
  files: undefined, // The 'files' field is not needed in the dist package.json
  dependencies: originalPackageJson.dependencies,
  // Add any other fields you want to keep, like 'author', 'license', 'keywords', etc.
};

// Write the new, clean package.json to the dist folder
// The 'null, 2' argument formats the JSON file with an indentation of 2 spaces
fs.writeFileSync(distPackageJsonPath, JSON.stringify(distPackageJson, null, 2));

console.log('Clean package.json created in dist folder.');
