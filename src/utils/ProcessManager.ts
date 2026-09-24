import { codeBlock, regexpEscape } from '.'
import type { Client } from '../'
import type { Message, Bot, Interaction } from '@discordeno/bot'

export interface ProcessOptions {
  limit?: number
  noCode?: boolean
  secrets?: string[]
  lang?: string
}

export interface ActionOptions {
  manager: ProcessManager
  [x: string]: any
}

export interface Action {
  button: {
    type: 2
    style: number
    customId: string
    label?: string
    emoji?: { name?: string; id?: bigint }
  }
  requirePage: boolean
  action(options: ActionOptions): Promise<any> | any
}

export class ProcessManager {
  public static sessions = new Map<string, ProcessManager>()
  
  public target: bigint
  public messageContent: string
  public limit: number
  public splitted: string[]
  public page: number
  public authorId: bigint
  public actions: Action[]
  public wait: number
  public message?: Message
  public args: any
  public sessionId: string

  private timer: NodeJS.Timeout | null = null
  private readonly rateLimitInterval = 5000
  private lastUpdate: number = 0

  constructor (
    message: Message,
    public content: string,
    public dokdo: Client,
    public options: ProcessOptions = {}
  ) {
    this.target = message.channelId
    this.dokdo = dokdo
    this.content = content || '​'
    this.messageContent = ''
    this.options = options
    this.limit = options.limit || 1900
    this.splitted = this.splitContent() || [' ']
    this.page = 1
    this.authorId = message.author.id
    this.actions = []
    this.wait = 1
    this.message = undefined
    
    this.sessionId = Math.random().toString(36).substring(2, 15)
    ProcessManager.sessions.set(this.sessionId, this)
    
    // Remove this after 5 minutes
    setTimeout(() => {
      ProcessManager.sessions.delete(this.sessionId)
      if (this.message) {
        this.dokdo.bot.helpers.editMessage(this.target, this.message.id, { components: [] }).catch(() => null)
      }
    }, 300000)

    if (typeof this.content !== 'string') {
      throw new Error('Please pass valid content')
    }
  }

  static async handleInteraction(bot: Bot, interaction: Interaction): Promise<boolean> {
    if (!interaction.data?.customId) return false
    
    const customId = interaction.data.customId
    if (!customId.startsWith('dokdo:')) return false

    const [, sessionId, actionId] = customId.split(':')
    const manager = ProcessManager.sessions.get(sessionId!)
    
    if (!manager) {
      await bot.helpers.sendInteractionResponse(interaction.id, interaction.token, { type: 6 })
      return true
    }

    const userId = interaction.user?.id || interaction.member?.user?.id
    if (userId !== manager.authorId) {
      await bot.helpers.sendInteractionResponse(interaction.id, interaction.token, { type: 6 })
      return true
    }

    const action = manager.actions.find(a => a.button.customId.endsWith(`:${actionId}`))
    if (action) {
      await bot.helpers.sendInteractionResponse(interaction.id, interaction.token, { type: 6 })
      action.action(manager.args)
    }

    return true
  }

  async init (): Promise<void> {
    this.messageContent = this.genText()
    this.message = (await this.dokdo.bot.helpers.sendMessage(this.target, {
      content: this.filterSecret(this.messageContent)
    })) as any
  }

  async addAction (actions: Action[], args?: Record<string, unknown>): Promise<void> {
    if (!this.message) return

    this.actions.push(...actions)
    this.args = args || {}
    this.args.manager = this
    
    // Rewrite customIds to include sessionId
    for (const action of this.actions) {
      const originalId = action.button.customId
      if (!originalId.startsWith('dokdo:')) {
        action.button.customId = `dokdo:${this.sessionId}:${originalId}`
      }
    }

    await this.createMessageComponentMessage()
  }

  async createMessageComponentMessage (): Promise<void> {
    if (this.options.noCode && this.splitted.length < 2) return
    const buttons = this.actions
      .filter((el) => !(el.requirePage && this.splitted.length <= 1))
      .map((el) => el.button)
      
    if (buttons.length <= 0) {
      if (this.message) {
        await this.dokdo.bot.helpers.editMessage(this.target, this.message.id, { components: [] }).catch(() => null)
      }
      return
    }

    const actionRow = {
      type: 1,
      components: buttons
    }
    
    if (this.message) {
      await this.dokdo.bot.helpers.editMessage(this.target, this.message.id, { components: [actionRow as any] }).catch(() => null)
    }
  }

  filterSecret (string: string): string {
    const token = this.dokdo.options.token || this.dokdo.bot.rest.token
    if (token) {
      string = string.replace(
        new RegExp(token, 'gi'),
        '[accesstoken was hidden]'
      )
    }

    if (this.dokdo.options.secrets) {
      for (const el of this.dokdo.options.secrets) {
        string = string.replace(new RegExp(regexpEscape(el), 'gi'), '[secret]')
      }
    }

    return string
  }

  updatePage (num: number): void {
    if (!this.message) return
    if (this.splitted.length < num || num < 1) throw new Error('Invalid page.')
    this.page = num

    this.update()
  }

  nextPage (): void {
    if (this.page >= this.splitted.length) return
    this.updatePage(this.page + 1)
  }

  previousPage (): void {
    if (this.page <= 1) return
    this.updatePage(this.page - 1)
  }

  update (): void {
    if (!this.message) return
    this.wait++
    this.splitted = this.splitContent()
    this.messageContent = this.genText()
    if (this.wait <= 5) this.edit().then(() => this.wait--)
    else {
      if (!this.timer) {
        this.timer = setTimeout(() => {
          this.edit().then(() => {
            this.wait = 0
            this.timer = null
          })
        }
        , this.rateLimitInterval)
      }
    }
  }

  async edit (): Promise<void> {
    if (!this.message) return
    
    const payload: any = { content: this.filterSecret(this.messageContent) }
    
    if (this.splitted.length > 1) {
      const buttons = this.actions
        .filter((el) => !(el.requirePage && this.splitted.length <= 1))
        .map((el) => el.button)
      
      if (buttons.length > 0) {
        payload.components = [{
          type: 1,
          components: buttons
        }]
      }
    } else {
      payload.components = []
    }
    
    await this.dokdo.bot.helpers.editMessage(this.target, this.message.id, payload).catch(() => null)
  }

  add (content: string): void {
    if (!this.message) return
    this.content += content
    this.update()
  }

  destroy (): void {
    if (this.message) {
      this.dokdo.bot.helpers.editMessage(this.target, this.message.id, { components: [] }).catch(() => null)
    }
    ProcessManager.sessions.delete(this.sessionId)
  }

  genText (): string {
    return this.options.noCode && this.splitted.length < 2
      ? `${this.splitted[this.page - 1]}`
      : `${codeBlock.construct(
          this.splitted[this.page - 1]!,
          this.options.lang
        )}\n\nPage ${this.page}/${this.splitted.length}`
  }

  splitContent (): string[] {
    const char = [new RegExp(`.{1,${this.limit}}`, 'g'), '\n']
    const text = typeof this.content === 'string' ? this.content : String(this.content)
    if (text.length <= this.limit) return [text]
    let splitText = [text]

    while (
      char.length > 0 &&
      splitText.some((elem) => elem.length > this.limit)
    ) {
      const currentChar = char.shift()
      if (currentChar instanceof RegExp) {
        splitText = splitText
          .flatMap((chunk) => chunk.match(currentChar))
          .filter((value) => value !== null) as string[]
      } else {
        splitText = splitText.flatMap((chunk) => chunk.split(currentChar!))
      }
    }
    if (splitText.some((elem) => elem.length > this.limit)) {
      throw new RangeError('SPLIT_MAX_LEN')
    }
    const messages = []
    let msg = ''
    for (const chunk of splitText) {
      if (msg && (msg + char + chunk).length > this.limit) {
        messages.push(msg)
        msg = ''
      }
      msg += (msg && msg !== '' ? char : '') + chunk
    }
    return messages.concat(msg).filter((m) => m)
  }
}
