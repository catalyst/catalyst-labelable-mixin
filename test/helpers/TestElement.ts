// @ts-ignore
import { catalystLabelableMixin } from '../../catalyst-labelable-mixin.mjs';

export class TestElement extends catalystLabelableMixin(HTMLElement) {
  public static get is(): string {
    return 'test-element';
  }

  public constructor() {
    super();
  }
}

window.customElements.define(TestElement.is, TestElement);
