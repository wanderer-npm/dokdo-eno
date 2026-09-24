import type { Client, Context } from '../'
import { ProcessManager as _ProcessManager, inspect as _inspect, isInstance as _isInstance, isGenerator as _isGenerator } from '../utils'

export async function js (message: Context, _dokdo: Client): Promise<void> {
  const { bot } = _dokdo
  if (!message.data?.args) {
    bot.helpers.sendMessage(message.channelId, { content: 'Missing Arguments.' })
    return
  }

  const args = message.data.args
  
  // Try as an expression first, otherwise wrap it in an async IIFE
  const code = args.includes('return') || args.includes('await') || args.includes(';')
    ? `(async () => { ${args} })()`
    : `(async () => { return ${args} })()`
  
  const res = new Promise((resolve) =>
    resolve(
      // eslint-disable-next-line no-eval
      eval(code)
    )
  )
  
  let typeOf
  const result = await res
    .then(async (output: any) => {
      typeOf = typeof output

      if (_isGenerator(output)) {
        for (const value of output) {
          if (typeof value === 'function') {
            await bot.helpers.sendMessage(message.channelId, { content: value.toString() })
          } else if (typeof value === 'string') {
            await bot.helpers.sendMessage(message.channelId, { content: value })
          } else {
            await bot.helpers.sendMessage(message.channelId, {
              content: _inspect(value, { depth: 1, maxArrayLength: 200 })
            })
          }
        }
      }

      if (typeof output === 'function') {
        typeOf = 'object'
        return output.toString()
      } else if (typeof output === 'string') {
        return output
      }
      return _inspect(output, { depth: 1, maxArrayLength: 200 })
    })
    .catch((e) => {
      typeOf = 'object'
      return e.toString()
    })

  const msg = new _ProcessManager(message, result || '', _dokdo, {
    lang: 'js',
    noCode: typeOf !== 'object'
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
