export default (() => {
  // tslint:disable-next-line: no-any
  const presets: ReadonlyArray<string | [string, any]> = [
    ['@babel/preset-env', {
      useBuiltIns: 'usage'
    }]
  ];
  const plugins: ReadonlyArray<string> = [
    '@babel/plugin-syntax-dynamic-import',
    'babel-plugin-unassert'
  ];

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
