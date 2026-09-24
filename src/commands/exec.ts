import child from 'child_process'
import type { Client, Context } from '../'
import { ProcessManager, codeBlock } from '../utils'

export async function exec (message: Context, parent: Client): Promise<void> {
  const { bot } = parent
  let closed = false
  if (!message.data?.args) {
    bot.helpers.sendMessage(message.channelId, { content: 'Missing Arguments.' })
    return
  }

  const shell =
    process.env.SHELL || (process.platform === 'win32' ? 'powershell' : null)
  if (!shell) {
    bot.helpers.sendMessage(message.channelId, {
      content: 'Sorry, we are not able to find your default shell.\nPlease set `process.env.SHELL`.'
    })
    return
  }

  const msg = new ProcessManager(message, `$ ${message.data.args}\n`, parent, {
    lang: 'bash'
  })
  await msg.init()

  const res = child.spawn(shell, [
    '-c',
    (shell === 'win32' ? 'chcp 65001\n' : '') + message.data.args
  ])
  const timeout = setTimeout(() => {
    kill(res, 'SIGTERM')
    bot.helpers.sendMessage(message.channelId, { content: 'Shell timeout occured.' })
  }, 180000)

  await msg.addAction(
    [
      {
        button: { type: 2, style: 4, customId: 'prev', label: 'Prev' },
        action: ({ manager }) => manager.previousPage(),
        requirePage: true
      },
      {
        button: { type: 2, style: 2, customId: 'stop', label: 'Stop' },
        action: async ({ res, manager }) => {
          if (!closed) {
            res.stdin.pause()
            kill(res)
            msg.add('^C')
            if (msg.page < 2) manager.destroy()
          } else manager.destroy()
        },
        requirePage: false
      },
      {
        button: { type: 2, style: 3, customId: 'next', label: 'Next' },
        action: ({ manager }) => manager.nextPage(),
        requirePage: true
      }
    ],
    { res }
  )

  res.stdout.on('data', (data) => {
    msg.add(data.toString())
  })

  res.stderr.on('data', (data) => {
    msg.add(`[stderr] ${data.toString()}`)
  })

  res.on('error', (err) => {
    bot.helpers.sendMessage(message.channelId, {
      content: `Error occurred while spawning process\n${codeBlock.construct(
        err.toString(),
        'sh'
      )}`
    })
  })
  res.on('close', (code) => {
    clearTimeout(timeout)
    msg.add(`\n[status] process exited with code ${code}`)
    closed = true
  })
}

function kill (res: child.ChildProcessWithoutNullStreams, signal?: NodeJS.Signals) {
  if (process.platform === 'win32') {
    return child.exec(
      `powershell -File "..\\utils\\KillChildrenProcess.ps1" ${res.pid}`,
      { cwd: __dirname }
    )
  } else return res.kill(signal || 'SIGINT')
}
