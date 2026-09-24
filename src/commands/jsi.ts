import type { Client, Context } from '../'
import { ProcessManager as _ProcessManager, count as _count, inspect as _inspect, table as _table, typeFind as _typeFind } from '../utils'

export async function jsi (message: Context, _dokdo: Client): Promise<void> {
  const { bot } = _dokdo
  if (!message.data?.args) {
    bot.helpers.sendMessage(message.channelId, { content: 'Missing Arguments.' })
    return
  }

  // eslint-disable-next-line no-eval
  const res = new Promise((resolve) => resolve(eval(message.data!.args ?? '')))
  let msg!: _ProcessManager
  await res
    .then((output: any) => {
      const typeofTheRes = _typeFind(output)
      const overview = _inspect(output, { depth: -1 })
      const constructorName =
        output && output.constructor
          ? Object.getPrototypeOf(output.constructor).name
          : null
      const arrCount = _count(output)
      msg = new _ProcessManager(
        message,
        `=== ${overview.slice(0, 100)}${
          overview.length > 100 ? '...' : ''
        } ===\n\n${_table({
          Type: `${typeof output}(${typeofTheRes})`,
          Name: constructorName || null,
          Length: typeof output === 'string' && output.length,
          Size: output instanceof Map || output instanceof Set ? output.size : null,
          'Content Types': arrCount
            ? arrCount.map((el: any) => `${el.name} (${el.ratio}％)`).join(', ')
            : null
        })}`,
        _dokdo,
        { lang: 'prolog' }
      )
    })
    .catch((e: any) => {
      msg = new _ProcessManager(message, e.stack, _dokdo, { lang: 'js' })
    })

  await msg.init()
  await msg.addAction([
    {
      button: { type: 2, style: 4, customId: 'prev', label: 'Prev' },
      action: ({ manager }) => manager.previousPage(),
      requirePage: true
    },
    {
      button: { type: 2, style: 2, customId: 'stop', label: 'Stop' },
      action: ({ manager }) => manager.destroy(),
      requirePage: true
    },
    {
      button: { type: 2, style: 3, customId: 'next', label: 'Next' },
      action: ({ manager }) => manager.nextPage(),
      requirePage: true
    }
  ])
}
