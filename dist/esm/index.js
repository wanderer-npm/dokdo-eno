var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined")
    return require.apply(this, arguments);
  throw new Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// package.json
var require_package = __commonJS({
  "package.json"(exports, module) {
    module.exports = {
      name: "dokdo-eno",
      version: "1.1.0",
      description: "Dokdo. Easy Discord bot debuging tool.",
      scripts: {
        build: "tsup",
        dev: "yarn test:bot",
        lint: "eslint --ext js,jsx,ts,tsx src",
        "lint:fix": "eslint --ext js,jsx,ts,tsx src --fix",
        test: "yarn build && mocha --exit",
        "test:bot": "yarn build && node examples/bot",
        "test:shard": "yarn build && node examples/shard",
        update: "yarn upgrade-interactive"
      },
      main: "./dist/index.js",
      module: "./dist/esm/index.js",
      types: "./dist/index.d.ts",
      exports: {
        import: "./dist/esm/index.js",
        require: "./dist/index.js",
        types: "./dist/index.d.ts"
      },
      files: [
        "src/**/*",
        "dist/**/*",
        "examples/**/*"
      ],
      repository: {
        type: "git",
        url: "git+https://github.com/wonderlandpark/dokdo.git"
      },
      author: {
        name: "wonderlandpark",
        email: "wonderlandpark@outlook.kr"
      },
      license: "MIT",
      bugs: {
        url: "https://github.com/wonderlandpark/dokdo/issues"
      },
      homepage: "https://github.com/wonderlandpark/dokdo#readme",
      devDependencies: {
        "@types/node": "^22.14.1",
        "@typescript-eslint/eslint-plugin": "^8.29.1",
        "@typescript-eslint/parser": "^8.29.1",
        eslint: "^9.24.0",
        "eslint-config-standard": "^16.0.2",
        "eslint-plugin-import": "^2.22.1",
        "eslint-plugin-jsdoc": "^36.0.6",
        "eslint-plugin-markdown": "^2.0.0",
        "eslint-plugin-mocha": "^9.0.0",
        "eslint-plugin-node": "^11.1.0",
        "eslint-plugin-promise": "^5.1.0",
        mocha: "^9.0.1",
        tsup: "^6.3.0",
        typescript: "^4.1.2"
      },
      engines: {
        node: ">=22.12.0"
      },
      packageManager: "yarn@3.2.4",
      peerDependencies: {
        "@discordeno/bot": "*"
      }
    };
  }
});

// node_modules/tsup/assets/esm_shims.js
import { fileURLToPath } from "url";
import path from "path";
var getFilename = /* @__PURE__ */ __name(() => fileURLToPath(import.meta.url), "getFilename");
var getDirname = /* @__PURE__ */ __name(() => path.dirname(getFilename()), "getDirname");
var __dirname = /* @__PURE__ */ getDirname();

// src/commands/index.ts
var commands_exports = {};
__export(commands_exports, {
  cat: () => cat,
  curl: () => curl,
  exec: () => exec,
  js: () => js,
  jsi: () => jsi,
  main: () => main
});

// src/utils/index.ts
var utils_exports = {};
__export(utils_exports, {
  DateFormatting: () => DateFormatting,
  HLJS: () => HLJS,
  ProcessManager: () => ProcessManager,
  System: () => System,
  codeBlock: () => codeBlock,
  count: () => count,
  inspect: () => inspect,
  isGenerator: () => isGenerator,
  isInstance: () => isInstance,
  join: () => join,
  regexpEscape: () => regexpEscape,
  table: () => table,
  typeFind: () => typeFind
});

// src/utils/ProcessManager.ts
var _ProcessManager = class {
  constructor(message2, content, dokdo, options = {}) {
    this.content = content;
    this.dokdo = dokdo;
    this.options = options;
    this.target = message2.channelId;
    this.dokdo = dokdo;
    this.content = content || "\u200B";
    this.messageContent = "";
    this.options = options;
    this.limit = options.limit || 1900;
    this.splitted = this.splitContent() || [" "];
    this.page = 1;
    this.authorId = message2.author.id;
    this.actions = [];
    this.wait = 1;
    this.message = void 0;
    this.sessionId = Math.random().toString(36).substring(2, 15);
    _ProcessManager.sessions.set(this.sessionId, this);
    setTimeout(() => {
      _ProcessManager.sessions.delete(this.sessionId);
      if (this.message) {
        this.dokdo.bot.helpers.editMessage(this.target, this.message.id, { components: [] }).catch(() => null);
      }
    }, 3e5);
    if (typeof this.content !== "string") {
      throw new Error("Please pass valid content");
    }
  }
  target;
  messageContent;
  limit;
  splitted;
  page;
  authorId;
  actions;
  wait;
  message;
  args;
  sessionId;
  timer = null;
  rateLimitInterval = 5e3;
  lastUpdate = 0;
  static async handleInteraction(bot2, interaction) {
    if (!interaction.data?.customId)
      return false;
    const customId = interaction.data.customId;
    if (!customId.startsWith("dokdo:"))
      return false;
    const [, sessionId, actionId] = customId.split(":");
    const manager = _ProcessManager.sessions.get(sessionId);
    if (!manager) {
      await bot2.helpers.sendInteractionResponse(interaction.id, interaction.token, { type: 6 });
      return true;
    }
    const userId = interaction.user?.id || interaction.member?.user?.id;
    if (userId !== manager.authorId) {
      await bot2.helpers.sendInteractionResponse(interaction.id, interaction.token, { type: 6 });
      return true;
    }
    const action = manager.actions.find((a) => a.button.customId.endsWith(`:${actionId}`));
    if (action) {
      await bot2.helpers.sendInteractionResponse(interaction.id, interaction.token, { type: 6 });
      action.action(manager.args);
    }
    return true;
  }
  async init() {
    this.messageContent = this.genText();
    this.message = await this.dokdo.bot.helpers.sendMessage(this.target, {
      content: this.filterSecret(this.messageContent)
    });
  }
  async addAction(actions, args2) {
    if (!this.message)
      return;
    this.actions.push(...actions);
    this.args = args2 || {};
    this.args.manager = this;
    for (const action of this.actions) {
      const originalId = action.button.customId;
      if (!originalId.startsWith("dokdo:")) {
        action.button.customId = `dokdo:${this.sessionId}:${originalId}`;
      }
    }
    await this.createMessageComponentMessage();
  }
  async createMessageComponentMessage() {
    if (this.options.noCode && this.splitted.length < 2)
      return;
    const buttons = this.actions.filter((el) => !(el.requirePage && this.splitted.length <= 1)).map((el) => el.button);
    if (buttons.length <= 0) {
      if (this.message) {
        await this.dokdo.bot.helpers.editMessage(this.target, this.message.id, { components: [] }).catch(() => null);
      }
      return;
    }
    const actionRow = {
      type: 1,
      components: buttons
    };
    if (this.message) {
      await this.dokdo.bot.helpers.editMessage(this.target, this.message.id, { components: [actionRow] }).catch(() => null);
    }
  }
  filterSecret(string) {
    const token = this.dokdo.options.token || this.dokdo.bot.rest.token;
    if (token) {
      string = string.replace(
        new RegExp(token, "gi"),
        "[accesstoken was hidden]"
      );
    }
    if (this.dokdo.options.secrets) {
      for (const el of this.dokdo.options.secrets) {
        string = string.replace(new RegExp(regexpEscape(el), "gi"), "[secret]");
      }
    }
    return string;
  }
  updatePage(num) {
    if (!this.message)
      return;
    if (this.splitted.length < num || num < 1)
      throw new Error("Invalid page.");
    this.page = num;
    this.update();
  }
  nextPage() {
    if (this.page >= this.splitted.length)
      return;
    this.updatePage(this.page + 1);
  }
  previousPage() {
    if (this.page <= 1)
      return;
    this.updatePage(this.page - 1);
  }
  update() {
    if (!this.message)
      return;
    this.wait++;
    this.splitted = this.splitContent();
    this.messageContent = this.genText();
    if (this.wait <= 5)
      this.edit().then(() => this.wait--);
    else {
      if (!this.timer) {
        this.timer = setTimeout(
          () => {
            this.edit().then(() => {
              this.wait = 0;
              this.timer = null;
            });
          },
          this.rateLimitInterval
        );
      }
    }
  }
  async edit() {
    if (!this.message)
      return;
    const payload = { content: this.filterSecret(this.messageContent) };
    if (this.splitted.length > 1) {
      const buttons = this.actions.filter((el) => !(el.requirePage && this.splitted.length <= 1)).map((el) => el.button);
      if (buttons.length > 0) {
        payload.components = [{
          type: 1,
          components: buttons
        }];
      }
    } else {
      payload.components = [];
    }
    await this.dokdo.bot.helpers.editMessage(this.target, this.message.id, payload).catch(() => null);
  }
  add(content) {
    if (!this.message)
      return;
    this.content += content;
    this.update();
  }
  destroy() {
    if (this.message) {
      this.dokdo.bot.helpers.editMessage(this.target, this.message.id, { components: [] }).catch(() => null);
    }
    _ProcessManager.sessions.delete(this.sessionId);
  }
  genText() {
    return this.options.noCode && this.splitted.length < 2 ? `${this.splitted[this.page - 1]}` : `${codeBlock.construct(
      this.splitted[this.page - 1],
      this.options.lang
    )}

Page ${this.page}/${this.splitted.length}`;
  }
  splitContent() {
    const char = [new RegExp(`.{1,${this.limit}}`, "g"), "\n"];
    const text = typeof this.content === "string" ? this.content : String(this.content);
    if (text.length <= this.limit)
      return [text];
    let splitText = [text];
    while (char.length > 0 && splitText.some((elem) => elem.length > this.limit)) {
      const currentChar = char.shift();
      if (currentChar instanceof RegExp) {
        splitText = splitText.flatMap((chunk) => chunk.match(currentChar)).filter((value) => value !== null);
      } else {
        splitText = splitText.flatMap((chunk) => chunk.split(currentChar));
      }
    }
    if (splitText.some((elem) => elem.length > this.limit)) {
      throw new RangeError("SPLIT_MAX_LEN");
    }
    const messages = [];
    let msg2 = "";
    for (const chunk of splitText) {
      if (msg2 && (msg2 + char + chunk).length > this.limit) {
        messages.push(msg2);
        msg2 = "";
      }
      msg2 += (msg2 && msg2 !== "" ? char : "") + chunk;
    }
    return messages.concat(msg2).filter((m) => m);
  }
};
var ProcessManager = _ProcessManager;
__name(ProcessManager, "ProcessManager");
__publicField(ProcessManager, "sessions", /* @__PURE__ */ new Map());

// src/utils/codeBlock.ts
var codeBlock = class {
  static construct(content, lang) {
    return `\`\`\`${content ? lang || "" : ""}
${content.replaceAll("```", "\\`\\`\\`")}
\`\`\``;
  }
  static parse(content) {
    const result2 = content.match(/^```(.*?)\n(.*?)```$/ms);
    return result2 ? result2.slice(0, 3).map((el) => el.trim()) : null;
  }
};
__name(codeBlock, "codeBlock");

// src/utils/hljs.ts
var HLJS = class {
  /**
   * Get highlight.js language of given query.
   */
  static getLang(query) {
    if (!query || typeof query !== "string")
      return void 0;
    return this.languages.find((l) => query.endsWith(l));
  }
};
__name(HLJS, "HLJS");
__publicField(HLJS, "languages", [
  "as",
  "1c",
  "abnf",
  "accesslog",
  "actionscript",
  "ada",
  "ado",
  "adoc",
  "apache",
  "apacheconf",
  "applescript",
  "arduino",
  "arm",
  "armasm",
  "asciidoc",
  "aspectj",
  "atom",
  "autohotkey",
  "autoit",
  "avrasm",
  "awk",
  "axapta",
  "bash",
  "basic",
  "bat",
  "bf",
  "bind",
  "bnf",
  "brainfuck",
  "c",
  "c++",
  "cal",
  "capnp",
  "capnproto",
  "cc",
  "ceylon",
  "clean",
  "clj",
  "clojure-repl",
  "clojure",
  "cls",
  "cmake.in",
  "cmake",
  "cmd",
  "coffee",
  "coffeescript",
  "console",
  "coq",
  "cos",
  "cpp",
  "cr",
  "craftcms",
  "crm",
  "crmsh",
  "crystal",
  "cs",
  "csharp",
  "cson",
  "csp",
  "css",
  "d",
  "dart",
  "dcl",
  "delphi",
  "dfm",
  "diff",
  "django",
  "dns",
  "do",
  "docker",
  "dockerfile",
  "dos",
  "dpr",
  "dsconfig",
  "dst",
  "dts",
  "dust",
  "ebnf",
  "elixir",
  "elm",
  "erb",
  "erl",
  "erlang-repl",
  "erlang",
  "excel",
  "f90",
  "f95",
  "feature",
  "fix",
  "flix",
  "fortran",
  "freepascal",
  "fs",
  "fsharp",
  "gams",
  "gauss",
  "gcode",
  "gemspec",
  "gherkin",
  "glsl",
  "gms",
  "go",
  "golang",
  "golo",
  "gradle",
  "graph",
  "groovy",
  "gss",
  "gyp",
  "h",
  "h++",
  "haml",
  "handlebars",
  "haskell",
  "haxe",
  "hbs",
  "hpp",
  "hs",
  "hsp",
  "html.handlebars",
  "html.hbs",
  "html",
  "htmlbars",
  "http",
  "https",
  "hx",
  "hy",
  "hylang",
  "i7",
  "iced",
  "icl",
  "inform7",
  "ini",
  "instances",
  "irb",
  "irpf90",
  "java",
  "javascript",
  "jboss-cli",
  "jinja",
  "js",
  "json",
  "jsp",
  "jsx",
  "julia",
  "k",
  "kdb",
  "kotlin",
  "lasso",
  "lassoscript",
  "lazarus",
  "ldif",
  "leaf",
  "less",
  "lfm",
  "lisp",
  "livecodeserver",
  "livescript",
  "llvm",
  "lpr",
  "ls",
  "lsl",
  "lua",
  "m",
  "mak",
  "makefile",
  "markdown",
  "mathematica",
  "matlab",
  "maxima",
  "md",
  "mel",
  "mercury",
  "mips",
  "mipsasm",
  "mizar",
  "mk",
  "mkd",
  "mkdown",
  "ml",
  "mm",
  "mma",
  "mojolicious",
  "monkey",
  "moo",
  "moon",
  "moonscript",
  "n1ql",
  "nc",
  "nginx",
  "nginxconf",
  "nim",
  "nimrod",
  "nix",
  "nixos",
  "nsis",
  "obj-c",
  "objc",
  "objectivec",
  "ocaml",
  "openscad",
  "osascript",
  "oxygene",
  "p21",
  "parser3",
  "pas",
  "pascal",
  "patch",
  "pb",
  "pbi",
  "pcmk",
  "perl",
  "pf.conf",
  "pf",
  "php",
  "php3",
  "php4",
  "php5",
  "php6",
  "pl",
  "plist",
  "pm",
  "podspec",
  "pony",
  "powershell",
  "pp",
  "processing",
  "profile",
  "prolog",
  "protobuf",
  "ps",
  "puppet",
  "purebasic",
  "py",
  "python",
  "q",
  "qml",
  "qt",
  "r",
  "rb",
  "rib",
  "roboconf",
  "rs",
  "rsl",
  "rss",
  "ruby",
  "ruleslanguage",
  "rust",
  "scad",
  "scala",
  "scheme",
  "sci",
  "scilab",
  "scss",
  "sh",
  "shell",
  "smali",
  "smalltalk",
  "sml",
  "sqf",
  "sql",
  "st",
  "stan",
  "stata",
  "step",
  "step21",
  "stp",
  "styl",
  "stylus",
  "subunit",
  "sv",
  "svh",
  "swift",
  "taggerscript",
  "tao",
  "tap",
  "tcl",
  "tex",
  "thor",
  "thrift",
  "tk",
  "toml",
  "tp",
  "ts",
  "twig",
  "typescript",
  "v",
  "vala",
  "vb",
  "vbnet",
  "vbs",
  "vbscript-html",
  "vbscript",
  "verilog",
  "vhdl",
  "vim",
  "wildfly-cli",
  "x86asm",
  "xhtml",
  "xjb",
  "xl",
  "xls",
  "xlsx",
  "xml",
  "xpath",
  "xq",
  "xquery",
  "xsd",
  "xsl",
  "yaml",
  "yml",
  "zep",
  "zephir",
  "zone",
  "zsh"
].sort().sort((a, b) => b.length - a.length));

// src/utils/system.ts
var System = class {
  /**
   * Get memory info
   *
   * @returns {NodeJS.MemoryUsage}
   */
  static memory() {
    const memory = process.memoryUsage();
    const keys = Object.keys(memory);
    const a = memory;
    keys.forEach((key) => {
      memory[key] = (a[key] / 1024 / 1024).toFixed(2) + "MB";
    });
    return memory;
  }
  static processReadyAt() {
    return new Date(Date.now() - process.uptime() * 1e3);
  }
};
__name(System, "System");

// src/utils/DateFormatting.ts
var DateFormatting = class {
  static _format(date, style) {
    return `<t:${Math.floor(Number(date) / 1e3)}` + (style ? `:${style}` : "") + ">";
  }
  static relative(date) {
    return this._format(date, "R");
  }
};
__name(DateFormatting, "DateFormatting");

// src/utils/type.ts
function typeFind(argument) {
  if (typeof argument === "number" && isNaN(argument))
    return "NaN";
  const parsed = Object.prototype.toString.apply(argument);
  const obj = parsed.slice(1, 7);
  if (obj !== "object")
    return typeof argument;
  const type = parsed.slice(8, parsed.length - 1);
  if (type === "Function") {
    return /^class[\s{]/.test(String(argument)) ? "Class" : "Function";
  } else
    return type;
}
__name(typeFind, "typeFind");

// src/utils/count.ts
function count(argument) {
  if (argument instanceof Map || argument instanceof Set) {
    argument = Array.from(argument.values());
  }
  if (Array.isArray(argument)) {
    const typed = argument.map(
      (el) => el?.constructor ? el.constructor.name : typeFind(el)
    );
    const obj = {};
    for (const t of typed) {
      if (!obj[t])
        obj[t] = 0;
      obj[t]++;
    }
    const items = Object.keys(obj).map((el) => {
      return { name: el, count: obj[el] };
    });
    const total = items.reduce(
      (previous, current) => previous + current.count,
      0
    );
    return items.map((el) => {
      return {
        name: el.name,
        count: el.count,
        ratio: (el.count / total * 100).toFixed(1)
      };
    }).sort((a, b) => Number(b.ratio) - Number(a.ratio));
  }
  return null;
}
__name(count, "count");

// src/utils/inspect.ts
import util from "util";
function inspect(value, options) {
  if (typeof Bun !== "undefined" && Bun.inspect)
    return Bun.inspect(value);
  return util.inspect(value, options);
}
__name(inspect, "inspect");

// src/utils/table.ts
function table(obj) {
  clean(obj);
  const max = Object.keys(obj).map((e) => e.toString().length).sort((a, b) => b - a)[0] + 4;
  return Object.keys(obj).map((key) => `${key}${" ".repeat(max - key.length)}:: ${obj[key]}`).join("\n");
}
__name(table, "table");
function clean(obj) {
  for (const propName in obj) {
    if (!obj[propName]) {
      delete obj[propName];
    }
  }
}
__name(clean, "clean");

// src/utils/isinstance.ts
function isInstance(target, theClass) {
  if (target instanceof Map) {
    target = Array.from(target.values());
  }
  if (Array.isArray(target) && target.map((f) => f instanceof theClass).includes(false)) {
    return false;
  } else if (!(target instanceof theClass) && !Array.isArray(target))
    return false;
  else
    return true;
}
__name(isInstance, "isInstance");

// src/utils/isGenerator.ts
var isGenerator = /* @__PURE__ */ __name((target) => target && typeof target.next === "function" && typeof target.throw === "function", "isGenerator");

// src/utils/regexpEscape.ts
function regexpEscape(string) {
  const str = String(string);
  const cpList = Array.from(str[Symbol.iterator]());
  const cuList = [];
  for (const c of cpList) {
    if ("^$\\.*+?()[]{}|".indexOf(c) !== -1) {
      cuList.push("\\");
    }
    cuList.push(c);
  }
  const L = cuList.join("");
  return L;
}
__name(regexpEscape, "regexpEscape");

// src/utils/join.ts
function join(arr, sep, lastSep) {
  if (arr.length <= 1)
    return arr.join(sep);
  return arr.reduce(
    (text, cur, idx) => [text, cur].join(idx === arr.length - 1 ? lastSep : sep)
  );
}
__name(join, "join");

// src/commands/main.ts
async function main(message2, parent) {
  const { bot: bot2 } = parent;
  let packageVersion = "1.1.0";
  try {
    packageVersion = require_package().version;
  } catch {
    try {
      packageVersion = __require("../package.json").version;
    } catch {
    }
  }
  const runtime = typeof Bun !== "undefined" ? `Bun ${Bun.version}` : `Node.js ${process.version}`;
  const memory = System.memory();
  const paragraphs = [
    `**Dokdo-eno v${packageVersion}** is running on \`${runtime}\` under \`${process.platform}\` with PID \`${process.pid}\`. The process began ${DateFormatting.relative(System.processReadyAt())} and currently uses \`${formatMemory(memory.rss)}\` of RSS memory, with \`${formatMemory(memory.heapUsed)}\` allocated to the runtime heap.`
  ];
  const gateway = bot2?.gateway;
  const gatewayParagraph = describeGateway(gateway);
  if (gatewayParagraph)
    paragraphs.push(gatewayParagraph);
  const latencyParagraph = await describeLatencies(gateway, bot2, message2);
  if (latencyParagraph)
    paragraphs.push(latencyParagraph);
  const instanceParagraph = await describeInstance(gateway, parent);
  if (instanceParagraph)
    paragraphs.push(instanceParagraph);
  await bot2.helpers.sendMessage(message2.channelId, { content: paragraphs.join("\n\n") });
}
__name(main, "main");
function describeGateway(gateway) {
  const shards = shardEntries(gateway);
  if (!shards.length)
    return void 0;
  const ids = shards.map(([id]) => id).sort((a, b) => a - b);
  const assignment = ids.length === 1 ? `with the active connection assigned to shard ${ids[0]}` : `with active connections assigned to shards ${ids[0]}-${ids[ids.length - 1]}`;
  const sentences = [`The gateway is running ${ids.length} shard${ids.length === 1 ? "" : "s"}, ${assignment}.`];
  const states = [...new Set(shards.map(([, shard]) => shardStateLabel(shard?.state)))];
  const latencies = shards.map(([, shard]) => shard?.heart?.rtt).filter((rtt) => typeof rtt === "number");
  const average = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : void 0;
  if (states.length === 1 && average !== void 0) {
    sentences.push(`The session is ${states[0]}, reporting an average websocket heartbeat of ${average} ms.`);
  } else {
    if (states.length === 1)
      sentences.push(`The session is ${states[0]}.`);
    sentences.push(average !== void 0 ? `The average websocket heartbeat is ${average} ms.` : "No heartbeat data has been recorded yet.");
  }
  const apiVersion = describeApiVersion();
  if (apiVersion)
    sentences.push(apiVersion);
  return sentences.join(" ");
}
__name(describeGateway, "describeGateway");
async function describeLatencies(gateway, bot2, message2) {
  const shards = shardEntries(gateway);
  const heartbeats = shards.map(([, shard]) => shard?.heart?.rtt).filter((rtt) => typeof rtt === "number");
  const metrics = [];
  const processing = messageProcessingLatency(message2);
  if (heartbeats.length) {
    metrics.push(["websocket latency", Math.round(heartbeats.reduce((a, b) => a + b, 0) / heartbeats.length)]);
  }
  const response = await measureRestLatency(bot2);
  if (response !== void 0)
    metrics.push(["response latency", response]);
  if (processing !== void 0)
    metrics.push(["message processing latency", processing]);
  if (!metrics.length)
    return void 0;
  const head = metrics[0];
  const tail = metrics.slice(1);
  const lead = `${head[0][0].toUpperCase()}${head[0].slice(1)} currently sits at \`${head[1]} ms\``;
  const rest = tail.length ? `, with ${join(tail.map(([name, value]) => `${name} at \`${value} ms\``), ", ", " and ")}` : "";
  return `${lead}${rest} across the active instance.`;
}
__name(describeLatencies, "describeLatencies");
async function describeInstance(gateway, parent) {
  const sentences = [];
  const intentSentence = describeIntents(gateway?.intents);
  if (intentSentence)
    sentences.push(intentSentence);
  const total = gateway?.totalShards;
  const sharding = typeof total === "number" && total > 1 ? `Sharding is active (shards ${gateway?.firstShardId ?? 0}-${gateway?.lastShardId ?? total - 1} of ${total} on this process)` : gateway ? "Sharding is inactive" : "";
  const stats = await loadStats(parent).catch(() => void 0);
  const counts = stats && (typeof stats.guilds === "number" || typeof stats.users === "number") ? `seeing ${formatCount(stats.guilds)} guild(s) and ${formatCount(stats.users)} user(s)` : "";
  if (sharding && counts)
    sentences.push(`${sharding}, with the current instance ${counts}.`);
  else if (sharding)
    sentences.push(`${sharding}.`);
  else if (counts)
    sentences.push(`The current instance is ${counts}.`);
  return sentences.length ? sentences.join(" ") : void 0;
}
__name(describeInstance, "describeInstance");
function describeIntents(intents) {
  if (typeof intents !== "number")
    return void 0;
  const flags = privilegedIntentFlags();
  const enabled = Object.keys(flags).filter((name) => (intents & flags[name]) !== 0);
  const disabled = Object.keys(flags).filter((name) => (intents & flags[name]) === 0);
  if (!enabled.length && !disabled.length)
    return void 0;
  const phrase = /* @__PURE__ */ __name((list, state) => list.length === 1 ? `\`${humanizeIntent(list[0])}\` intent is ${state}` : `${join(list.map((flag) => `\`${humanizeIntent(flag)}\``), ", ", " and ")} intents are ${state}`, "phrase");
  if (enabled.length && disabled.length)
    return `${phrase(enabled, "enabled")}, while ${phrase(disabled, "disabled")}.`;
  if (enabled.length)
    return `${phrase(enabled, "enabled")}.`;
  return `${phrase(disabled, "disabled")}.`;
}
__name(describeIntents, "describeIntents");
async function measureRestLatency(bot2) {
  try {
    if (typeof bot2?.helpers?.getGatewayBot !== "function")
      return void 0;
    const start = Date.now();
    await Promise.race([bot2.helpers.getGatewayBot(), new Promise((_, reject) => {
      const timeout = setTimeout(() => reject(new Error("timeout")), 5e3);
      timeout.unref?.();
    })]);
    return Date.now() - start;
  } catch {
    return void 0;
  }
}
__name(measureRestLatency, "measureRestLatency");
function messageProcessingLatency(message2) {
  try {
    const timestamp = message2?.timestamp;
    const sent = typeof timestamp === "number" ? timestamp : Date.parse(timestamp);
    if (!Number.isFinite(sent))
      return void 0;
    const elapsed = Date.now() - sent;
    return elapsed >= 0 ? elapsed : void 0;
  } catch {
    return void 0;
  }
}
__name(messageProcessingLatency, "messageProcessingLatency");
function shardEntries(gateway) {
  try {
    const shards = gateway?.shards;
    if (!shards)
      return [];
    if (typeof shards.entries === "function")
      return Array.from(shards.entries());
    if (typeof shards.values === "function") {
      return Array.from(shards.values()).map((shard, index) => [shard?.id ?? index, shard]);
    }
    return [];
  } catch {
    return [];
  }
}
__name(shardEntries, "shardEntries");
function shardStateLabel(state) {
  try {
    const states = __require("@discordeno/gateway").ShardState;
    if (states && typeof state === "number" && typeof states[state] === "string") {
      return String(states[state]).toLowerCase();
    }
  } catch {
  }
  const fallback = ["connected", "connecting", "disconnected", "unidentified", "identifying", "resuming", "offline"];
  return typeof state === "number" && fallback[state] ? fallback[state] : "unknown";
}
__name(shardStateLabel, "shardStateLabel");
function describeApiVersion() {
  try {
    const version = __require("@discordeno/rest").DISCORD_API_VERSION;
    if (version !== void 0)
      return `Discord API v${version} is currently in use.`;
  } catch {
  }
  return "";
}
__name(describeApiVersion, "describeApiVersion");
async function loadStats(parent) {
  const stats = parent.options.stats;
  if (!stats)
    return void 0;
  const resolved = typeof stats === "function" ? await stats() : stats;
  if (!resolved || typeof resolved !== "object")
    return void 0;
  return resolved;
}
__name(loadStats, "loadStats");
function formatCount(value) {
  return typeof value === "number" ? value.toLocaleString("en-US") : "unknown";
}
__name(formatCount, "formatCount");
function formatMemory(value) {
  const parsed = parseFloat(String(value));
  return Number.isFinite(parsed) ? `${parsed.toFixed(2)} MB` : String(value);
}
__name(formatMemory, "formatMemory");
function humanizeIntent(flag) {
  return flag.replace(/([a-z])([A-Z])/g, "$1 $2");
}
__name(humanizeIntent, "humanizeIntent");
function privilegedIntentFlags() {
  try {
    const flags = __require("@discordeno/bot").Intents;
    if (flags)
      return { GuildPresences: flags.GuildPresences, GuildMembers: flags.GuildMembers, MessageContent: flags.MessageContent };
  } catch {
  }
  return { GuildPresences: 256, GuildMembers: 2, MessageContent: 32768 };
}
__name(privilegedIntentFlags, "privilegedIntentFlags");

// src/commands/exec.ts
import child from "child_process";
async function exec(message2, parent) {
  const { bot: bot2 } = parent;
  let closed = false;
  if (!message2.data?.args) {
    bot2.helpers.sendMessage(message2.channelId, { content: "Missing Arguments." });
    return;
  }
  const shell = process.env.SHELL || (process.platform === "win32" ? "powershell" : null);
  if (!shell) {
    bot2.helpers.sendMessage(message2.channelId, {
      content: "Sorry, we are not able to find your default shell.\nPlease set `process.env.SHELL`."
    });
    return;
  }
  const msg2 = new ProcessManager(message2, `$ ${message2.data.args}
`, parent, {
    lang: "bash"
  });
  await msg2.init();
  const res2 = child.spawn(shell, [
    "-c",
    (shell === "win32" ? "chcp 65001\n" : "") + message2.data.args
  ]);
  const timeout = setTimeout(() => {
    kill(res2, "SIGTERM");
    bot2.helpers.sendMessage(message2.channelId, { content: "Shell timeout occured." });
  }, 18e4);
  await msg2.addAction(
    [
      {
        button: { type: 2, style: 4, customId: "prev", label: "Prev" },
        action: ({ manager }) => manager.previousPage(),
        requirePage: true
      },
      {
        button: { type: 2, style: 2, customId: "stop", label: "Stop" },
        action: async ({ res: res3, manager }) => {
          if (!closed) {
            res3.stdin.pause();
            kill(res3);
            msg2.add("^C");
            if (msg2.page < 2)
              manager.destroy();
          } else
            manager.destroy();
        },
        requirePage: false
      },
      {
        button: { type: 2, style: 3, customId: "next", label: "Next" },
        action: ({ manager }) => manager.nextPage(),
        requirePage: true
      }
    ],
    { res: res2 }
  );
  res2.stdout.on("data", (data) => {
    msg2.add(data.toString());
  });
  res2.stderr.on("data", (data) => {
    msg2.add(`[stderr] ${data.toString()}`);
  });
  res2.on("error", (err) => {
    bot2.helpers.sendMessage(message2.channelId, {
      content: `Error occurred while spawning process
${codeBlock.construct(
        err.toString(),
        "sh"
      )}`
    });
  });
  res2.on("close", (code2) => {
    clearTimeout(timeout);
    msg2.add(`
[status] process exited with code ${code2}`);
    closed = true;
  });
}
__name(exec, "exec");
function kill(res2, signal) {
  if (process.platform === "win32") {
    return child.exec(
      `powershell -File "..\\utils\\KillChildrenProcess.ps1" ${res2.pid}`,
      { cwd: __dirname }
    );
  } else
    return res2.kill(signal || "SIGINT");
}
__name(kill, "kill");

// src/commands/js.ts
async function js(message, _dokdo) {
  const { bot } = _dokdo;
  if (!message.data?.args) {
    bot.helpers.sendMessage(message.channelId, { content: "Missing Arguments." });
    return;
  }
  const args = message.data.args;
  const code = args.includes("return") || args.includes("await") || args.includes(";") ? `(async () => { ${args} })()` : `(async () => { return ${args} })()`;
  const res = new Promise(
    (resolve) => resolve(
      // eslint-disable-next-line no-eval
      eval(code)
    )
  );
  let typeOf;
  const result = await res.then(async (output) => {
    typeOf = typeof output;
    if (isGenerator(output)) {
      for (const value of output) {
        if (typeof value === "function") {
          await bot.helpers.sendMessage(message.channelId, { content: value.toString() });
        } else if (typeof value === "string") {
          await bot.helpers.sendMessage(message.channelId, { content: value });
        } else {
          await bot.helpers.sendMessage(message.channelId, {
            content: inspect(value, { depth: 1, maxArrayLength: 200 })
          });
        }
      }
    }
    if (typeof output === "function") {
      typeOf = "object";
      return output.toString();
    } else if (typeof output === "string") {
      return output;
    }
    return inspect(output, { depth: 1, maxArrayLength: 200 });
  }).catch((e) => {
    typeOf = "object";
    return e.toString();
  });
  const msg = new ProcessManager(message, result || "", _dokdo, {
    lang: "js",
    noCode: typeOf !== "object"
  });
  await msg.init();
  await msg.addAction([
    {
      button: { type: 2, style: 4, customId: "prev", label: "Prev" },
      action: ({ manager }) => manager.previousPage(),
      requirePage: true
    },
    {
      button: { type: 2, style: 2, customId: "stop", label: "Stop" },
      action: ({ manager }) => manager.destroy(),
      requirePage: true
    },
    {
      button: { type: 2, style: 3, customId: "next", label: "Next" },
      action: ({ manager }) => manager.nextPage(),
      requirePage: true
    }
  ]);
}
__name(js, "js");

// src/commands/jsi.ts
async function jsi(message, _dokdo) {
  const { bot } = _dokdo;
  if (!message.data?.args) {
    bot.helpers.sendMessage(message.channelId, { content: "Missing Arguments." });
    return;
  }
  const res = new Promise((resolve) => resolve(eval(message.data.args ?? "")));
  let msg;
  await res.then((output) => {
    const typeofTheRes = typeFind(output);
    const overview = inspect(output, { depth: -1 });
    const constructorName = output && output.constructor ? Object.getPrototypeOf(output.constructor).name : null;
    const arrCount = count(output);
    msg = new ProcessManager(
      message,
      `=== ${overview.slice(0, 100)}${overview.length > 100 ? "..." : ""} ===

${table({
        Type: `${typeof output}(${typeofTheRes})`,
        Name: constructorName || null,
        Length: typeof output === "string" && output.length,
        Size: output instanceof Map || output instanceof Set ? output.size : null,
        "Content Types": arrCount ? arrCount.map((el) => `${el.name} (${el.ratio}\uFF05)`).join(", ") : null
      })}`,
      _dokdo,
      { lang: "prolog" }
    );
  }).catch((e) => {
    msg = new ProcessManager(message, e.stack, _dokdo, { lang: "js" });
  });
  await msg.init();
  await msg.addAction([
    {
      button: { type: 2, style: 4, customId: "prev", label: "Prev" },
      action: ({ manager }) => manager.previousPage(),
      requirePage: true
    },
    {
      button: { type: 2, style: 2, customId: "stop", label: "Stop" },
      action: ({ manager }) => manager.destroy(),
      requirePage: true
    },
    {
      button: { type: 2, style: 3, customId: "next", label: "Next" },
      action: ({ manager }) => manager.nextPage(),
      requirePage: true
    }
  ]);
}
__name(jsi, "jsi");

// src/commands/curl.ts
async function curl(message2, parent) {
  const { bot: bot2 } = parent;
  if (!message2.data?.args) {
    bot2.helpers.sendMessage(message2.channelId, { content: "Missing Arguments." });
    return;
  }
  let type;
  let res2;
  try {
    const response = await fetch(message2.data.args.split(" ")[0]);
    const text = await response.text();
    try {
      type = "json";
      res2 = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      type = HLJS.getLang(response.headers.get("content-type")?.split(";")[0]) || "html";
      res2 = text;
    }
  } catch (e) {
    type = "js";
    bot2.helpers.addReaction(message2.channelId, message2.id, "\u2757").catch(() => null);
    res2 = e.toString();
  }
  const msg2 = new ProcessManager(message2, res2 || "", parent, { lang: type });
  await msg2.init();
  await msg2.addAction([
    {
      button: { type: 2, style: 4, customId: "prev", label: "Prev" },
      action: ({ manager }) => manager.previousPage(),
      requirePage: true
    },
    {
      button: { type: 2, style: 2, customId: "stop", label: "Stop" },
      action: ({ manager }) => manager.destroy(),
      requirePage: true
    },
    {
      button: { type: 2, style: 3, customId: "next", label: "Next" },
      action: ({ manager }) => manager.nextPage(),
      requirePage: true
    }
  ]);
}
__name(curl, "curl");

// src/commands/cat.ts
import fs from "fs";
async function cat(message2, parent) {
  const { bot: bot2 } = parent;
  if (!message2.data?.args) {
    bot2.helpers.sendMessage(message2.channelId, { content: "Missing Arguments." });
    return;
  }
  const filename = message2.data.args;
  let msg2;
  fs.readFile(filename, async (err, data) => {
    if (err) {
      msg2 = new ProcessManager(message2, err.toString(), parent, { lang: "js" });
    } else {
      msg2 = new ProcessManager(message2, data.toString(), parent, {
        lang: HLJS.getLang(filename.split(".").pop())
      });
    }
    await msg2.init();
    await msg2.addAction([
      {
        button: { type: 2, style: 4, customId: "prev", label: "Prev" },
        action: ({ manager }) => manager.previousPage(),
        requirePage: true
      },
      {
        button: { type: 2, style: 2, customId: "stop", label: "Stop" },
        action: ({ manager }) => manager.destroy(),
        requirePage: true
      },
      {
        button: { type: 2, style: 1, customId: "next", label: "Next" },
        action: ({ manager }) => manager.nextPage(),
        requirePage: true
      }
    ]);
  });
}
__name(cat, "cat");

// src/index.ts
var Dokdo = class {
  constructor(bot2, options) {
    this.bot = bot2;
    this.options = options;
    if (!bot2 || typeof bot2 !== "object") {
      throw new TypeError("Invalid `bot`. `bot` parameter is required.");
    }
    if (options.noPerm && typeof options.noPerm !== "function") {
      throw new Error("`noPerm` parameter must be Function.");
    }
    if (options.globalVariable) {
      if (typeof options.globalVariable !== "object") {
        throw new Error("`globalVariable` parameter must be Object.");
      } else {
        Object.keys(options.globalVariable).forEach((el) => {
          if (options.globalVariable)
            global[el] = options.globalVariable[el];
        });
      }
    }
    if (options.isOwner && !options.owners)
      options.owners = [];
    this.owners = options.owners || [];
    if (!this.options.secrets || !Array.isArray(this.options.secrets)) {
      this.options.secrets = [];
    }
    if (!this.options.aliases)
      this.options.aliases = ["dokdo", "dok"];
    this.process = [];
  }
  owners;
  process;
  static async handleInteraction(bot2, interaction) {
    return ProcessManager.handleInteraction(bot2, interaction);
  }
  async run(ctx, usedPrefix) {
    if (!ctx.content)
      return;
    const prefix = usedPrefix || this.options.prefix;
    if (!prefix)
      return;
    if (!ctx.content.toLowerCase().startsWith(prefix.toLowerCase()))
      return;
    const trimmed = ctx.content.slice(prefix.length).trim();
    const parsed = trimmed.split(/\s+/);
    const rawCmd = (parsed[0] || "").toLowerCase();
    const directTypes = ["js", "javascript", "exec", "sh", "bash", "zsh", "ps", "powershell", "shell", "jsi", "javascript_inspect", "curl", "cat"];
    const isDirect = directTypes.includes(rawCmd);
    const command = isDirect ? "dokdo" : rawCmd;
    const type = isDirect ? rawCmd : (parsed[1] || "").toLowerCase();
    const argsRaw = isDirect ? parsed.slice(1).join(" ") : parsed.slice(2).join(" ");
    const codeParsed = codeBlock.parse(argsRaw);
    ctx.data = {
      raw: ctx.content,
      command,
      type,
      args: codeParsed ? codeParsed[2] : argsRaw
    };
    if (!ctx.data.args && (ctx.attachments?.length ?? 0) > 0 && !this.options.disableAttachmentExecution) {
      const file = ctx.attachments[0];
      if (file) {
        const text = await fetch(file.url).then((res2) => res2.text()).catch(() => "");
        const ext = file.filename.split(".").pop();
        if (ext && ["txt", "js", "ts", "sh", "bash", "zsh", "ps"].includes(ext)) {
          ctx.data.args = text;
          if (!ctx.data.type && ext !== "txt")
            ctx.data.type = ext;
        }
      }
    }
    const allAliases = [...this.options.aliases || ["dokdo", "dok", "jsk"], ...directTypes];
    if (!allAliases.includes(rawCmd) && !allAliases.includes(command)) {
      return;
    }
    const authorId = BigInt(ctx.author.id);
    if (!this.owners.includes(authorId)) {
      let isOwner = false;
      if (this.options.isOwner) {
        const user = { id: authorId, username: ctx.author.username || "Unknown" };
        isOwner = await this.options.isOwner(user);
      }
      if (!isOwner) {
        if (this.options.noPerm)
          this.options.noPerm(ctx);
        return;
      }
    }
    try {
      if (typeof ctx.reply !== "function") {
        ctx.reply = (content) => {
          const payload = typeof content === "string" ? { content } : { ...content };
          if (payload.messageReference === void 0) {
            payload.messageReference = { messageId: ctx.id, channelId: ctx.channelId };
            if (ctx.guildId !== void 0)
              payload.messageReference.guildId = ctx.guildId;
          }
          return this.bot.helpers.sendMessage(ctx.channelId, payload);
        };
      }
    } catch {
    }
    if (!ctx.data.type)
      return main(ctx, this);
    switch (ctx.data.type) {
      case "sh":
      case "bash":
      case "ps":
      case "powershell":
      case "shell":
      case "zsh":
      case "exec":
        exec(ctx, this);
        break;
      case "js":
      case "javascript":
        js(ctx, this);
        break;
      case "jsi":
      case "javascript_inspect":
        jsi(ctx, this);
        break;
      case "curl":
        curl(ctx, this);
        break;
      case "cat":
        cat(ctx, this);
        break;
      default:
        await this.bot.helpers.sendMessage(ctx.channelId, {
          content: `Available Options: ${Object.keys(commands_exports).filter((t) => t !== "main").map((t) => `\`${t}\``).join(", ")}`
        });
    }
  }
  _addOwner(id) {
    if (!this.owners.includes(id))
      this.owners.push(id);
    return this.owners;
  }
  _removeOwner(id) {
    if (this.owners.includes(id))
      this.owners.splice(this.owners.indexOf(id), 1);
    return this.owners;
  }
};
__name(Dokdo, "Dokdo");
var src_default = Dokdo;
export {
  Dokdo as Client,
  commands_exports as Commands,
  Dokdo,
  utils_exports as Utils,
  src_default as default
};
//# sourceMappingURL=index.js.map