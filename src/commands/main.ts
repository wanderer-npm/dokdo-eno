import type { Client, Context, DokdoStats } from '../'
import { System, DateFormatting, join } from '../utils'

export async function main (message: Context, parent: Client): Promise<void> {
  const { bot } = parent

  let packageVersion = '1.1.0'
  try {
    packageVersion = require('../../package.json').version
  } catch {
    try { packageVersion = require('../package.json').version } catch {}
  }

  // @ts-ignore
  const runtime = typeof Bun !== 'undefined' ? `Bun ${Bun.version}` : `Node.js ${process.version}`
  const memory = System.memory()

  const paragraphs = [
    `**Dokdo-eno v${packageVersion}** is running on \`${runtime}\` under \`${process.platform}\` with PID \`${process.pid}\`. The process began ${DateFormatting.relative(System.processReadyAt())} and currently uses \`${formatMemory(memory.rss)}\` of RSS memory, with \`${formatMemory(memory.heapUsed)}\` allocated to the runtime heap.`
  ]

  const gateway = (bot as any)?.gateway
  const gatewayParagraph = describeGateway(gateway)
  if (gatewayParagraph) paragraphs.push(gatewayParagraph)

  const latencyParagraph = await describeLatencies(gateway, bot, message)
  if (latencyParagraph) paragraphs.push(latencyParagraph)

  const instanceParagraph = await describeInstance(gateway, parent)
  if (instanceParagraph) paragraphs.push(instanceParagraph)

  await bot.helpers.sendMessage(message.channelId, { content: paragraphs.join('\n\n') })
}

function describeGateway (gateway: any): string | undefined {
  const shards = shardEntries(gateway)
  if (!shards.length) return undefined
  const ids = shards.map(([id]) => id).sort((a, b) => a - b)
  const assignment = ids.length === 1
    ? `with the active connection assigned to shard ${ids[0]}`
    : `with active connections assigned to shards ${ids[0]}-${ids[ids.length - 1]}`

  const sentences = [`The gateway is running ${ids.length} shard${ids.length === 1 ? '' : 's'}, ${assignment}.`]
  const states = [...new Set(shards.map(([, shard]) => shardStateLabel(shard?.state)))]
  const latencies = shards
    .map(([, shard]) => shard?.heart?.rtt)
    .filter((rtt) => typeof rtt === 'number') as number[]
  const average = latencies.length
    ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
    : undefined

  if (states.length === 1 && average !== undefined) {
    sentences.push(`The session is ${states[0]}, reporting an average websocket heartbeat of ${average} ms.`)
  } else {
    if (states.length === 1) sentences.push(`The session is ${states[0]}.`)
    sentences.push(average !== undefined
      ? `The average websocket heartbeat is ${average} ms.`
      : 'No heartbeat data has been recorded yet.')
  }

  const apiVersion = describeApiVersion()
  if (apiVersion) sentences.push(apiVersion)
  return sentences.join(' ')
}

async function describeLatencies (gateway: any, bot: any, message: Context): Promise<string | undefined> {
  const shards = shardEntries(gateway)
  const heartbeats = shards
    .map(([, shard]) => shard?.heart?.rtt)
    .filter((rtt) => typeof rtt === 'number') as number[]
  const metrics: Array<[string, number]> = []
  const processing = messageProcessingLatency(message)
  if (heartbeats.length) {
    metrics.push(['websocket latency', Math.round(heartbeats.reduce((a, b) => a + b, 0) / heartbeats.length)])
  }
  const response = await measureRestLatency(bot)
  if (response !== undefined) metrics.push(['response latency', response])
  if (processing !== undefined) metrics.push(['message processing latency', processing])
  if (!metrics.length) return undefined
  const head = metrics[0]!
  const tail = metrics.slice(1)
  const lead = `${head[0][0]!.toUpperCase()}${head[0].slice(1)} currently sits at \`${head[1]} ms\``
  const rest = tail.length ? `, with ${join(tail.map(([name, value]) => `${name} at \`${value} ms\``), ', ', ' and ')}` : ''
  return `${lead}${rest} across the active instance.`
}

async function describeInstance (gateway: any, parent: Client): Promise<string | undefined> {
  const sentences: string[] = []
  const intentSentence = describeIntents(gateway?.intents)
  if (intentSentence) sentences.push(intentSentence)

  const total = gateway?.totalShards
  const sharding = typeof total === 'number' && total > 1
    ? `Sharding is active (shards ${gateway?.firstShardId ?? 0}-${gateway?.lastShardId ?? total - 1} of ${total} on this process)`
    : (gateway ? 'Sharding is inactive' : '')

  const stats = await loadStats(parent).catch(() => undefined)
  const counts = stats && (typeof stats.guilds === 'number' || typeof stats.users === 'number')
    ? `seeing ${formatCount(stats.guilds)} guild(s) and ${formatCount(stats.users)} user(s)`
    : ''

  if (sharding && counts) sentences.push(`${sharding}, with the current instance ${counts}.`)
  else if (sharding) sentences.push(`${sharding}.`)
  else if (counts) sentences.push(`The current instance is ${counts}.`)
  return sentences.length ? sentences.join(' ') : undefined
}

function describeIntents (intents: unknown): string | undefined {
  if (typeof intents !== 'number') return undefined
  const flags = privilegedIntentFlags()
  const enabled = Object.keys(flags).filter((name) => (intents & flags[name]!) !== 0)
  const disabled = Object.keys(flags).filter((name) => (intents & flags[name]!) === 0)
  if (!enabled.length && !disabled.length) return undefined
  const phrase = (list: string[], state: string) => list.length === 1
    ? `\`${humanizeIntent(list[0]!)}\` intent is ${state}`
    : `${join(list.map((flag) => `\`${humanizeIntent(flag)}\``), ', ', ' and ')} intents are ${state}`
  if (enabled.length && disabled.length) return `${phrase(enabled, 'enabled')}, while ${phrase(disabled, 'disabled')}.`
  if (enabled.length) return `${phrase(enabled, 'enabled')}.`
  return `${phrase(disabled, 'disabled')}.`
}

async function measureRestLatency (bot: any): Promise<number | undefined> {
  try {
    if (typeof bot?.helpers?.getGatewayBot !== 'function') return undefined
    const start = Date.now()
    await Promise.race([bot.helpers.getGatewayBot(), new Promise((_, reject) => {
      const timeout: any = setTimeout(() => reject(new Error('timeout')), 5000)
      timeout.unref?.()
    })])
    return Date.now() - start
  } catch {
    return undefined
  }
}

function messageProcessingLatency (message: Context): number | undefined {
  try {
    const timestamp = (message as any)?.timestamp
    const sent = typeof timestamp === 'number' ? timestamp : Date.parse(timestamp)
    if (!Number.isFinite(sent)) return undefined
    const elapsed = Date.now() - sent
    return elapsed >= 0 ? elapsed : undefined
  } catch {
    return undefined
  }
}

function shardEntries (gateway: any): Array<[number, any]> {
  try {
    const shards = gateway?.shards
    if (!shards) return []
    if (typeof shards.entries === 'function') return Array.from(shards.entries())
    if (typeof shards.values === 'function') {
      return Array.from(shards.values()).map((shard: any, index: number) => [shard?.id ?? index, shard])
    }
    return []
  } catch {
    return []
  }
}

function shardStateLabel (state: unknown): string {
  try {
    const states = require('@discordeno/gateway').ShardState
    if (states && typeof state === 'number' && typeof states[state] === 'string') {
      return String(states[state]).toLowerCase()
    }
  } catch {}
  const fallback = ['connected', 'connecting', 'disconnected', 'unidentified', 'identifying', 'resuming', 'offline']
  return typeof state === 'number' && fallback[state] ? fallback[state]! : 'unknown'
}

function describeApiVersion (): string {
  try {
    const version = require('@discordeno/rest').DISCORD_API_VERSION
    if (version !== undefined) return `Discord API v${version} is currently in use.`
  } catch {}
  return ''
}

async function loadStats (parent: Client): Promise<DokdoStats | undefined> {
  const stats = parent.options.stats
  if (!stats) return undefined
  const resolved = typeof stats === 'function' ? await stats() : stats
  if (!resolved || typeof resolved !== 'object') return undefined
  return resolved
}

function formatCount (value: unknown): string {
  return typeof value === 'number' ? value.toLocaleString('en-US') : 'unknown'
}

function formatMemory (value: unknown): string {
  const parsed = parseFloat(String(value))
  return Number.isFinite(parsed) ? `${parsed.toFixed(2)} MB` : String(value)
}

function humanizeIntent (flag: string): string {
  return flag.replace(/([a-z])([A-Z])/g, '$1 $2')
}

function privilegedIntentFlags (): Record<string, number> {
  try {
    const flags = require('@discordeno/bot').Intents
    if (flags) return { GuildPresences: flags.GuildPresences, GuildMembers: flags.GuildMembers, MessageContent: flags.MessageContent }
  } catch {}
  return { GuildPresences: 256, GuildMembers: 2, MessageContent: 32768 }
}
