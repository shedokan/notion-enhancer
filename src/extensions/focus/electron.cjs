/**
 * notion-enhancer: focus
 * (c) 2020 Arecsu
 * (c) 2024 dragonwocky <thedragonring.bod@gmail.com> (https://dragonwocky.me/)
 * (https://notion-enhancer.github.io/) under the MIT license
 */

"use strict";

module.exports = async (api, db) => {
  const { ipcMain, BrowserWindow } = require("electron"),
    channel = "notion-enhancer:focus";
  ipcMain.on(channel, ({ sender }, message) => {
    const views = BrowserWindow.fromWebContents(sender).getBrowserViews();
    for (const view of views) view.webContents.send(channel, message);
  });
};
