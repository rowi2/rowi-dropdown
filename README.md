# rowi-overlay

A dropdown web component.

# Properties

## `transitionTime`
- Description: The time in ms it takes to open and close the dropdown.
- Type: `number`
- Default: `300`
- Attribute: `data-transition`
- Event: `$transition`

## `persistent`
- Description: Whether clicking outside the dropdwon will close it (if false) or not.
- Type: `boolean`
- Default: `false`
- Attribute: `data-persistent`
- Event: `$persistent`

## `intangible`
- Description: Whether the contents in the background of the dropdown can be accessed while using the dropdown (if true) or not.
- Type: `boolean`
- Default: `false`
- Attribute: `data-intangible`
- Event: `$intangible`

## `dropdownStyle`
- Description: This controls how the dropdown is displayed. See Choices for more information.
- Type: `string`
- Choices:
    - `normal`: With this option, the default areas (top, right, bottom, left) are divided in 2, namely top-left, top-right, right-top, right-bottom, bottom-left, bottom-right, left-top and left-bottom. The top-left area goes from viewport's top-left corner to holder's top-right corner. The top-right from viewport's top-right to holder's top-left.The right-top from viewport's top-right to holder's bottom-right. The right-bottom from viewport's bottom-right to holder's top-right. The bottom-left from viewport's bottom-left to holder's bottom-right. The bottom-right from viewport's bottom-right to holder's bottom-left. The left-top from viewport's top-left to holder's bottom-left. The left-bottom from viewport's bottom-left to holder's top-left.
    - `center`: With this option the dropdown will be centralized with reference to the holder element. For the top and bottom areas the width is the viewport's width, and for the left and right ares the height is the viewport's height. The top area's height goes from the viewport's top and the holder's top, the bottom area's height goes from the viewport's bottom to the holder's bottom, the left area's width goes from the viewport's left and the holder's left, the right area's width goes from the viewport's right to the holder's right.
    - `fit`: The top and bottom area's height are the same as `center` style, and the left and right area's width are the same as `center` style. The top and bottom area's width is the holder's width, and the left and right area's height is the holder's height.
    - `corner`: The top-left area goes from viewport's top-left corner to holder's top-left corner. The top-right from viewport's top-right to holder's top-right. The bottom-left from viewport's bottom-left to holder's bottom-left. The bottom-right from viewport's bottom-right to holder's bottom-right.
- Default: `normal`
- Attribute: `data-dropdown-style`
- Event: `$dropdownStyle`

## `dropdownPosition`
- Description: The allowed positions (areas) around the holder element where the dropdown can be displayed. The bigger area around the holder will be chosen.
- Type: `string`
- Choices:
    - `all` to include all the positions.
    - Any space-separated list a combination of the following: `top`, `bottom`, `left`, `right`, `top_left`, `top_right`, `bottom_left`, `bottom_right`.
- Default: `all`
- Attribute: `data-dropdown-position`
- Event: `$dropdownPosition`

## `querySelector`
- Type: `string`
- Default: null
- Description: The query selector of the holder element.
- Attribute: `data-query-selector`.
- Event: `$querySelector`.

# CSS properties

- `--rw-dropdown-overlay-color`: The background color of the dropdown's overlay. Defaults to `none`.
- `--rw-dropdown-color`: The background color of the dropdown. Defaults to `white`.
- `--rw-dropdown-radius`: The border radius of the dropdown corners. Defaults to `2px`.
- `--rw-dropdown-filter`: The filter to apply to the dropdown. Defaults to `drop-shadow(0px 1px 5px #0005)`.
- `--rw-dropdown-arrow-width`: Half the width of the arrow. Defaults to 0.
- `--rw-dropdown-arrow-height`: The height of the arrow. Defaults to 0.

# Methods
- `open()`: To open the dropdown.
- `close()`: To close the dropdown.
- `toggle()`: To toggle the dropdown.