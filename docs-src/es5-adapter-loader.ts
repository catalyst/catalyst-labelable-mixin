const script = document.createElement('script');
script.setAttribute('src', 'vender/@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js');
script.setAttribute('defer', '');

// tslint:disable: no-non-null-assertion
const loader = document.getElementById('es5-adapter-loader')!;
loader.parentElement!.insertBefore(script, loader.nextSibling);
// tslint:enable: no-non-null-assertion
