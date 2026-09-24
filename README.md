# Dokdo-eno

<div align="center">
<img src="assets/dokdo.png">
</div>

**Dokdo-eno** is a port of [Dokdo](https://github.com/wonderlandpark/dokdo) for [`@discordeno/bot`](https://github.com/discordeno/discordeno).
It lets you evaluate JavaScript, run shell commands, and inspect your bot in real-time, directly from Discord.

> Inspired by [Jishaku](https://github.com/Ganymede23/Jishaku) for `discord.py`.

## Features

- **Eval command** — run JavaScript in the context of your bot (`js`, `jsi`).
![js](assets/js.png)
![jsi](assets/jsi.png)
- **Shell command** — execute terminal commands with live streamed output (`exec`, `sh`, `bash`, `zsh`, `ps`, `powershell`, `shell`).
![sh](assets/sh.gif)
- **Paginated output** — long outputs are split into pages with Prev/Stop/Next buttons.
![pagination](assets/pagination.png)
- **Token protection** — the bot token and configured secrets are masked in outputs.
![token](assets/token.png)
- **Direct invocation** — command types work without the alias (e.g. `!js 1 + 1`).
- **Customizable** — aliases, prefix, owners, secrets, globals, and a stats provider.

## Requirements

- [`@discordeno/bot`](https://www.npmjs.com/package/@discordeno/bot) (peer dependency)
- Node.js `>=22.12` or [Bun](https://bun.sh)
- The `MessageContent` intent if prefix commands should be readable

## Installation

`dokdo-eno` is not published on npm. Install it straight from GitHub:

```bash
npm install github:wanderer-npm/dokdo-eno
```

```bash
bun add github:wanderer-npm/dokdo-eno
```

Or link a local checkout:

```json
{
  "dependencies": {
    "dokdo-eno": "file:../dokdo-eno"
  }
}
```

Both CommonJS (`require`) and ESM (`import`) are supported.

## Usage

```ts
import { createBot, Intents } from '@discordeno/bot'
import { Dokdo } from 'dokdo-eno'

const bot = createBot({
  token: process.env.DISCORD_TOKEN!,
  intents: Intents.Guilds | Intents.GuildMessages | Intents.MessageContent,
})

const dokdo = new Dokdo(bot, {
  aliases: ['dokdo', 'dok'],
  prefix: '!',
  owners: [123456789012345678n],
})

bot.events.messageCreate = (message) => {
  void dokdo.run(message, '!')
}

bot.events.interactionCreate = (interaction) => {
  void Dokdo.handleInteraction(bot, interaction)
}

await bot.start()
```

Button pagination (Prev/Stop/Next) only works if `Dokdo.handleInteraction` receives your button interactions.

## Commands

All commands are owner-only. Run them as `<prefix><alias> <type> <code>`, e.g. `!dokdo js 1 + 1`, or invoke a type directly: `!js 1 + 1`.

| Type | Aliases | Description |
|---|---|---|
| _(none)_ | | Bot status: runtime, memory, gateway shards, latency, intents, guild/user counts |
| `js` | `javascript` | Evaluate JavaScript, results pretty-printed |
| `jsi` | `javascript_inspect` | Inspect a value: type, constructor, length/size, content types |
| `exec` | `sh`, `bash`, `zsh`, `ps`, `powershell`, `shell` | Run a shell command with live output (3 minute timeout, abortable with Stop) |
| `curl` | | Fetch a URL, pretty-printed as JSON when possible |
| `cat` | | Read a file from disk |

Code blocks are unwrapped automatically. When no code is given, an attached file (`.txt`, `.js`, `.ts`, `.sh`, `.bash`, `.zsh`, `.ps`) is executed instead, unless `disableAttachmentExecution` is set.

## Eval scope

Inside `js`/`jsi`, the following variables are available:

| Variable | Description |
|---|---|
| `bot` | The `Bot` instance passed to `new Dokdo(bot, ...)` |
| `message` | The invoking message (a `reply()` helper is attached, discordeno messages have none natively) |
| `_dokdo` | The Dokdo instance |
| `args` | The raw argument string |

## Options

```ts
const dokdo = new Dokdo(bot, {
  aliases: ['dokdo', 'dok'],
  prefix: '!',
  owners: [123456789012345678n],
  secrets: ['extra-string-to-mask'],
  token: process.env.DISCORD_TOKEN,
  globalVariable: { config },
  disableAttachmentExecution: false,
  noPerm: async (message) => { /* ... */ },
  isOwner: async (user) => user.id === 123456789012345678n,
  stats: () => ({ guilds: 816, users: 990512 }),
})
```

| Option | Type | Description |
|---|---|---|
| `aliases` | `string[]` | Command aliases. Defaults to `['dokdo', 'dok']` |
| `prefix` | `string` | Default prefix (overridable per call via `run(message, usedPrefix)`) |
| `owners` | `bigint[]` | Owner user IDs, checked before `isOwner` |
| `secrets` | `string[]` | Extra strings masked as `[secret]` in outputs |
| `token` | `string` | Token masked as `[accesstoken was hidden]` (falls back to the bot's REST token) |
| `globalVariable` | `Record<string, any>` | Globals exposed to evaluated code |
| `disableAttachmentExecution` | `boolean` | Ignore message attachments as code input |
| `noPerm` | `(message) => Promise<unknown>` | Called when a non-owner invokes dokdo |
| `isOwner` | `(user) => boolean \| Promise<boolean>` | Custom owner check |
| `stats` | `{ guilds?, users? } \| () => ...` | Guild/user counts for the status command (discordeno keeps no cache, so the host app provides them; supports async functions) |

## Notes

### Guild and user counts

Discordeno does not cache guilds or users on the bot object, so the status command shows counts only when the `stats` option is provided.

### Message content intent

Prefix commands need the `MessageContent` intent. A mention prefix works without it.

## License

MIT. Original [Dokdo](https://github.com/wonderlandpark/dokdo) by wonderlandpark.
