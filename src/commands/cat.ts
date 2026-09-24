import fs from 'fs'
import { ProcessManager, HLJS } from '../utils'
import type { Client, Context } from '../'

export async function cat (message: Context, parent: Client): Promise<void> {
  const { bot } = parent
  if (!message.data?.args) {
    bot.helpers.sendMessage(message.channelId, { content: 'Missing Arguments.' })
    return
  }
  const filename = message.data.args
  let msg: ProcessManager
  fs.readFile(filename, async (err, data) => {
    if (err) { 
      msg = new ProcessManager(message, err.toString(), parent, { lang: 'js' }) 
    } else {
      msg = new ProcessManager(message, data.toString(), parent, {
        lang: HLJS.getLang(filename.split('.').pop())
      })
    }
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
        button: { type: 2, style: 1, customId: 'next', label: 'Next' },
        action: ({ manager }) => manager.nextPage(),
        requirePage: true
      }
    ])
  })
}
