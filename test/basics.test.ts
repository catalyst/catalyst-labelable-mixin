// @ts-ignore
import { catalystLabelableMixin } from '../catalyst-labelable-mixin.mjs';
import { TestElement } from './helpers/TestElement';

// Globably avaliable through `test-fixture-mocha.js`
declare function fixture(id: 'unlabelled'): TestElement & HTMLElement;
declare function fixture(id: 'labelled'): [HTMLLabelElement, TestElement & HTMLElement];

/**
 * Basics suite.
 */
describe('Basics', () => {

  describe('Unlabelled', () => {

    let element: TestElement & HTMLElement;

    beforeEach(function () {
      element = fixture('unlabelled');
    });

    describe('Initialization', () => {

      it('can be created', () => {
        chai.expect(element, 'Couldn\'t create element').to.be.ok;
      });

      it('can be instanceof\'ed', () => {
        chai.expect(element instanceof catalystLabelableMixin, 'Element should be an instance of mixin').to.be.true;
      });

      it('does not have an aria-labelledby attribute', () => {
        chai.expect(element.hasAttribute('aria-labelledby'), 'aria-labelledby not set').to.be.false;
      });
    });
  });

  describe('Labelled', () => {

    let label: HTMLLabelElement;
    let element: TestElement & HTMLElement;

    beforeEach(function () {
      [label, element] = fixture('labelled');
    });

    describe('Initialization', () => {

      it('has an aria-labelledby attribute', () => {
        chai.expect(element.hasAttribute('aria-labelledby'), 'aria-labelledby not set').to.be.true;
        chai.expect(element.getAttribute('aria-labelledby'), 'aria-labelledby not set correctly').to.equal('label');
      });
    });
  });
});
