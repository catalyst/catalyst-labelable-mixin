if (window.WebComponents === undefined) {
  throw new Error('WebComponents not defined.');
}

window.WebComponents.waitFor(async () => {
  return import('@polymer/iron-component-page');
});
