import { parseFlags } from './deps.ts'
import type { FlagsArgs } from './deps.ts'
import { generate } from './gen.ts'
if (import.meta.main) {
  const flags: FlagsArgs = parseFlags(Deno.args)
  const args: (string | number)[] = flags._
  if (args.length !== 2) {
    throw new Error(
      'Must specify exactly one input folder, and one output folder.'
    )
  }
  const input = args[0]
  const output = args[1]
  if (typeof input !== 'string' || typeof output !== 'string') {
    throw new Error('Input and output folder must be string.')
  }
  generate(input, '@', 'w', ['png', 'jpg', 'webp'], 'interface.ts', true)
  console.log('Completed.')
}
