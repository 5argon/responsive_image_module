# responsive_image_module_generator

Nowadays we can `import` an image file thanks to module bundlers. But what about an image that has multiple variations? To make it compatible with bundler script that works on each image individually, ideally we need to import each variation separately then combined into an object representing all variations available. This way if you ended up using only some variation of prepared, advanced bundler like Rollup can even tree shake unnecessary images from being included.

This is a Deno script to generate 1 module per image that has multiple variations, which inside that module contains explicit import of each variation that would be troublesome to do by hand. It parses variation information **strictly from file name**.
