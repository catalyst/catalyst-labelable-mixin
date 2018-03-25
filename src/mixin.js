/* eslint "class-methods-use-this": ['warn', { "exceptMethods": ["onLabelClick"] }] */

const mixinId = Symbol('CatalystLabelableMixinID');

/**
 * `<catalyst-labelable-mixin>` is a mix in funcation that retruns a class that extends the given super class.
 * The returned class will be the same as the super class except it will also have labelable functionality.
 *
 * If this element does not have an id, this mixin's functionality will not be applied.
 *
 * @mixinFunction
 * @polymer
 *
 * @param {Class} MixWith
 *   The class to extend/apply this mixin to.
 * @returns {Class.<CatalystLabelable>}
 */
const catalystLabelableMixin = MixWith => {
  // Does this class already have this mixin applied?
  if (MixWith[mixinId] === true) {
    return MixWith;
  }

  // Apply the mixin.
  return class CatalystLabelable extends MixWith {
    /**
     * Construct the mixin.
     *
     * @public
     */
    constructor() {
      super();
      this[mixinId] = true;
    }

    /**
     * Fires when the element is inserted into the DOM.
     *
     * @protected
     */
    connectedCallback() {
      if (typeof super.connectedCallback === 'function') {
        super.connectedCallback();
      }
      this.connectLabels();
    }

    /**
     * Fires when the element is removed from the DOM.
     *
     * @protected
     */
    disconnectedCallback() {
      if (typeof super.disconnectedCallback === 'function') {
        super.disconnectedCallback();
      }
      this.disconnectLabels();
    }

    /**
     * Generate a new id for a label element.
     *
     * @private
     * @returns {string}
     */
    generateNewLabelId() {
      /**
       * Generate something that seems like a UUID.
       *
       * @see https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript#answer-2117523
       */
      const uuid = `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, c =>
        (
          c ^
          (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
        ).toString(16)
      );

      // Element ids cannot start with a number.
      // Ensure the first character isn't a number by adding a prefix to the UUID.
      const id = `catid-${uuid}`;

      // Check that there is no other node in this document with this id.
      const root = this.getRootNode();
      if (root != null && root.querySelector(`#${id}`) == null) {
        return id;
      }

      // Id isn't unique? Generate a new one.
      return this.generateNewLabelId();
    }

    /**
     * Connect the label events from this element.
     *
     * @protected
     */
    connectLabels() {
      // No id implies no labels.
      if (this.id == null || this.id === '') {
        return;
      }

      const rootNode = this.getRootNode();
      const labels = rootNode.querySelectorAll(`label[for="${this.id}"]`);

      if (labels && labels.length > 0) {
        const labelledBy = [];
        for (const label of labels) {
          // Labels must have an id for `aria-labelledby`.
          if (label.id == null || label.id === '') {
            label.id = this.generateNewLabelId();
          }
          labelledBy.push(label.id);

          label.addEventListener('click', this.onLabelClick);
        }
        this.setAttribute('aria-labelledby', labelledBy.join(' '));
      }
    }

    /**
     * Disconnect the label events from this element.
     *
     * @protected
     */
    disconnectLabels() {
      // No id implies no labels.
      if (this.id == null || this.id === '') {
        return;
      }

      const rootNode = this.getRootNode();
      const labels = rootNode.querySelectorAll(`label[for="${this.id}"]`);

      if (labels && labels.length > 0) {
        for (const label of labels) {
          label.removeEventListener('click', this.onLabelClick);
        }
      }
      this.removeAttribute('aria-labelledby');
    }

    /**
     * Called when a label of this element is clicked.
     *
     * @abstract
     * @protected
     */
    onLabelClick() {
      throw new Error(
        'Not Implement: Please implement the method `onLabelClick`.'
      );
    }
  };
};

export default catalystLabelableMixin;
export { catalystLabelableMixin };
