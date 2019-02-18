import * as chai from 'chai';

import { catalystLabelableMixin } from '../src/catalyst-labelable-mixin';

declare global {
  interface Window {
    CatalystElements: {
      catalystLabelableMixin: typeof catalystLabelableMixin
    };
  }

  export const expect = chai.expect;
  export const should = chai.should;
  export const use = chai.use;
}
