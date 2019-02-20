const mixinId = Symbol('CatalystLabelableMixinID');

/**
 * `<catalyst-labelable-mixin>` is a mixin function that retruns a class that
 * extends the given super class. The returned class will be the same as the
 * super class except it will also have labelable functionality.
 *
 * *Note: If the element this mixin is applied to does not have an id, this
 * mixin will essentially do nothing.*
 *
 * ### Labelable functionality
 *
 * Essentially all this means is that the `aria-labelledby` attribute of the
 * element is configured automatically based on the label tags' `for` attribute.
 *
 * *Note: Labels must either use the tag `<label>` or have the attribute
 * `role="label"`.*
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
 * ### Extra Notes
 *
 * #### `instanceof` can be used to test if a given element has this mixin applied.
 *
 * Using the example above:
 *
 * ```js
 * MyElement instanceof catalystLabelableMixin // === true
 * ```
 *
 * @summary Makes an element labelable.
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
     * The labels that are currently attached to this element.
     */
    public get labels(): Array<HTMLElement> {
      return this._getLabels();
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
      this.updateLabels();
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
     * Update the list of labels that are for this element.
     *
     * Note: There is no need to call this method before accessing the `labels`
     * property.
     */
    public updateLabels(): void {
      this._getLabels();
    }

    /**
     * Update the list of labels that are for this element.
     *
     * Note: There is no need to call this method before accessing the `labels`
     * property.
     */
    private _getLabels(): Array<HTMLElement> {
      const labels = this._getLabelsGetTags();
      this._updateAriaLablledby(labels);

      return labels;
    }

    /**
     * Disconnect all of this element's labels from it.
     */
    private _disconnectLabels(): void {
      const labels = this._getLabelsGetTags();
      labels.forEach((label) => {
        label.removeAttribute('for');
      });
    }

    /**
     * Get the label tags for this element.
     */
    private _getLabelsGetTags(): Array<HTMLElement> {
      // No id implies no labels.
      if (this.id === '') {
        return [];
      }

      const rootNode = this.getRootNode();
      if (!(rootNode instanceof Document || rootNode instanceof DocumentFragment || rootNode instanceof Element)) {
        return [];
      }

      return (
        Array.from(
          // tslint:disable-next-line: no-unnecessary-type-assertion
          rootNode.querySelectorAll(`[for="${this.id}"]`) as NodeListOf<HTMLElement>
        )
          .filter((label) => label.tagName === 'LABEL' || label.getAttribute('role') === 'label')
      );
    }

    /**
     * Update the aria-labelledby attribute.
     */
    private _updateAriaLablledby(labels: ReadonlyArray<HTMLElement>): void {
      if (labels.length === 0) {
        this.removeAttribute('aria-labelledby');
        return;
      }

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

/**
 * Allow using `instanceof` to determin if the given instance has this mixin applied.
 */
Object.defineProperty(catalystLabelableMixin, Symbol.hasInstance, {
  value: (instance: unknown): boolean => {
    if (instance === null || typeof instance !== 'object') {
      return false;
    }
    // tslint:disable-next-line: no-any
    return (instance as any)[mixinId] === true;
  },
  writable: false
});
