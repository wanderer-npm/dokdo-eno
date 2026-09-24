import util from 'util'

export function inspect (value: unknown, options: util.InspectOptions): string {
  // @ts-ignore
  if (typeof Bun !== 'undefined' && Bun.inspect) return Bun.inspect(value)
  return util.inspect(value, options)
}
