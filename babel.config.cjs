module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    // Custom inline plugin to handle import.meta → process.env fallback
    function importMetaPlugin() {
      return {
        visitor: {
          MetaProperty(path) {
            // Replace `import.meta` with `{ env: process.env }`
            path.replaceWithSourceString('({ env: process.env })');
          },
        },
      };
    },
  ],
  sourceType: 'module',
};
