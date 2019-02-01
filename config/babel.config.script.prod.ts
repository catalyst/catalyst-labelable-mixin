export default (() => {
  const presets = [
    ['@babel/preset-env', {
      useBuiltIns: 'usage'
    }]
  ];
  const plugins = ['@babel/plugin-syntax-dynamic-import', 'babel-plugin-unassert'];

  const retainLines = false;
  const comments = false;
  const minified = true;

  return {
    comments,
    minified,
    retainLines,
    presets,
    plugins
  };
})();
