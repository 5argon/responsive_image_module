# responsive_image_module

Deno script to batch generate a module for each set of responsive image files.

## The problem

Nowadays we can `import` an image file thanks to module bundlers by using path ending with image file extension. It maybe bundled into a hashed URL or even data URI. Resource files are now a part of web application that could be optimized efficiently.

```js
import button from '../images/button.png'
```

But what about an image that has multiple variations?

Some solutions includes modifying the `import` statement to not looks like a path to image anymore but includes resposive information, or remove image extension from the path and have bundler plugin make sense of it. This clutters the code and making hard coded string contains too many information that is not refactorable.

Some solution may use custom `<img>` that accepts just one, unoptimized image and perform code transformation to multiple variations at bundling time. This is also not ideal as bundler plugins from different authors in the chain can't work together with individual image.

But still, having "terminal" imports that uses image file extension gives maximum flexibility to multiple frameworks and plugins. After, we could combined into an object **representing** all variations available.

```js
import button_16Png from '../images/button@16w.png'
import button_64Png from '../images/button@64w.png'
import button_128Png from '../images/button@128w.png'
import button_16Webp from '../images/button@16w.webp'
import button_64Webp from '../images/button@64w.webp'
import button_128Webp from '../images/button@128w.webp'
```

This way if you ended up using only some variation of prepared, advanced bundler can tree-shake unnecessary images from being included. This module that combines multiple image imports I called a **responsive image module**.

Though this is technically sound, it is extremely laborious to write a module like this **for each image**.

## Solution

Instead of compromising TypeScript feature by side-stepping the import to be special case, we should use automated script to generate all the normal image imports for us.

The package contains a Deno script to generate 1 TypeScript module per image that has multiple variations determined by similarity of file name. The module contains explicit import of each variation that would be troublesome to do by hand.

An input to this script is a single folder which it recursively scans and generate a **sibling** folder with suffix `-modules`, and each image along with its variations is replaced with a single `.ts` file. It parses variation information **strictly from file name**.

## Usage

Required permissions are `--allow-read --allow-write --unstable`. If you use `deno install` on the `cli.ts` like this :

```
deno install --allow-read --allow-write --unstable https://deno.land/x/responsive_image_module/cli.ts
```

Then you could :

```
responsive_image_module generate [PATH TO INPUT FOLDER]
```

Currently hard coded to support : jpeg, jpg, png, webp. File name format must be `FILENAME@WIDTHDESCRIPTORw.EXTENSION`.

## Example

Input an `images` folder path with content like this :

```
images
|- inner
|  |- button.png
|  |- button@16w.png
|  |- button@16w.webp
|  |- button@64w.png
|  |- button@64w.webp
|  |- button@128w.png
|  +- button@128w.webp
|- button.png
|- button@16w.png
|- button@16w.webp
|- button@64w.png
|- button@64w.webp
|- button@128w.png
+- button@128w.webp
```

The Deno script will **regenerate** (completely delete and create an entire folder again) a **sibling** folder `images-modules` looking like this :

```
images-module
|- inner
|  +- buttonInner.ts
|- _responsive-image.ts
+- button.ts
```

`_responsive-image.ts` is a file containing TypeScript `interface` that all generated modules will use.

`button.ts` module content :

```ts
import type { ResponsiveImage, ImageVariation } from './_responsive-image'

import button_16Png_import from '../images/button@16w.png'
import button_64Png_import from '../images/button@64w.png'
import button_128Png_import from '../images/button@128w.png'
import button_16Webp_import from '../images/button@16w.webp'
import button_64Webp_import from '../images/button@64w.webp'
import button_128Webp_import from '../images/button@128w.webp'

export const button_16Png : ImageVariation = { 
    physicalPath:'images/button@16w.png', url: button_16Png_import, identifier: 'button_16Png', 
    artDirectionLabel: '', widthDescriptor: 16, pixelDensity: 1, extension: 'png'
}
export const button_64Png : ImageVariation = { 
    physicalPath:'images/button@64w.png', url: button_64Png_import, identifier: 'button_64Png', 
    artDirectionLabel: '', widthDescriptor: 64, pixelDensity: 1, extension: 'png'
}
export const button_128Png : ImageVariation = { 
    physicalPath:'images/button@128w.png', url: button_128Png_import, identifier: 'button_128Png', 
    artDirectionLabel: '', widthDescriptor: 128, pixelDensity: 1, extension: 'png'
}
export const button_16Webp : ImageVariation = { 
    physicalPath:'images/button@16w.webp', url: button_16Webp_import, identifier: 'button_16Webp', 
    artDirectionLabel: '', widthDescriptor: 16, pixelDensity: 1, extension: 'webp'
}
export const button_64Webp : ImageVariation = { 
    physicalPath:'images/button@64w.webp', url: button_64Webp_import, identifier: 'button_64Webp', 
    artDirectionLabel: '', widthDescriptor: 64, pixelDensity: 1, extension: 'webp'
}
export const button_128Webp : ImageVariation = { 
    physicalPath:'images/button@128w.webp', url: button_128Webp_import, identifier: 'button_128Webp', 
    artDirectionLabel: '', widthDescriptor: 128, pixelDensity: 1, extension: 'webp'
}

export const button : ResponsiveImage = [
  button_16Png,
  button_64Png,
  button_128Png,
  button_16Webp,
  button_64Webp,
  button_128Webp
]

export default button
```

`buttonInner.ts` module content (notice how relative path gets deeper as well) :

```ts
import type { ResponsiveImage, ImageVariation } from '../_responsive-image'

import innerButton_16Png_import from '../../images/inner/button@16w.png'
import innerButton_64Png_import from '../../images/inner/button@64w.png'
import innerButton_128Png_import from '../../images/inner/button@128w.png'
import innerButton_16Webp_import from '../../images/inner/button@16w.webp'
import innerButton_64Webp_import from '../../images/inner/button@64w.webp'
import innerButton_128Webp_import from '../../images/inner/button@128w.webp'

export const innerButton_16Png : ImageVariation = { 
    physicalPath:'images/inner/button@16w.png', url: innerButton_16Png_import, identifier: 'innerButton_16Png', 
    artDirectionLabel: '', widthDescriptor: 16, pixelDensity: 1, extension: 'png'
}
export const innerButton_64Png : ImageVariation = { 
    physicalPath:'images/inner/button@64w.png', url: innerButton_64Png_import, identifier: 'innerButton_64Png', 
    artDirectionLabel: '', widthDescriptor: 64, pixelDensity: 1, extension: 'png'
}
export const innerButton_128Png : ImageVariation = { 
    physicalPath:'images/inner/button@128w.png', url: innerButton_128Png_import, identifier: 'innerButton_128Png', 
    artDirectionLabel: '', widthDescriptor: 128, pixelDensity: 1, extension: 'png'
}
export const innerButton_16Webp : ImageVariation = { 
    physicalPath:'images/inner/button@16w.webp', url: innerButton_16Webp_import, identifier: 'innerButton_16Webp', 
    artDirectionLabel: '', widthDescriptor: 16, pixelDensity: 1, extension: 'webp'
}
export const innerButton_64Webp : ImageVariation = { 
    physicalPath:'images/inner/button@64w.webp', url: innerButton_64Webp_import, identifier: 'innerButton_64Webp', 
    artDirectionLabel: '', widthDescriptor: 64, pixelDensity: 1, extension: 'webp'
}
export const innerButton_128Webp : ImageVariation = { 
    physicalPath:'images/inner/button@128w.webp', url: innerButton_128Webp_import, identifier: 'innerButton_128Webp', 
    artDirectionLabel: '', widthDescriptor: 128, pixelDensity: 1, extension: 'webp'
}

export const innerButton : ResponsiveImage = [
  innerButton_16Png,
  innerButton_64Png,
  innerButton_128Png,
  innerButton_16Webp,
  innerButton_64Webp,
  innerButton_128Webp
]

export default innerButton
```

It provide a `default` export and one named export (named after folder traveling to the image, then the image's name) to represent all the variations as an array. Also you can use other named export representing each variation as well. They are named by appending variation differences to the base name.
