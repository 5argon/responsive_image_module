export const interfaceCopy = `
/**
 * "One" responsive image consists of multiple variations which are different files.
 */
export type ResponsiveImage = ImageVariation[]

export interface ImageVariation {
  /**
   * Path where you generated this module in your machine, starting at and including an input folder name.
   */
  physicalPath: string

  /**
   * (Probably) Program-safe name for this variation.
   */
  identifier: string

  /**
   * Effective URL of an image. This is after module bundler processed it.
   * Therefore if the bundler make it into data URI, this is the data instead.
   */
  url: string

  /**
   * Intended purpose of the image.
   * [Read more about art direction here](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images).
   */
  artDirectionLabel: string

  /**
   * Enables browser to know the width of an image without fetching the file.
   */
  widthDescriptor: number

  /**
   * Intended density that this image should be used.
   * e.g. 2 means image will be doubly smaller but denser.
   * TODO: Not used currently, always 1.
   */
  pixelDensity: number

  /**
   * Can be used to filter out desired extension.
   */
  extension: string
}
`
