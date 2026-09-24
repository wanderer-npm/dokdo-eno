import { cat, curl, exec, js, jsi, main } from './commands'
import * as Utils from './utils'
import * as Commands from './commands'
import type { Bot, Message, Interaction } from '@discordeno/bot'

export interface DokdoOptions {
  aliases?: string[]
  owners?: bigint[]
  prefix?: string
  secrets?: string[]
  globalVariable?: Record<string, any>
  disableAttachmentExecution?: boolean
  noPerm?(context: Message): Promise<unknown>
  isOwner?: (user: { id: bigint; username: string }) => boolean | Promise<boolean>
  token?: string
  stats?: DokdoStats | (() => DokdoStats | Promise<DokdoStats>)
}

export interface MessageData {
  raw: string
  command: string
  type: string
  args?: string
}

export interface DokdoStats {
  guilds?: number
  users?: number
}

export type Context = Message & { data?: MessageData }

class Dokdo {
  public owners: bigint[]
  public process: never[]

  public constructor (public bot: Bot, public options: DokdoOptions) {
    if (!bot || typeof bot !== 'object') { throw new TypeError('Invalid `bot`. `bot` parameter is required.') }

    if (options.noPerm && typeof options.noPerm !== 'function') { throw new Error('`noPerm` parameter must be Function.') }

    if (options.globalVariable) {
      if (typeof options.globalVariable !== 'object') { throw new Error('`globalVariable` parameter must be Object.') } else {
        Object.keys(options.globalVariable).forEach((el) => {
          // @ts-ignore
          if (options.globalVariable) global[el] = options.globalVariable[el]
        })
      }
    }

    if (options.isOwner && !options.owners) options.owners = []
    this.owners = options.owners || []

    if (!this.options.secrets || !Array.isArray(this.options.secrets)) { this.options.secrets = [] }

    if (!this.options.aliases) this.options.aliases = ['dokdo', 'dok']

    this.process = []
  }

  static async handleInteraction(bot: Bot, interaction: Interaction): Promise<boolean> {
    return Utils.ProcessManager.handleInteraction(bot, interaction)
  }

  public async run (ctx: Context, usedPrefix?: string): Promise<void> {
    if (!ctx.content) return
    const prefix = usedPrefix || this.options.prefix
    if (!prefix) return
    if (!ctx.content.toLowerCase().startsWith(prefix.toLowerCase())) return

    const trimmed = ctx.content.slice(prefix.length).trim()
    const parsed = trimmed.split(/\s+/)
    const rawCmd = (parsed[0] || '').toLowerCase()

    const directTypes = ['js', 'javascript', 'exec', 'sh', 'bash', 'zsh', 'ps', 'powershell', 'shell', 'jsi', 'javascript_inspect', 'curl', 'cat']
    const isDirect = directTypes.includes(rawCmd)

    const command = isDirect ? 'dokdo' : rawCmd
    const type = isDirect ? rawCmd : (parsed[1] || '').toLowerCase()
    const argsRaw = isDirect ? parsed.slice(1).join(' ') : parsed.slice(2).join(' ')
    const codeParsed = Utils.codeBlock.parse(argsRaw)

    ctx.data = {
      raw: ctx.content,
      command,
      type,
      args: codeParsed ? codeParsed[2] : argsRaw
    }

    if (
      !ctx.data.args &&
      (ctx.attachments?.length ?? 0) > 0 &&
      !this.options.disableAttachmentExecution
    ) {
      const file = ctx.attachments![0]
      if (file) {
        const text = await fetch(file.url).then((res) => res.text()).catch(() => '')
        const ext = file.filename.split('.').pop()

        if (
          ext &&
          ['txt', 'js', 'ts', 'sh', 'bash', 'zsh', 'ps'].includes(ext)
        ) {
          ctx.data.args = text
          if (!ctx.data.type && ext !== 'txt') ctx.data.type = ext
        }
      }
    }

    const allAliases = [...(this.options.aliases || ['dokdo', 'dok', 'jsk']), ...directTypes]
    if (!allAliases.includes(rawCmd) && !allAliases.includes(command)) {
      return
    }

    const authorId = BigInt(ctx.author.id)
    if (!this.owners.includes(authorId)) {
      let isOwner = false

      if (this.options.isOwner) {
        const user = { id: authorId, username: ctx.author.username || 'Unknown' }
        isOwner = await this.options.isOwner(user)
      }

      if (!isOwner) {
        if (this.options.noPerm) this.options.noPerm(ctx)
        return
      }
    }

    try {
      if (typeof (ctx as any).reply !== 'function') {
        (ctx as any).reply = (content: unknown) => {
          const payload: any = typeof content === 'string' ? { content } : { ...(content as Record<string, unknown>) };
          if (payload.messageReference === undefined) {
            payload.messageReference = { messageId: ctx.id, channelId: ctx.channelId };
            if (ctx.guildId !== undefined) payload.messageReference.guildId = ctx.guildId;
          }
          return this.bot.helpers.sendMessage(ctx.channelId, payload);
        };
      }
    } catch {}

    if (!ctx.data.type) return main(ctx, this)
    switch (ctx.data.type) {
      case 'sh':
      case 'bash':
      case 'ps':
      case 'powershell':
      case 'shell':
      case 'zsh':
      case 'exec':
        exec(ctx, this)
        break
      case 'js':
      case 'javascript':
        js(ctx, this)
        break
      case 'jsi':
      case 'javascript_inspect':
        jsi(ctx, this)
        break
      case 'curl':
        curl(ctx, this)
        break
      case 'cat':
        cat(ctx, this)
        break
      default:
        await this.bot.helpers.sendMessage(ctx.channelId, {
          content: `Available Options: ${Object.keys(Commands)
            .filter((t) => t !== 'main')
            .map((t) => `\`${t}\``)
            .join(', ')}`
        })
    }
  }

  public _addOwner (id: bigint): bigint[] {
    if (!this.owners.includes(id)) this.owners.push(id)
    return this.owners
  }

  public _removeOwner (id: bigint): bigint[] {
    if (this.owners.includes(id)) this.owners.splice(this.owners.indexOf(id), 1)
    return this.owners
  }
}

export { Dokdo, Dokdo as Client, Utils, Commands }
export default Dokdo

