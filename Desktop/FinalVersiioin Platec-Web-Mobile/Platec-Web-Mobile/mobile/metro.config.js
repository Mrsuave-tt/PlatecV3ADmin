const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow Firebase's .cjs files to be resolved
config.resolver.sourceExts.push('cjs');

// Disable package exports - fixes Firebase Auth "Component auth has not been registered yet" on iOS
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
