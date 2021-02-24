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
|  |- buttonInner.png
|  |- buttonInner@16w.png
|  |- buttonInner@16w.webp
|  |- buttonInner@64w.png
|  |- buttonInner@64w.webp
|  |- buttonInner@128w.png
|  +- buttonInner@128w.webp
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
import type { ResponsiveImage } from './_responsive-image'

import button_16Png from '../images/button@16w.png'
import button_64Png from '../images/button@64w.png'
import button_128Png from '../images/button@128w.png'
import button_16Webp from '../images/button@16w.webp'
import button_64Webp from '../images/button@64w.webp'
import button_128Webp from '../images/button@128w.webp'

const button: ResponsiveImage = [
  {
    physicalPath: 'images/button@16w.png',
    url: button_16Png,
    identifier: 'button_16Png',
    artDirectionLabel: '',
    widthDescriptor: 16,
    pixelDensity: 1,
    extension: 'png',
  },
  {
    physicalPath: 'images/button@64w.png',
    url: button_64Png,
    identifier: 'button_64Png',
    artDirectionLabel: '',
    widthDescriptor: 64,
    pixelDensity: 1,
    extension: 'png',
  },
  {
    physicalPath: 'images/button@128w.png',
    url: button_128Png,
    identifier: 'button_128Png',
    artDirectionLabel: '',
    widthDescriptor: 128,
    pixelDensity: 1,
    extension: 'png',
  },
  {
    physicalPath: 'images/button@16w.webp',
    url: button_16Webp,
    identifier: 'button_16Webp',
    artDirectionLabel: '',
    widthDescriptor: 16,
    pixelDensity: 1,
    extension: 'webp',
  },
  {
    physicalPath: 'images/button@64w.webp',
    url: button_64Webp,
    identifier: 'button_64Webp',
    artDirectionLabel: '',
    widthDescriptor: 64,
    pixelDensity: 1,
    extension: 'webp',
  },
  {
    physicalPath: 'images/button@128w.webp',
    url: button_128Webp,
    identifier: 'button_128Webp',
    artDirectionLabel: '',
    widthDescriptor: 128,
    pixelDensity: 1,
    extension: 'webp',
  },
]

export default button
```

`buttonInner.ts` module content (notice how relative path gets deeper as well) :

```ts
import type { ResponsiveImage } from '../_responsive-image'

import innerButtonInner_16Png from '../../images/inner/buttonInner@16w.png'
import innerButtonInner_64Png from '../../images/inner/buttonInner@64w.png'
import innerButtonInner_128Png from '../../images/inner/buttonInner@128w.png'
import innerButtonInner_16Webp from '../../images/inner/buttonInner@16w.webp'
import innerButtonInner_64Webp from '../../images/inner/buttonInner@64w.webp'
import innerButtonInner_128Webp from '../../images/inner/buttonInner@128w.webp'

const innerButtonInner: ResponsiveImage = [
  {
    physicalPath: 'images/inner/buttonInner@16w.png',
    url: innerButtonInner_16Png,
    identifier: 'innerButtonInner_16Png',
    artDirectionLabel: '',
    widthDescriptor: 16,
    pixelDensity: 1,
    extension: 'png',
  },
  {
    physicalPath: 'images/inner/buttonInner@64w.png',
    url: innerButtonInner_64Png,
    identifier: 'innerButtonInner_64Png',
    artDirectionLabel: '',
    widthDescriptor: 64,
    pixelDensity: 1,
    extension: 'png',
  },
  {
    physicalPath: 'images/inner/buttonInner@128w.png',
    url: innerButtonInner_128Png,
    identifier: 'innerButtonInner_128Png',
    artDirectionLabel: '',
    widthDescriptor: 128,
    pixelDensity: 1,
    extension: 'png',
  },
  {
    physicalPath: 'images/inner/buttonInner@16w.webp',
    url: innerButtonInner_16Webp,
    identifier: 'innerButtonInner_16Webp',
    artDirectionLabel: '',
    widthDescriptor: 16,
    pixelDensity: 1,
    extension: 'webp',
  },
  {
    physicalPath: 'images/inner/buttonInner@64w.webp',
    url: innerButtonInner_64Webp,
    identifier: 'innerButtonInner_64Webp',
    artDirectionLabel: '',
    widthDescriptor: 64,
    pixelDensity: 1,
    extension: 'webp',
  },
  {
    physicalPath: 'images/inner/buttonInner@128w.webp',
    url: innerButtonInner_128Webp,
    identifier: 'innerButtonInner_128Webp',
    artDirectionLabel: '',
    widthDescriptor: 128,
    pixelDensity: 1,
    extension: 'webp',
  },
]

export default innerButtonInner
```

Then you can use the `default` export of each responsive image and use any individual image in the array. Though the module contains all variations, sufficiently advanced tree-shaking will only bundle the image that you accessed on `url` key since that links to the real imported image.
