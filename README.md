# rowi-overlay

A dropdown web component.

## Properties

- `opened`
    - type: `boolean`
    - default: `false`.
    - Description: Property to open or close the overlay.
    - Attribute: `data-open`.
    - Event: `$opened`.

- `opacity`
    - type: `number`
    - default: `0`.
    - Description: The opacity of the overlay background.
    - Attribute: `data-opacity`.
    - Event: `$opacity`.

- `color`
    - type: `string`
    - default: `0,0,0`.
    - Description: The color of the overlay background. It's a comma-separated string with numbers between 0 and 255 for red, green and blue colors.
    - Attribute: `data-color`.
    - Event: `$color`.

- `transition`
    - type: `number`
    - default: `300`.
    - Description: The time in ms it takes to open and close the overlay.
    - Attribute: `data-transition`.
    - Event: `$transition`.

- `persistent`
    - type: `boolean`
    - default: `false`.
    - Description:  Whether the overlay can be closed (if false) or not.
    - Attribute: `data-persistent`.
    - Event: `$persistent`.

- `intangible`
    - type: `boolean`
    - default: `false`.
    - Description:  Whether the overlay can be clicked through (if true) or not.
    - Attribute: `data-intangible`.
    - Event: `$intangible`.