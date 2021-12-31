import RowiElement from '@rowi/rowi-element'

function getBoxInfo(maxWidth, maxHeight, style) {
  style.maxWidth = maxWidth
  style.maxHeight = maxHeight
  return style
}

const rowiDropdownStyle = /*css*/`
  :host {
    display: block;
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    z-index: 2147483647;
  }

  .dropdown {
    background-color: var(--rw-dropdown-color, white);
    border-radius: var(--rw-dropdown-radius, 2px);
    position: absolute;
    filter: var(--rw-dropdown-filter, drop-shadow(2px 2px 4px rgba(0,0,0,0.35)));
    border: var(--rw-dropdown-border, none);
    opacity: 0;
    transform: scale(0);
    overflow: auto;
  }

  .dropdown.opened {
    opacity: 1;
    transform: scale(1);
  }

  .arrow {
    border: 1px solid var(--rw-dropdown-color, white);
    position: absolute;
    width: 0;
    height: 0;
  }
`

class RowiDropdown extends RowiElement {
  #windowResized
  constructor () {
    super()

    this._opened = false
    this._overlayReady = false
    this._overlayClicked = this._overlayClicked.bind(this)
    this._intangibleChanged = this._intangibleChanged.bind(this)
    this._transitionTimeChanged = this._transitionTimeChanged.bind(this)

    this.$buildShadow([
      ['style', rowiDropdownStyle],
      ['div', {
        name: 'dropdown', class: 'dropdown',
        attrs: {style: 'pointer-events: auto'}
      },
        ['div', {name: 'arrow', class: 'arrow'}],
        ['slot']
      ]
    ])

    this.#windowResized = this.#_windowResized.bind(this)
  }

  static get observedAttributes () { return [
    'data-opacity',
    'data-overlay-color',
    'data-transition-time',
    'data-persistent',
    'data-intangible',
    'data-dropdown-style',
    'data-dropdown-position',
    'data-query-selector'
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
    this._holder = null

    return {
      opacity: { type: 'number', default: 0 },
      overlayColor: { type: 'string', default: '0,0,0' },
      transitionTime: {
        type: 'number', default: 300,
        handler ({}) {
          this._transitionTimeChanged.call(this)
        }
      },
      persistent: { type: 'boolean' },
      intangible: {
        type: 'boolean',
        handler ({}) {
          this._intangibleChanged.call(this)
        }
      },
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
      },
      querySelector: {type: 'string'},
    }
  }

  connectedCallback () {
    super.connectedCallback()
    this._opened = true
    if (!this._overlayReady) {
      this._overlayReady = true
      this._intangibleChanged()
      this._transitionTimeChanged()
    }
  }

  disconnectedCallback () { this._opened = false }

  _overlayClicked (event) {
    if (event.target === this || !this.contains(event.target)) {
      this.close()
    }
  }

  _intangibleChanged () {
    this.style.pointerEvents = this.intangible ? 'none' : 'auto'
  }

  _transitionTimeChanged () {
    this.style.transition = `background-color ${this.transitionTime}ms`
    let val = `opacity ${this.transitionTime}ms, transform ${this.transitionTime}ms`
    if (this.$.dropdown != null) {
      this.$.dropdown.style.transition = val
    }
  }

  toggle () {
    this._opened ? this.close() : this.open()
  }

  open() {
    if (this._opened) return
    window.addEventListener('resize', this.#windowResized)
    this._updateAll()
    document.body.append(this)
    setTimeout(() => {
      this.style.backgroundColor = `rgba(${this.color}, ${this.opacity})`
      this.$.dropdown.classList.add('opened')
      if (!this.persistent) {
        document.addEventListener('click', this._overlayClicked)
      }
    })
  }

  close() {
    if (!this._opened) return
    if (!this.persistent) {
      document.removeEventListener('click', this._overlayClicked)
    }
    window.removeEventListener('resize', this.#windowResized)
    this.$.dropdown.classList.remove('opened')
    this.style.backgroundColor = `rgba(${this.color}, 0)`
    setTimeout(() => this.remove(), this.transitionTime)
  }

  _findLargestBox (rect) {
    const _window = document.documentElement
    const windowHeight = _window.clientHeight
    const windowWidth = _window.clientWidth

    const rightWidth = windowWidth - rect.right
    const bottomHeight = windowHeight - rect.bottom
    const invertedLeft = windowWidth - rect.x
    const invertedTop = windowHeight - rect.y

    this._largestSize = -Infinity

    if (this.dropdownStyle === 'normal') {
      const boxes = {
        top_left: getBoxInfo(
          rect.right, rect.y, {right: rightWidth, bottom: invertedTop}
        ),
        top_right: getBoxInfo(
          invertedLeft, rect.y, {left: rect.x, bottom: invertedTop}
        ),
        left_top: getBoxInfo(
          rect.x, rect.bottom, {right: invertedLeft, bottom: bottomHeight}
        ),
        left_bottom: getBoxInfo(
          rect.x, invertedTop, {right: invertedLeft, top: rect.y}
        ),
        right_top: getBoxInfo(
          rightWidth, rect.bottom, {left: rect.right, bottom: bottomHeight}
        ),
        right_bottom: getBoxInfo(
          rightWidth, invertedTop, {left: rect.right, top: rect.y}
        ),
        bottom_left: getBoxInfo(
          rect.right, bottomHeight, {right: rightWidth, top: rect.bottom}
        ),
        bottom_right: getBoxInfo(
          invertedLeft, bottomHeight, {left: rect.x, top: rect.bottom}
        ),
      }
      for (let position of this._positions) {
        if (['top', 'bottom'].includes(position)) {
          this._compareBoxes(boxes, [position + '_right', position + '_left'])
        } else {
          this._compareBoxes(boxes, [position + '_bottom', position + '_top'])
        }
      }
    } else {
      let boxes
      if (this.dropdownStyle === 'center') {
        const centerVerticalStyle = {
          transform: 'translateX(-50%)', left: rect.x + rect.width / 2
        }
        const centerHorizStyle = {
          transform: 'translateY(-50%)', top: rect.y + rect.height / 2
        }
        boxes = {
          top: getBoxInfo(
            windowWidth, rect.y, {bottom: invertedTop, ...centerVerticalStyle}
          ),
          left: getBoxInfo(
            rect.x, windowHeight, {right: invertedLeft, ...centerHorizStyle}
          ),
          right: getBoxInfo(
            rightWidth, windowHeight, {left: rect.right, ...centerHorizStyle}
          ),
          bottom: getBoxInfo(
            windowWidth, bottomHeight, {top: rect.bottom, ...centerVerticalStyle}
          ),
        }
      } else if (this.dropdownStyle === 'fit') {
        const fitVerticalStyle = {left: rect.x, width: rect.width}
        const fitHorizStyle = {top: rect.y, height: rect.height}
        boxes = {
          top: getBoxInfo(
            rect.width , rect.y, {bottom: invertedTop, ...fitVerticalStyle}
          ),
          left: getBoxInfo(
            rect.x , rect.height, {right: invertedLeft, ...fitHorizStyle}
          ),
          right: getBoxInfo(
            rightWidth , rect.height, {left: rect.right, ...fitHorizStyle}
          ),
          bottom: getBoxInfo(
            rect.width , bottomHeight, {top: rect.bottom, ...fitVerticalStyle}
          ),
        }
      } else if (this.dropdownStyle === 'corner') {
        boxes = {
          top_left: getBoxInfo(
            rect.x , rect.y, {right: invertedLeft, bottom: invertedTop}
          ),
          top_right: getBoxInfo(
            rightWidth , rect.y, {left: rect.right, bottom: invertedTop}
          ),
          bottom_left: getBoxInfo(
            rect.x , bottomHeight, {right: invertedLeft, top: rect.bottom}
          ),
          bottom_right: getBoxInfo(
            rightWidth , bottomHeight, {left: rect.right, top: rect.bottom}
          ),
        }
      }
      this._compareBoxes(boxes, this._positions)
    }
  }

  _compareBoxes (boxes, positions) {
    for (const position of positions) {
      if (! boxes.hasOwnProperty(position)) continue
      const style = boxes[position]
      if (style.maxWidth * style.maxHeight > this._largestSize) {
        this._largestSize = style.maxWidth * style.maxHeight
        this._largestBoxPosition = position
        this._largestBoxStyle = style
      }
    }
  }

  #_windowResized () {
    clearTimeout(this._windowResizedTimeoutID)
    this._windowResizedTimeoutID = setTimeout(() => this._updateAll(), 200)
  }

  _updateAll () {
    this._holder = document.querySelector(this.querySelector)
    if (this._holder === null) return

    const holderRect = this._holder.getBoundingClientRect()
    this._findLargestBox(holderRect)
    this._applyBoxStyle(this._largestBoxStyle)
    
    if (this.dropdownStyle === 'center'){
      this._adjustCenterBox(holderRect)
    }
  }
  
  _applyBoxStyle (style) {
    this.$.dropdown.style.cssText = ''
    Object.entries(style).forEach(([prop, value]) => {
      if (this._numericProps.includes(prop)) value += 'px'
      this.$.dropdown.style[prop] = value
    })
  }

  _adjustCenterBox (rect) {
    const opened = this._opened

    if (!opened) {
      this.style.visibility = 'hidden'
      document.body.append(this)
    }
    const width = this.$.dropdown.clientWidth
    const height = this.$.dropdown.clientHeight
    if (!opened) {
      this.remove()
      this.style.visibility = 'visible'
    }

    const style = Object.assign({}, this._largestBoxStyle)
    delete style.transform

    const _window = document.documentElement
    if (['bottom', 'top'].includes(this._largestBoxPosition)) {
      const midPoint = rect.x + rect.width / 2
      this._adjustCenterBoxHelper1(
        width, midPoint, _window.clientWidth, style, ['left', 'right']
      )
    } else {
      const midPoint = rect.y + rect.height / 2
      this._adjustCenterBoxHelper1(
        height, midPoint, _window.clientHeight, style, ['top', 'bottom']
      )
    }
  }

  _adjustCenterBoxHelper1 (boxSize, midPoint, windowSize, style, sides) {
    if (midPoint < windowSize / 2) {
      this._adjustCenterBoxHelper2(boxSize, midPoint, style, sides[0])
    } else {
      this._adjustCenterBoxHelper2(boxSize, windowSize - midPoint, style, sides[1])
    }
  }

  _adjustCenterBoxHelper2 (boxSize, halfSize, style, side) {
    if (boxSize/2 < halfSize) {
      this._applyBoxStyle(this._largestBoxStyle)
    } else {
      style[side] = 0
      this._applyBoxStyle(style)
    }
  }
}

customElements.define("rw-dropdown", RowiDropdown)
