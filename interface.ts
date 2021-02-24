/**
 * "One" responsive image consists of multiple variations which are different files.
 */
export type ResponsiveImage = ImageVariation[]

export interface ImageVariation {
  /**
   * Path where you generated this module in your machine, starting at and including an input folder.
   */
  physicalPath: string

  /**
   * Program safe variable name for this variation.
   * `example@512px.png` will be named `example_512_png`.
   */
  identifier: string

  /**
   * Path to the image. This is after module bundler processed it.
   */
  url: string

  /**
   * Enables browser to know width of the image without fetching the file.
   */
  widthDescriptor: number

  /**
   * Intended density that this image should be used.
   * e.g. `2` means image will be doubly smaller but denser.
   * TODO: Not used currently, always 1.
   */
  pixelDensity: number

  /**
   * Can be used to filter out desired extension.
   */
  extension: string
}
