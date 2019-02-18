/**
 * Basics suite.
 */
describe('Basics', () => {
  const catalystLabelableMixin = window.CatalystElements.catalystLabelableMixin;

  // tslint:disable-next-line: no-inferred-empty-object-type
  class TestElement extends catalystLabelableMixin(HTMLElement) {
    public static get is(): string {
      return 'test-element';
    }

    public constructor() {
      super();
    }
  }

  let element: TestElement;

  before(() => {
    window.customElements.define(TestElement.is, TestElement);
  });

  beforeEach(() => {
    element = document.createElement(TestElement.is);
    window.customElements.upgrade(element);
  });

  describe('Creation', () => {

    it('can be created', () => {
      expect(element, 'Couldn\'t create element').to.be.ok;
    });

    it('has its mixin symbol applied', () => {
      expect(catalystLabelableMixin.id, 'Symbol should exist').to.be.a('symbol');
      expect(element[catalystLabelableMixin.id], 'Symbol should be applied to element').to.be.true;
    });
  });

  describe('In DOM', () => {
    let label: HTMLLabelElement;

    beforeEach(() => {
      label = document.createElement('label');
      label.htmlFor = 'foo';
      label.textContent = 'Label';
      label.id = 'bar';
      document.body.appendChild(label);

      element.id = 'foo';
      document.body.appendChild(element);
    });

    afterEach(() => {
      document.body.removeChild(label);
      document.body.removeChild(element);
    });

    it('has an aria-labelledby attribute', () => {
      expect(element.hasAttribute('aria-labelledby'), 'aria-labelledby not set').to.be.true;
      expect(element.getAttribute('aria-labelledby'), 'aria-labelledby not set correctly').to.equal('bar');
    });
  });
});
