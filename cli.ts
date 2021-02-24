import { parseFlags } from './deps.ts'
import type { FlagsArgs } from './deps.ts'
import { generate } from './gen.ts'
if (import.meta.main) {
  const flags: FlagsArgs = parseFlags(Deno.args)
  const args: (string | number)[] = flags._
  if (args.length < 2 || args[0] !== 'generate') {
    throw new Error(
      'Must specify "generate" command and exactly one input folder.'
    )
  }
  let input = args[1]
  if (typeof input !== 'string') {
    throw new Error('Input folder must be string.')
  }
  if (input[input.length - 1] === '/') {
    input = input.slice(0, input.length - 1)
  }
  // TODO: Not hard-code these and allow using command line to specify.
  await generate(input, ['png', 'jpg', 'jpeg', 'webp'], '', '@([0-9]+)w', '')
  console.log('Completed generating image modules.')
}
