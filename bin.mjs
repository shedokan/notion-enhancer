#!/usr/bin/env node

/**
 * notion-enhancer
 * (c) 2023 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

import os from "node:os";
import { createRequire } from "node:module";
import chalk from "chalk-template";
import arg from "arg";
import {
  backupApp,
  enhanceApp,
  getInsertVersion,
  getResourcePath,
  restoreApp,
  setNotionPath,
} from "./scripts/enhance-desktop-app.mjs";
import { greaterThan } from "./src/core/updateCheck.mjs";
import { existsSync } from "node:fs";

const nodeRequire = createRequire(import.meta.url),
  manifest = nodeRequire("./package.json");

let __quiet, __debug;
const print = (...args) => __quiet || process.stdout.write(chalk(...args)),
  printObject = (value) => __quiet || console.dir(value, { depth: null }),
  clearLine = `\r\x1b[K`,
  showCursor = `\x1b[?25h`,
  hideCursor = `\x1b[?25l`,
  cursorUp = (n) => `\x1b[${n}A`,
  cursorForward = (n) => `\x1b[${n}C`;

let __confirmation;
const readStdin = () => {
    return new Promise((res) => {
      process.stdin.resume();
      process.stdin.setEncoding("utf8");
      process.stdin.once("data", (key) => {
        process.stdin.pause();
        res(key);
      });
    });
  },
  promptConfirmation = async (prompt) => {
    let input;
    const validInputs = ["Y", "y", "N", "n"],
      promptLength = `    > ${prompt} [Y/n]: `.length;
    // prevent line clear remove existing stdout
    print`\n`;
    do {
      // clear line and repeat prompt until valid input is received
      print`${cursorUp(1)}${clearLine}    {inverse > ${prompt} [Y/n]:} `;
      // autofill prompt response if --yes, --no or --quiet flags passed
      if (validInputs.includes(__confirmation)) {
        input = __confirmation;
        print`${__confirmation}\n`;
      } else input = (await readStdin()).trim();
      if (!input) {
        // default to Y if enter is pressed w/out input
        input = "Y";
        print`${cursorUp(1)}${cursorForward(promptLength)}Y\n`;
      }
    } while (!validInputs.includes(input));
    // move cursor to immediately after input
    print`${cursorUp(1)}${cursorForward(promptLength + 1)}`;
    return input;
  };

let __spinner;
const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  stopSpinner = () => {
    if (!__spinner) return;
    clearInterval(__spinner);
    // show cursor and overwrite spinner with arrow on completion
    print`\b{bold.yellow →}\n${showCursor}`;
    __spinner = undefined;
  },
  startSpinner = () => {
    // cleanup prev spinner if necessary
    stopSpinner();
    // hide cursor and print first frame
    print`${hideCursor}{bold.yellow ${spinnerFrames[0]}}`;
    let i = 0;
    __spinner = setInterval(() => {
      i++;
      // overwrite spinner with next frame
      print`\b{bold.yellow ${spinnerFrames[i % spinnerFrames.length]}}`;
    }, 80);
  };

const compileOptsToArgSpec = (options) => {
    const args = {};
    for (const [opt, [type]] of options) {
      const aliases = opt.split(", ").map((alias) => alias.split("=")[0]),
        param = aliases[1] ?? aliases[0];
      args[param] = type;
      for (let i = 0; i < aliases.length; i++) {
        if (aliases[i] === param) continue;
        args[aliases[i]] = param;
      }
    }
    return args;
  },
  compileOptsToJsonOutput = (options) => {
    // the structure used to define options above
    // is convenient and compact, but requires additional
    // parsing to understand. this function processes
    // options into a more explicitly defined structure
    return options.map(([opt, [type, description]]) => {
      const option = {
          aliases: opt.split(", ").map((alias) => alias.split("=")[0]),
          type,
          description,
        },
        example = opt
          .split(", ")
          .map((alias) => alias.split("=")[1])
          .find((value) => value);
      if (example) option.example = example;
      return option;
    });
  };

let __json;
const printHelp = (commands, options) => {
    const { name, version, homepage } = manifest,
      usage = `${name} <command> [options]`;
    if (__json) {
      printObject({
        name,
        version,
        homepage,
        usage,
        commands: Object.fromEntries(commands),
        options: compileOptsToJsonOutput(options),
      });
    } else {
      const cmdPad = Math.max(...commands.map(([cmd]) => cmd.length)),
        optPad = Math.max(...options.map((opt) => opt[0].length)),
        parseCmd = (cmd) =>
          chalk`  ${cmd[0].padEnd(cmdPad)}  {grey :}  ${cmd[1]}`,
        parseOpt = (opt) =>
          chalk`  ${opt[0].padEnd(optPad)}  {grey :}  ${opt[1][1]}`;
      print`{bold.whiteBright.underline ${name} v${version}}\n{grey ${homepage}}
      \n{bold.whiteBright USAGE}\n${name} <command> [options]
      \n{bold.whiteBright COMMANDS}\n${commands.map(parseCmd).join("\n")}
      \n{bold.whiteBright OPTIONS}\n${options.map(parseOpt).join("\n")}\n`;
    }
  },
  printVersion = () => {
    if (__json) {
      printObject({
        [manifest.name]: manifest.version,
        node: process.version.slice(1),
        platform: process.platform,
        architecture: process.arch,
        os: os.release(),
      });
    } else {
      const nodeVersion = `node@${process.version}`,
        enhancerVersion = `${manifest.name}@v${manifest.version}`,
        osVersion = `${process.platform}-${process.arch}/${os.release()}`;
      print`${enhancerVersion} via ${nodeVersion} on ${osVersion}\n`;
    }
  };

try {
  const commands = [
      // ["command", "description"]
      ["apply", "Inject the notion-enhancer into Notion desktop."],
      ["remove", "Restore Notion desktop to its pre-enhanced state."],
      ["check", "Report Notion desktop's enhancement state."],
    ],
    // prettier-ignore
    options = [
      // ["alias, option=example", [type, "description"]]
      ["--path=</path/to/notion/resources>", [String, "Manually provide a Notion installation location."]],
      ["--no-backup", [Boolean, "Skip backup; enhancement will be irreversible."]],
      ["--json", [Boolean, "Output JSON from the `check` and `--version` commands."]],
      ["-y, --yes", [Boolean, 'Skip prompts; assume "yes" and run non-interactively.']],
      ["-n, --no", [Boolean, 'Skip prompts; assume "no" and run non-interactively.']],
      ["-q, --quiet", [Boolean, 'Skip prompts; assume "no" unless -y and hide all output.']],
      ["-d, --debug", [Boolean, "Show detailed error messages and keep extracted files."]],
      ["-h, --help", [Boolean, "Display usage information for this CLI."]],
      ["-v, --version", [Boolean, "Display this CLI's version number."]],
    ];

  const args = arg(compileOptsToArgSpec(options));
  if (args["--debug"]) __debug = true;
  if (args["--quiet"]) __quiet = true;
  if (args["--json"]) __json = true;
  if (args["--no"] || args["--quiet"]) __confirmation = "n";
  if (args["--yes"]) __confirmation = "y";
  if (args["--help"]) printHelp(commands, options), process.exit();
  if (args["--version"]) printVersion(), process.exit();
  if (args["--path"]) setNotionPath(args["--path"]);

  const appPath = getResourcePath("app.asar"),
    backupPath = getResourcePath("app.asar.bak"),
    insertVersion = await getInsertVersion(),
    updateAvailable = greaterThan(manifest.version, insertVersion);

  const messages = {
    "notion-found": insertVersion
      ? // prettier-ignore
        `Notion desktop found with ${manifest.name} v${insertVersion
      } applied${updateAvailable ? "" : " (up to date)"}.`
      : `Notion desktop found (no enhancements applied).`,
    "notion-not-found": `Notion desktop not found.`,

    // prettier-ignore
    "update-available": chalk`v${manifest.version
    } is available! To apply, run {underline ${manifest.name} apply -y}.`,
    // prettier-ignore
    "update-confirm": `${updateAvailable ? "Upgrade" : "Downgrade"
    } to ${manifest.name}${manifest.name} v${manifest.version}?`,

    "backup-found": `Restoring to pre-enhanced state from backup...`,
    "backup-not-found": chalk`No backup found: to restore Notion desktop to its pre-enhanced state,
    uninstall it and reinstall Notion from {underline https://www.notion.so/desktop}.`,

    "backup-app": `Backing up app before enhancement...`,
    "enhance-app": `Enhancing and patching app sources...`,
  };
  const SUCCESS = chalk`{bold.whiteBright SUCCESS} {green ✔}`,
    FAILURE = chalk`{bold.whiteBright FAILURE} {red ✘}`,
    CANCELLED = chalk`{bold.whiteBright CANCELLED} {red ✘}`,
    INCOMPLETE = Symbol();

  const interactiveRestore = async () => {
    if (!backupPath || !existsSync(backupPath)) {
      print`  {red * ${messages["backup-not-found"]}}\n`;
      return FAILURE;
    }
    print`  {grey * ${messages["backup-found"]}} `;
    startSpinner();
    await restoreApp();
    stopSpinner();
    return SUCCESS;
  };

  const getNotion = () => {
      if (!appPath || !existsSync(appPath)) {
        print`  {red * ${messages["notion-not-found"]}}\n`;
        return FAILURE;
      } else {
        print`  {grey * ${messages["notion-found"]}}\n`;
        return INCOMPLETE;
      }
    },
    compareVersions = async () => {
      if (insertVersion === manifest.version) {
        // same version already applied
        print`  {grey * ${messages["notion-found"]}}\n`;
        return SUCCESS;
      } else if (insertVersion) {
        // diff version already applied
        print`  {grey * ${messages["notion-found"]}}\n`;
        const replace = await promptConfirmation(messages["update-confirm"]);
        print`\n`;
        return ["Y", "y"].includes(replace)
          ? (await interactiveRestore()) === SUCCESS
            ? INCOMPLETE
            : FAILURE
          : CANCELLED;
      } else return INCOMPLETE;
    },
    interactiveEnhance = async () => {
      if (!args["--no-backup"]) {
        print`  {grey * ${messages["backup-app"]}} `;
        startSpinner();
        await backupApp();
        stopSpinner();
      }
      print`  {grey * ${messages["enhance-app"]}} `;
      startSpinner();
      await enhanceApp(__debug);
      stopSpinner();
      return SUCCESS;
    };

  switch (args["_"][0]) {
    case "apply": {
      print`{bold.whiteBright [${manifest.name.toUpperCase()}] APPLY}\n`;
      let res = getNotion();
      if (res === INCOMPLETE) res = await compareVersions();
      if (res === INCOMPLETE) res = await interactiveEnhance();
      print`${res}\n`;
      break;
    }
    case "remove": {
      print`{bold.whiteBright [${manifest.name.toUpperCase()}] REMOVE}\n`;
      let res = getNotion();
      if (res === INCOMPLETE) {
        res = insertVersion ? await interactiveRestore() : SUCCESS;
      }
      print`${res}\n`;
      break;
    }
    case "check": {
      if (__json) {
        const cliVersion = manifest.version,
          state = { appPath, backupPath, insertVersion, cliVersion };
        if (appPath && !existsSync(appPath)) state.appPath = null;
        if (backupPath && !existsSync(backupPath)) state.backupPath = null;
        printObject(state), process.exit();
      }
      print`{bold.whiteBright [${manifest.name.toUpperCase()}] CHECK}\n`;
      let res = getNotion();
      if (res === INCOMPLETE && updateAvailable) {
        print`  {grey * ${messages["update-available"]}}\n`;
      }
      break;
    }

    default:
      printHelp(commands, options);
  }
} catch (err) {
  stopSpinner();
  const message = err.message.split("\n")[0];
  if (__debug) {
    print`{bold.red ${err.name}:} ${message}\n{grey ${err.stack
      .split("\n")
      .splice(1)
      .map((at) => at.replace(/\s{4}/g, "  "))
      .join("\n")}}`;
  } else {
    print`{bold.red Error:} ${message} {grey (Run with -d for more information.)}\n`;
  }
}
