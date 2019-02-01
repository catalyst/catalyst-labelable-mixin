export default (() => {
  const presets = [];
  const plugins = ['@babel/plugin-syntax-dynamic-import', 'babel-plugin-unassert'];

  const retainLines = true;

  const shouldPrintComment = (comment: string) => {
    // Remove tslint comments.
    if (/^ *tslint\:/.test(comment)) {
      return false;
    }

    // Remove typescript compiler comments.
    if (/^ *\@ts-/.test(comment)) {
      return false;
    }

    // Keep all other comments.
    return true;
  };

  return {
    shouldPrintComment,
    retainLines,
    presets,
    plugins
  };
})();
