import RowiElement from '@rowi/rowi-element'

function getBoxInfo(maxWidth, maxHeight, style) {
  style.maxWidth = maxWidth
  style.maxHeight = maxHeight
  return style
}

const rowiDropdownStyle = /*css*/`
  :host {
    display: block;
    z-index: 2147483647;
    opacity: 0;
  }

  :host(.opened) {
    opacity: 1;
  }

  .back {
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-color: var(--rw-dropdown-overlay-color, none);
  }

  .dropdown {
    background-color: var(--rw-dropdown-color, white);
    border-radius: var(--rw-dropdown-radius, 2px);
    position: absolute;
    filter: var(--rw-dropdown-filter, drop-shadow(2px 2px 4px rgba(0,0,0,0.35)));
    border: var(--rw-dropdown-border, none);
    transform: scale(0);
    overflow: auto;
  }

  .dropdown.opened {
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
  #debouncedUpdate
  #overlayClicked
  #holderLastRect = {}
  #dropdownLastRect = {}
  constructor () {
    super()

    this._opened = false
    this.#overlayClicked = this.#_overlayClicked.bind(this)
    this.#debouncedUpdate = this.#_debouncedUpdate.bind(this)

    this.$buildShadow([
      ['style', rowiDropdownStyle],
      [{name: 'back', class: 'back'}],
      [{name: 'dropdown', class: 'dropdown'},
        [{name: 'arrow', class: 'arrow'}],
        ['slot']
      ]
    ])

  }

  static get observedAttributes () { return [
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
      transitionTime: {type: 'number', default: 300},
      persistent: { type: 'boolean' },
      intangible: { type: 'boolean' },
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
      querySelector: {
        type: 'string',
        handler ({newValue}) {
          this._holder = document.querySelector(newValue)
        }
      },
    }
  }

  connectedCallback () {super.connectedCallback(); this._opened = true }
  disconnectedCallback () { this._opened = false }

  #_overlayClicked (event) {
    if (event.target === this || !this.contains(event.target)) {
      this.close()
    }
  }

  toggle () {
    this._opened ? this.close() : this.open()
  }

  open() {
    if (this._opened) return
    this.$.back.style.pointerEvents = this.intangible ? 'none' : 'auto'

    document.body.append(this)
    setTimeout(() => {
      this._updateAll()

      this.style.transition = `opacity ${this.transitionTime}ms`
      this.$.dropdown.style.transition = `transform ${this.transitionTime}ms`

      this.classList.add('opened')
      this.$.dropdown.classList.add('opened')
      if (!this.persistent) {
        document.addEventListener('click', this.#overlayClicked)
      }
      window.addEventListener('resize', this.#debouncedUpdate)
      this._holderRectCheck = setInterval(() => this.#checkHolderRectChanges(), 200)
      if (this.dropdownStyle === 'center') {
        this._dropdownRectCheck = setInterval(() => this.#checkDropdownRectChanges(), 200)
      }
    })
  }

  close() {
    if (!this._opened) return
    if (!this.persistent) {
      document.removeEventListener('click', this.#overlayClicked)
    }
    clearInterval(this._holderRectCheck)
    clearInterval(this._dropdownRectCheck)

    window.removeEventListener('resize', this.#debouncedUpdate)
    this.$.dropdown.classList.remove('opened')
    this.classList.remove('opened')
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

  #_debouncedUpdate () {
    clearTimeout(this._debouncedUpdateTimeoutID)
    this._debouncedUpdateTimeoutID = setTimeout(() => this._updateAll(), 200)
  }

  #areRectsEqual (rect1, rect2) {
    for (const prop of ['x', 'y', 'width', 'height']) {
      if (rect1[prop] != rect2[prop]) return false
    }
    return true
  }

  #checkHolderRectChanges () {
    const newHolderRect = this._holder.getBoundingClientRect()
    if (!this.#areRectsEqual(this.#holderLastRect, newHolderRect)) {
      this.#holderLastRect = newHolderRect
      this.#debouncedUpdate()
    }
  }

  #checkDropdownRectChanges () {
    const newDropdownRect = this.$.dropdown.getBoundingClientRect()
    if (!this.#areRectsEqual(this.#dropdownLastRect, newDropdownRect)) {
      this.#dropdownLastRect = newDropdownRect
      this.#debouncedUpdate()
    }
  }

  _updateAll () {
    if (this._holder === null) return

    const holderRect = this._holder.getBoundingClientRect()
    this.#holderLastRect = holderRect
    this._findLargestBox(holderRect)

    if (this.dropdownStyle === 'center'){
      this._adjustCenterBox(holderRect)
    } else {
      this._applyBoxStyle(this._largestBoxStyle)
    }

    this.#dropdownLastRect = this.$.dropdown.getBoundingClientRect()
  }

  _applyBoxStyle (style) {
    this.$.dropdown.style.cssText = ''
    Object.entries(style).forEach(([prop, value]) => {
      if (this._numericProps.includes(prop)) value += 'px'
      this.$.dropdown.style[prop] = value
    })
  }

  _adjustCenterBox (rect) {
    this.$.dropdown.style.cssText = ''
    this.$.dropdown.style.width = 'fit-content'
    this.$.dropdown.style.height = 'fit-content'
    const width = this.$.dropdown.clientWidth
    const height = this.$.dropdown.clientHeight

    const _window = document.documentElement
    if (['bottom', 'top'].includes(this._largestBoxPosition)) {
      const midPoint = rect.x + rect.width / 2
      this._adjustCenterBoxHelper1(
        width, midPoint, _window.clientWidth, ['left', 'right']
      )
    } else {
      const midPoint = rect.y + rect.height / 2
      this._adjustCenterBoxHelper1(
        height, midPoint, _window.clientHeight,  ['top', 'bottom']
      )
    }
  }

  _adjustCenterBoxHelper1 (boxSize, midPoint, windowSize, sides) {
    if (midPoint < windowSize / 2) {
      this._adjustCenterBoxHelper2(boxSize, midPoint, sides[0], sides[1])
    } else {
      this._adjustCenterBoxHelper2(boxSize, windowSize - midPoint, sides[1], sides[0])
    }
  }

  _adjustCenterBoxHelper2 (boxSize, halfSize, side1, side2) {
    if (boxSize/2 < halfSize) {
      this._applyBoxStyle(this._largestBoxStyle)
      this.$.dropdown.style.width = 'fit-content'
      this.$.dropdown.style.height = 'fit-content'
    } else {
      const style = Object.assign({}, this._largestBoxStyle)
      delete style.transform
      delete style[side2]
      style[side1] = 0
      this._applyBoxStyle(style)
    }
  }
}

customElements.define("rw-dropdown", RowiDropdown)
