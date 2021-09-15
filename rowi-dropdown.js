import RowiElement from './node_modules/@rowi/rowi-element/rowi-element.js'
import './node_modules/@rowi/rowi-overlay/rowi-overlay.js'

const 


class RWDropdown extends RowiElement {

  constructor () {
    super()
    this._connected = false
    this.attachShadow({mode: 'open'})
    this.createElement([this.shadowRoot,
      ['slot', {attrs: {name: 'holder'}}],
      ['rw-overlay',
        {
          on: {
            $opened: ev => this.overlayChanged(ev)
          }
        },
        ['slot', {attrs: {name: 'dropdown'}}]
      ]
    ])
  }

  connectedCallback () {
    this._connected = true
  }

  disconnectedCallback () {
    this._connected = false
  }

  static get observedAttributes () {
    return [
      'data-opened'
    ]
  }

  get props () {
    return {  
      opened: { type: 'boolean', handler () { this.openedChanged() } },
    }
  }

  overlayChanged (ev) {
    //
  }

  openedChanged (ev) {
    //
  }
}

customElements.define("rw-dropdown", RWDropdown)