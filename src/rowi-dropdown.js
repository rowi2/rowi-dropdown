import RowiElement from '@rowi/rowi-element'
import '@rowi/rowi-overlay'


function getBoxInfo(maxWidth, maxHeight, style) {
  style.maxWidth = maxWidth
  style.maxHeight = maxHeight
  return style
}

class RWDropdown extends RowiElement {

  constructor () {
    super()
    this._connected = false
    this.attachShadow({mode: 'open'})

    const defaultTransition = this.props.transitionTime.default

    const style = `
      .dropdown {
        background-color: var(--rw-dropdown-color, white);
        border-radius: var(--rw-dropdown-radius, 4px);
        position: absolute;
        filter: var(--rw-dropdown-filter, drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.35)));
        border: var(--rw-dropdown-border, none);
        opacity: 0;
        transform: scale(0);
        transition: opacity ${defaultTransition}ms, transform ${defaultTransition}ms;
      }

      .dropdown.opened {
        opacity: 1;
        transform: scale(1);
        transition: opacity ${defaultTransition}ms, transform ${defaultTransition}ms;
      } 

      .arrow {
        border: 1px solid var(--rw-dropdown-color, white);
        position: absolute;
        width: 0;
        height: 0;
      }`

    this.createElement([this.shadowRoot,
      ['style', {props: {textContent: style}}],
      ['slot', {name: 'holder', attrs: {name: 'holder'}}],
      ['rw-overlay', {
        name: 'dropdown',
        props: {
          opacity: this.props.opacity.default,
          color: this.props.overlayColor.default,
          transition: this.props.transitionTime.default
        },
        on: {
          $opened: ev => {
            this._avoidUpdateOverlay = true
            this.opened = ev.detail.newValue
          }
        }
      },
        ['div', {name: 'box', class: 'dropdown'},
          ['div', {name: 'arrow', class: 'arrow'}],
          ['slot', {attrs: {name: 'dropdown'}}]
        ]
      ]
    ])

    this._windowResized = this._windowResized.bind(this)
  }

  connectedCallback () { this._connected = true }
  disconnectedCallback () { this._connected = false }

  static get observedAttributes () { return [
    'data-opened',
    'data-opacity',
    'data-overlay-color',
    'data-transition-time',
    'data-persistent',
    'data-intangible',
    'data-dropdown-style',
    'data-dropdown-position',
  ]}

  get props () {
    this._possibleDropdowns = ['normal', 'center', 'fit', 'corner']
    this._centralPositions = ['top', 'bottom', 'left', 'right']
    this._numericProps = [
      ...this._centralPositions, 'maxWidth', 'maxHeight', 'width', 'height'
    ]
    this._cornerPositions = [
      'top_left', 'top_right', 'bottom_left', 'bottom_right'
    ]
    this._possiblePositions = this._centralPositions.concat(this._cornerPositions)
    this._positions = new Set(this._possiblePositions)

    this._avoidUpdateOverlay = false

    return {  
      opened: { type: 'boolean', handler () {
        this._openedChanged()
      }},
      opacity: { type: 'number', default: 0, handler ({newValue}) {
        this.__refs__.dropdown.opacity = newValue
      }},
      overlayColor: { type: 'string', default: '0,0,0', handler ({newValue}) {
        this.__refs__.dropdown.color = newValue
      }},
      transitionTime: { type: 'number', default: 300, handler ({newValue}) {
        this.__refs__.dropdown.transition = newValue
      }},
      persistent: { type: 'boolean', handler ({newValue}) {
        this.__refs__.dropdown.persistent = newValue
      }},
      intangible: { type: 'boolean', handler ({newValue}) {
        this.__refs__.dropdown.intangible = newValue
      }},
      dropdownStyle: { type: 'string', default: 'normal',
        validator (value) {
          return this._possibleDropdowns.includes(value)
        }
      },
      dropdownPosition: { type: 'string', default: 'all',
        validator (valuesString) {
          valuesString = valuesString.trim()
          if (valuesString === 'all') return true
          const values = valuesString.split(/ +/)
          for (const value of values) {
            if (!this._possiblePositions.includes(value)) return false
          }
          return true
        },
        handler ({newValue}) {
          newValue = newValue.trim()
          if (newValue === 'all') {
            this._positions = new Set(this._possiblePositions)
          } else {
            this._positions = new Set(newValue.trim().split(/ +/))
          }
        }
      }
    }
  }

  _compareBoxes (boxes, positions) {
    for (const position of positions) {
      if (! boxes.hasOwnProperty(position)) continue
      const style = boxes[position]
      if (style.maxWidth * style.maxHeight > this._largestSize) {
        this._largestBoxPosition = position
        this._largestBoxStyle = style
      }
    }
  }  

  _findLargestBox (rect) {
    const _window = document.documentElement
    const windowHeight = _window.clientHeight
    const windowWidth = _window.clientWidth
  
    const rightWidth = windowWidth - rect.right
    const bottomHeight = windowHeight - rect.bottom
    const invertedLeft = windowWidth - rect.x
    const invertedBottom = windowHeight - rect.y

    this._largestSize = -Infinity
  
    if (this.dropdownStyle === 'normal') {
      const boxes = {
        top_left: getBoxInfo(
          rect.right, rect.y, {right: rect.right, bottom: rect.y}
        ),
        top_right: getBoxInfo(
          invertedLeft, rect.y, {left: rect.x, bottom: rect.y}
        ),
        left_top: getBoxInfo(
          rect.x, rect.bottom, {right: rect.x, bottom: rect.bottom}
        ),
        left_bottom: getBoxInfo(
          rect.x, invertedBottom, {right: rect.x, top: rect.y}
        ),
        right_top: getBoxInfo(
          rightWidth, rect.bottom, {left: rect.right, bottom: rect.bottom}
        ),
        right_bottom: getBoxInfo(
          rightWidth, invertedBottom, {left: rect.right, top: rect.y}
        ),
        bottom_left: getBoxInfo(
          rect.right, bottomHeight, {right: rect.right, top: rect.bottom}
        ),
        bottom_right: getBoxInfo(
          invertedLeft, bottomHeight, {left: rect.x, top: rect.bottom}
        ),
      }
      for (let position of this._positions) {
        if (['top', 'bottom'].includes(position)) {
          this._compareBoxes(boxes, [position + '_left', position + '_right'])
        } else {
          this._compareBoxes(boxes, [position + '_top', position + '_bottom'])
        }
      }
    } else {
      const centerVerticalStyle = {transform: 'translateX(-50%)', left: rect.x}
      const centerHorizStyle = {transform: 'translateY(-50%)', top: rect.y}
      const fitVerticalStyle = {left: rect.x, width: rect.width}
      const fitHorizStyle = {top: rect.y, height: rect.height}
      const boxes = {
        center: {
          top: getBoxInfo(windowWidth , rect.y, centerVerticalStyle),
          left: getBoxInfo(rect.x , windowHeight, centerHorizStyle),
          right: getBoxInfo(rightWidth , windowHeight, centerHorizStyle),
          bottom: getBoxInfo(windowWidth , bottomHeight, centerVerticalStyle),
        },
        fit: {
          top: getBoxInfo(
            rect.width , rect.y, {bottom: rect.y, ...fitVerticalStyle}
          ),
          left: getBoxInfo(
            rect.x , rect.height, {right: rect.x, ...fitHorizStyle}
          ),
          right: getBoxInfo(
            rightWidth , rect.height, {left: rect.right, ...fitHorizStyle}
          ),
          bottom: getBoxInfo(
            rect.width , bottomHeight, {top: rect.bottom, ...fitVerticalStyle}
          ),
        },
        corner: {
          top_left: getBoxInfo(
            rect.x , rect.y, {right: rect.x, bottom: rect.y}
          ),
          top_right: getBoxInfo(
            rightWidth , rect.y, {left: rect.right, bottom: rect.y}
          ),
          bottom_left: getBoxInfo(
            rect.x , bottomHeight, {right: rect.x, top: rect.bottom}
          ),
          bottom_right: getBoxInfo(
            rightWidth , bottomHeight, {left: rect.right, top: rect.bottom}
          ),
        }
      }
      this._compareBoxes(boxes[this.dropdownStyle], this._positions)
    }
  }

  _openedChanged () {
    if (this.opened) {
      window.addEventListener('resize', this._windowResized)
      this._updateAll()
      if (!this._avoidUpdateOverlay) {
        this.__refs__.dropdown.opened = true
        this._avoidUpdateOverlay = false
      }
      setTimeout(() => this.__refs__.box.classList.add('opened'))
    } else {
      window.removeEventListener('resize', this._windowResized)
      if (!this._avoidUpdateOverlay) {
        this.__refs__.dropdown.opened = false
        this._avoidUpdateOverlay = false
      }
      setTimeout(() => this.__refs__.box.classList.remove('opened'))
    }
  }

  _windowResized () {
    clearTimeout(this._windowResizedTimeoutID)
    this._windowResizedTimeoutID = setTimeout(() => this._updateAll(), 200)
  }

  _applyBoxStyle (style) {
    Object.entries(style).forEach(([prop, value]) => {
      if (this._numericProps.includes(prop)) value += 'px'
      this.__refs__.box.style[prop] = value
    })
  }

  _updateAll () {
    const holder = this.__refs__.holder
    const holderRect = holder.getBoundingClientRect()
    this._findLargestBox(holderRect)
    this._applyBoxStyle(this._largestBoxStyle)
    this._updateDropdown(holderRect)
  }

  _centerBoxHelper1 (boxSize, midPoint, windowSize, style, sides) {
    if (midPoint < windowSize / 2) {
      this._centerBoxHelper2(boxSize, midPoint, style, sides[0])
    } else {
      this._centerBoxHelper2(boxSize, windowSize - midPoint, style, sides[1])
    }
  }

  _centerBoxHelper2 (boxSize, halfSize, style, side) {
    if (boxSize/2 < halfSize) {
      this._applyBoxStyle(this._largestBoxStyle)
    } else {
      style[side] = 0
      this._applyBoxStyle(style)
    }
  }
  _updateDropdown (rect) {
    if (this.dropdownStyle !== 'center') return

    const box = this.__refs__.box
    const dropdown = this.__refs__.dropdown
    const opened = dropdown.opened

    if (!opened) {
      box.style.visibility = 'hidden'
      body.append(box)
    }
    const width = box.clientWidth
    const height = box.clientHeight
    if (!opened) {
      dropdown.append(box)
      box.style.visibility = 'visible'
    }

    const style = Object.assign({}, this._largestBoxStyle)
    delete style.transform

    const _window = document.documentElement
    if (['bottom', 'top'].includes(this._largestBoxPosition)) {
      const midPoint = rect.x + rect.width / 2
      this._centerBoxHelper1(
        width, midPoint, _window.clientWidth, style, ['left', 'right']
      )
    } else {
      const midPoint = rect.y + rect.height / 2
      this._centerBoxHelper1(
        height, midPoint, _window.clientHeight, style, ['top', 'bottom']
      )
    }
  }
}

customElements.define("rw-dropdown", RWDropdown)