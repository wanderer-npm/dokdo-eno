import { ProcessManager, HLJS } from '../utils'
import type { Client, Context } from '../'

export async function curl (message: Context, parent: Client): Promise<void> {
  const { bot } = parent
  if (!message.data?.args) {
    bot.helpers.sendMessage(message.channelId, { content: 'Missing Arguments.' })
    return
  }

  let type
  let res
  try {
    const response = await fetch(message.data.args.split(' ')[0] as string)
    const text = await response.text()
    try {
      type = 'json'
      res = JSON.stringify(JSON.parse(text), null, 2)
    } catch {
      type = HLJS.getLang(response.headers.get('content-type')?.split(';')[0]) || 'html'
      res = text
    }
  } catch (e: any) {
    type = 'js'
    // eno sadly doesn't have a simple react wrapper on message 
    bot.helpers.addReaction(message.channelId, message.id, '❗').catch(() => null)
    res = e.toString()
  }

  const msg = new ProcessManager(message, res || '', parent, { lang: type })
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
