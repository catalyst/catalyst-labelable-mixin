const mixinId = Symbol('CatalystLabelableMixinID');

/**
 * `<catalyst-labelable-mixin>` is a mix in funcation that retruns a class that
 * extends the given super class. The returned class will be the same as the
 * super class except it will also have labelable functionality.
 *
 * *Note: If the element this mixin is allpied to does not have an id, this mixin will essentially do nothing.*
 *
 * ### Labelable functionality
 *
 * Essentially all this means is that the `aria-labelledby` attribute of the
 * element is configured automatically based on the `label` tags' `for` attribute.
 *
 * ### Example
 *
 * ```js
 * import { catalystLabelableMixin } from '@catalyst-elements/catalyst-labelable-mixin';
 *
 * export class MyElement extends catalystLabelableMixin(HTMLElement) {
 *   static get is() {
 *     return 'my-element';
 *   }
 *
 *   // ...
 * }
 * ```
 *
 * ```html
 * <label for="foo">This is my element:</label>
 * <my-element id="foo"></my-element>
 * ```
 *
 * @mixinFunction
 * @polymer
 * @group Catalyst Elements
 *
 * @param mixWith The class to extend/apply this mixin to.
 */
export const catalystLabelableMixin = (mixWith: new() => HTMLElement): (new() => HTMLElement) => {

  // Does this class already have this mixin applied?
  // Test this before defining the new class so it isn't made unnecessarily.
  // tslint:disable-next-line: no-any
  if (((mixWith as any)[mixinId] as boolean | undefined) === true) {
    return mixWith;
  }

  /**
   * The new mixed class.
   */
  class CatalystLabelable extends mixWith {
    /**
     * Always set to true. Test an object for this Symbol to see if this mixin has been applied to it.
     */
    public readonly [mixinId]: true;

    /**
     * Construct the mixin.
     */
    public constructor() {
      super();
      this[mixinId] = true;
    }

    /**
     * Called when the element is inserted into the DOM.
     */
    public connectedCallback(): void {
      // @ts-ignore
      if (typeof super.connectedCallback === 'function') {
        // @ts-ignore
        // tslint:disable-next-line: no-unsafe-any
        super.connectedCallback();
      }
      this._connectLabels();
    }

    /**
     * Called when the element is removed from the DOM.
     */
    public disconnectedCallback(): void {
      // @ts-ignore
      if (typeof super.disconnectedCallback === 'function') {
        // @ts-ignore
        // tslint:disable-next-line: no-unsafe-any
        super.disconnectedCallback();
      }
      this._disconnectLabels();
    }

    /**
     * Ensure the labels for this element are connected to it correctly.
     */
    protected _connectLabels(): void {
      // No id implies no labels.
      if (this.id === '') {
        return;
      }

      const rootNode = this.getRootNode();
      if (!(rootNode instanceof Document || rootNode instanceof DocumentFragment || rootNode instanceof Element)) {
        return;
      }
      const labels = rootNode.querySelectorAll(`label[for="${this.id}"]`);

      if (labels.length > 0) {
        const labelledByIds = Array
          .from(labels)
          .reduce<ReadonlyArray<string>>((labelIds, label) => {
            // Labels must have an id for `aria-labelledby`.
            if (label.id === '') {
              // tslint:disable-next-line: no-object-mutation
              label.id = this._generateNewLabelId();
            }

            return [
              ...labelIds,
              label.id
            ];
          }, []);

        this.setAttribute('aria-labelledby', labelledByIds.join(' '));
      }
    }

    /**
     * Disconnect all of this element's labels from it.
     */
    protected _disconnectLabels(): void {
      if (this.id !== '') {
        const rootNode = this.getRootNode();
        if (!(rootNode instanceof Element)) {
          return;
        }
        const labels = rootNode.querySelectorAll(`label[for="${this.id}"]`);
        labels.forEach((label) => {
          label.removeAttribute('for');
        });
      }
    }

    /**
     * Generate a new unique id for a label element.
     */
    protected _generateNewLabelId(): string {
      /**
       * Generate something that seems like a UUID.
       *
       * @see https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript#answer-2117523
       */
      // tslint:disable-next-line: no-magic-numbers
      const uuid = `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, (character) => {
        const digit = Number.parseInt(character, 10);

        // tslint:disable-next-line: no-bitwise no-magic-numbers
        return (digit ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (digit / 4)))).toString(16);
      });

      // Element ids cannot start with a number.
      // Ensure the first character isn't a number by adding a prefix to the UUID.
      const id = `uuid-${uuid}`;

      // Check that there is no other node in this dom/shadow dom with this id.
      const rootNode = this.getRootNode();
      if ((rootNode as Element).querySelector(`#${id}`) === null) {
        return id;
      }

      // Id isn't unique? Generate a new one.
      return this._generateNewLabelId();
    }
  }

  // Return the new mixed class.
  return CatalystLabelable;
};

// tslint:disable-next-line: no-object-mutation
catalystLabelableMixin.id = mixinId;
