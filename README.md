# catalyst-labelable-mixin

[![Travis](https://img.shields.io/travis/catalyst/catalyst-labelable-mixin/master.svg?style=flat-square)](https://travis-ci.org/catalyst/catalyst-labelable-mixin)
[![David](https://img.shields.io/david/catalyst/catalyst-labelable-mixin.svg?style=flat-square)](https://david-dm.org/catalyst/catalyst-labelable-mixin)
[![David](https://img.shields.io/david/dev/catalyst/catalyst-labelable-mixin.svg?style=flat-square)](https://david-dm.org/catalyst/catalyst-labelable-mixin?type=dev)
[![npm (scoped)](https://img.shields.io/npm/v/@catalyst-elements/catalyst-labelable-mixin.svg?style=flat-square)](https://www.npmjs.com/package/@catalyst-elements/catalyst-labelable-mixin)

[API documentation ↗](https://catalyst.github.io/CatalystElementsBundle/#/mixins/Labelable)

`<catalyst-labelable-mixin>` is a mixin function that retruns a class that
extends the given super class. The returned class will be the same as the super
class except it will also have labelable functionality.

*Note: If the element this mixin is applied to does not have an id, this mixin
will essentially do nothing.*

**Labelable functionality:**  
Essentially all this means is that the `aria-labelledby` attribute of the
element is configured automatically based on the label tags' `for` attribute.

*Note: Labels must either use the tag `<label>` or have the attribute
`role="label"`.*

## Installation

```sh
# Install with npm:
npm install --save @catalyst-elements/catalyst-labelable-mixin

# Install with yarn:
yarn add @catalyst-elements/catalyst-labelable-mixin
```

## Usage

The recommended way to use any component that's part of the [Catalyst Elements Collection](https://github.com/catalyst/CatalystElements) is to use it as a module. Although a script version of each components is made available, it is not recommended to use it.

### Example

```html
<!-- index.html -->
<html>
<head>
  <script src="node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js" defer></script>
  <script src="node_modules/@webcomponents/shadycss/scoping-shim.min.js" defer></script>
  <script type="module" src="main.mjs" defer></script>
</head>
<body>
  <label for="foo">This is my element:</label>
  <my-element id="foo"></my-element>
</body>
</html>
```

```js
// main.mjs
if (window.WebComponents !== undefined) {
  window.WebComponents.waitFor(async () => {
    return import('./my-element.mjs');
  });
}
```

```js
// my-element.mjs
import { catalystLabelableMixin } from './node_modules/@catalyst-elements/catalyst-labelable-mixin/catalyst-labelable-mixin.mjs';

export class MyElement extends catalystLabelableMixin(HTMLElement) {
  static get is() {
    return 'my-element';
  }

  constructor() {
    super();
    // ...
  }

  // ...
}
```

## Contributions

Contributions are most welcome.

Please read our [contribution guidelines](./CONTRIBUTING.md).
