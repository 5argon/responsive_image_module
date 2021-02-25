import { join, dirname, relative, isAbsolute } from './deps.ts'
import { ensureDir } from './deps.ts'
import { camelCase } from './deps.ts'
import { ImageVariation } from './interface.ts'
import { interfaceCopy } from './interface_copy.ts'

const interfaceFileName = '_responsive-image'

/**
 * @param inputFolder This is recursively processed.
 * @param outputFolder This folder will be cleared out completely on each generation.
 * @param extensions Extensions of the original file to process.
 * Mirrors input folder but inputFolderResolved module replaces each image.
 * @param artDirectionPattern Regex pattern that will be placed after the file name. Must contain 1 group. Captures art direction label string.
 * @param widthDescriptorPattern Regex pattern that will be placed after the art direction pattern. Must contain 1 group. Captures width descriptor number, therefore recommended to use `[0-9]+` in the group parentheses.
 * @param pixelDensityPattern Regex pattern that will be placed after the width descriptor pattern. Must contain 1 group. Captures pixel density number, therefore recommended to use `[0-9]+` in the group parentheses.
 */
export async function generate(
  inputFolder: string,
  extensions: string[],
  artDirectionPattern: string,
  widthDescriptorPattern: string,
  pixelDensityPattern: string
) {
  const extensionCheck: { [k: string]: boolean } = {}
  for (const e of extensions) {
    extensionCheck[e] = true
  }
  const inputFolderResolved: string = relative('.', inputFolder)
  const regex = new RegExp(
    `${inputFolderResolved}(.*)${artDirectionPattern}${widthDescriptorPattern}${pixelDensityPattern}\.(.*)`
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
        await getFiles(join(path, dirEntry.name))
      } else if (dirEntry.isFile) {
        const joined = join(path, dirEntry.name)
        const matchArray = joined.match(regex)
        if (
          matchArray !== null &&
          matchArray.length === 4 &&
          matchArray[3] in extensionCheck
        ) {
          const modulePhysicalPath = `${matchArray[1]}`
          const physicalPath = matchArray[1]

          function prefixEscape(input: string): string {
            if (input.length === 0) {
              return '_'
            }
            let c = input[0]
            let inputMu: string = input
            if (c === '/') {
              inputMu = input.slice(1)
            }
            c = inputMu[0]
            if (c >= '0' && c <= '9') {
              const escaped = '_' + inputMu
              return escaped
            }
            return inputMu
          }

          function makeProgramSafeName(input: string): string {
            return prefixEscape(
              camelCase(input.replaceAll('/', '_').replaceAll('-', '_'))
            )
          }

          // TODO : Add pixel density and art direction to the identifier.
          const programSafeIdentifier = makeProgramSafeName(
            `${physicalPath}_${matchArray[2]}_${matchArray[3]}`
          )

          const variation: ImageVariation = {
            physicalPath: `${joined}`,
            identifier: `${programSafeIdentifier}`,
            url: matchArray[0],
            extension: matchArray[3],
            pixelDensity: 1, // TODO
            artDirectionLabel: '', // TODO
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
  const outputFolder = inputFolderResolved + '-modules'
  await ensureDir(outputFolder)
  const getFilePromise = getFiles(inputFolderResolved)
  const removePromise = Deno.remove(outputFolder, { recursive: true })
  await Promise.all([getFilePromise, removePromise])
  await ensureDir(outputFolder)
  const enc = new TextEncoder()

  // A copy of interface that all image modules will import.
  const interfaceLocation = outputFolder + '/' + interfaceFileName
  Deno.writeFileSync(interfaceLocation + '.ts', enc.encode(interfaceCopy))

  async function doit(c: Collection): Promise<void> {
    const outputPath = outputFolder + c.modulePhysicalPath
    await ensureDir(dirname(outputPath))
    const newFileLocation = `${outputPath}.ts`

    const content = fileContent(
      newFileLocation,
      c.moduleProgramSafeName,
      c.variations,
      interfaceLocation
    )
    const encoded = enc.encode(content)
    await Deno.writeFile(newFileLocation, encoded)
    console.log('Written : ' + newFileLocation)
  }
  await Promise.all(Object.values(collection).map((x) => doit(x)))
}

function fileContent(
  moduleFilePath: string,
  moduleExportName: string,
  ivs: ImageVariation[],
  interfaceLocation: string
): string {
  const toInterface = relative(dirname(moduleFilePath), interfaceLocation)
  // `relative` produce "absolute" path in JS module sense if the location is the same,
  // and would be magically interpreted to be node_modules. We need to add back the relativeness with ./
  const typeImport = `import type { ResponsiveImage, ImageVariation } from '${
    toInterface.startsWith('../') ? toInterface : `./${toInterface}`
  }'`
  ivs.sort((a, b) => {
    if (a.extension !== b.extension) {
      if (a.extension < b.extension) return -1
      if (a.extension > b.extension) return 1
    }
    if (a.widthDescriptor !== b.widthDescriptor) {
      return a.widthDescriptor - b.widthDescriptor
    }
    if (a.pixelDensity !== b.pixelDensity) {
      return a.pixelDensity - b.pixelDensity
    }
    if (a.artDirectionLabel !== b.artDirectionLabel) {
      if (a.artDirectionLabel < b.artDirectionLabel) return -1
      if (a.artDirectionLabel > b.artDirectionLabel) return 1
    }
    return 0
  })
  const imports = ivs
    .map<string>((x) => {
      return `import ${x.identifier}_import from '${relative(
        dirname(moduleFilePath),
        x.physicalPath
      )}'`
    })
    .join('\n')

  const objExports = ivs
    .map<string>((x) => {
      return `export const ${x.identifier} : ImageVariation = { 
    physicalPath:'${x.physicalPath}', url: ${x.identifier}_import, identifier: '${x.identifier}', 
    artDirectionLabel: '${x.artDirectionLabel}', widthDescriptor: ${x.widthDescriptor}, pixelDensity: ${x.pixelDensity}, extension: '${x.extension}'
}`
    })
    .join('\n')

  const objExportsWrapped = `export const ${moduleExportName} : ResponsiveImage = [
${ivs
  .map<string>((x) => {
    return `  ${x.identifier}`
  })
  .join(',\n')}
]

export default ${moduleExportName}`
  return `${typeImport}

${imports}

${objExports}

${objExportsWrapped}`
}
