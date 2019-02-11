# catalyst-labelable-mixin

[![Travis](https://img.shields.io/travis/catalyst/catalyst-labelable-mixin/master.svg?style=flat-square)](https://travis-ci.org/catalyst/catalyst-labelable-mixin)
[![David](https://img.shields.io/david/catalyst/catalyst-labelable-mixin.svg?style=flat-square)](https://david-dm.org/catalyst/catalyst-labelable-mixin)
[![David](https://img.shields.io/david/dev/catalyst/catalyst-labelable-mixin.svg?style=flat-square)](https://david-dm.org/catalyst/catalyst-labelable-mixin?type=dev)
[![npm (scoped)](https://img.shields.io/npm/v/@catalyst-elements/catalyst-labelable-mixin.svg?style=flat-square)](https://www.npmjs.com/package/@catalyst-elements/catalyst-labelable-mixin)

[API documentation ↗](https://catalyst.github.io/CatalystElementsBundle/#/mixins/Labelable)

`<catalyst-labelable-mixin>` is a mixin that provides an element with toggle behavior.

## Installation

Install with npm:

```sh
npm install --save @catalyst-elements/catalyst-labelable-mixin
```

Install with yarn:

```sh
yarn add @catalyst-elements/catalyst-labelable-mixin
```

## Usage

### As a Module (Recommend)

```js
import { catalystLabelableMixin } from '@catalyst-elements/catalyst-labelable-mixin';

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

```html
<label for="foo">This is my element:</label>
<my-element id="foo"></my-element>
```

### As a Script (Not Recommend)

```js
var SuperElement = window.CatalystElements.catalystLabelableMixin(HTMLElement);

function MyElement() {
  SuperElement.call(this);
  // ...
};
MyElement.prototype = Object.create(SuperElement.prototype);
MyElement.prototype.constructor = MyElement;
MyElement.prototype.is = 'my-element';
window.MyElements = window.MyElements || {};
window.MyElements.MyElement = MyElement;

// ...
```

## Contributions

Contributions are most welcome.

Please read our [contribution guidelines](./CONTRIBUTING.md).
