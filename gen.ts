import * as p from 'https://deno.land/std@0.87.0/path/mod.ts'
import { ensureDir } from 'https://deno.land/std@0.87.0/fs/mod.ts'

import { ImageVariation } from './interface.ts'

/**
 * @param inputFolder This is recursively processed.
 * @param outputFolder This folder will be cleared out completely on each generation.
 * Mirrors input folder but a module replaces each image.
 * @param suffixBefore It does not read image to determine width but trust the filename completely.
 * Width number must be in the file name after the original's file name. If the format is `example@512px.png` where
 * original file is `example.png`, "suffix before" is `@`.
 * @param suffixAfter It does not read image to determine width but trust the filename completely.
 * Width number must be in the file name after the original's file name. If the format is `example@512px.png` where
 * original file is `example.png`, "suffix after" is `px`.
 * @param extensions Extensions of the original file to process.
 */
export async function generate(
  inputFolder: string,
  suffixBefore: string,
  suffixAfter: string,
  extensions: string[],
  typeImportSource: string,
  relativeImport: boolean
) {
  const extensionCheck: { [k: string]: boolean } = {}
  for (const e in extensions) {
    extensionCheck[e] = true
  }
  const regex = new RegExp(
    `${inputFolder}(.*)${suffixBefore}([0-9]+)${suffixAfter}\.(.*)`
  )

  interface Collection {
    modulePhysicalPath: string
    moduleProgramSafeName: string
    variations: ImageVariation[]
  }

  const collection: {
    [k: string]: Collection
  } = {}
  const getFiles = async (path: string) => {
    for await (const dirEntry of Deno.readDir(path)) {
      if (dirEntry.isDirectory) {
        await getFiles(p.join(path, dirEntry.name))
      } else if (dirEntry.isFile) {
        const joined = p.join(path, dirEntry.name)
        const matchArray = joined.match(regex)
        if (
          matchArray !== null &&
          matchArray.length === 4 &&
          matchArray[3] in extensionCheck
        ) {
          const modulePhysicalPath = `${matchArray[1]}`
          const physicalPath = matchArray[1]
          const makeProgramSafeName = (input: string) =>
            input
              .replaceAll('/', '_')
              .replaceAll(suffixBefore, '_')
              .replaceAll(suffixAfter, '_')
          const programSafeName = makeProgramSafeName(physicalPath)
          const variation: ImageVariation = {
            physicalPath: physicalPath,
            identifier: `${programSafeName}`,
            url: matchArray[0],
            extension: matchArray[3],
            pixelDensity: 1, // TODO
            widthDescriptor: parseInt(matchArray[2]),
          }
          if (modulePhysicalPath in collection === false) {
            collection[modulePhysicalPath] = {
              modulePhysicalPath: modulePhysicalPath,
              moduleProgramSafeName: makeProgramSafeName(modulePhysicalPath),
              variations: [],
            }
          }
          collection[modulePhysicalPath].variations.push(variation)
        }
      }
    }
  }
  const outputFolder = inputFolder + '-modules'
  const getFilePromise = getFiles(inputFolder)
  const removePromise = Deno.remove(outputFolder, { recursive: true })
  await Promise.all([getFilePromise, removePromise])
  await ensureDir(outputFolder)
  const enc = new TextEncoder()

  async function doit(c: Collection): Promise<void> {
    const content = fileContent(
      c.modulePhysicalPath,
      c.moduleProgramSafeName,
      c.variations,
      typeImportSource,
      relativeImport
    )
    const encoded = enc.encode(content)
    const outputPath = outputFolder + c.modulePhysicalPath
    await ensureDir(outputPath)
    await Deno.writeFile(outputPath, encoded)
    console.log('Written : ' + outputPath)
  }
  await Promise.all(Object.values(collection).map((x) => doit(x)))
}

function fileContent(
  physicalPath: string,
  programSafeName: string,
  ivs: ImageVariation[],
  typeImportSource: string,
  relativeImport: boolean
): string {
  const depth = physicalPath.split('/').length - 1
  const stepBacks = new Array(depth).fill('../').join('')
  const typeImport = `import type { ResponsiveImage } from ${
    relativeImport ? stepBacks : ''
  }${typeImportSource}`
  const imports = ivs
    .map<string>((x) => {
      return `import ${x.identifier} from '../${x.url}'`
    })
    .join('\n')
  const objExports = ivs.map<string>((x) => {
    return `{ identifier: '${x.identifier}', url: ${x.identifier}, widthDescriptor: ${x.widthDescriptor}, pixelDensity: ${x.pixelDensity}, extension: '${x.extension}'}`
  })
  const objExportsWrapped = `const ${programSafeName} : ResponsiveImage = [
  [
    ${objExports.join(',')}
  ]
]
export default ${programSafeName}`
  return `${typeImport}
${imports}
${objExportsWrapped}`
}
