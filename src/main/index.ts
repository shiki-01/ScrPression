import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem } from 'electron';
import isDev from 'electron-is-dev';
import pkg from 'electron-updater';
import electronLog from 'electron-log';
import { fileURLToPath } from 'node:url';

const { autoUpdater } = pkg;
const log = electronLog.create({ logId: 'updater' });
autoUpdater.logger = log;
log.transports.file.level = 'info';

const appUpdater = () => {
	if (isDev) {
		console.log('開発環境ではアップデートチェックをスキップします');
		return;
	}

	autoUpdater.on('update-downloaded', (info) => {
		dialog
			.showMessageBox({
				type: 'info',
				title: 'アップデートが利用可能です',
				message: '新しいバージョンをインストールしますか？',
				buttons: ['今すぐ再起動', 'あとで']
			})
			.then(( buttonIndex: { response: number }) => {
				if (buttonIndex.response === 0) {
					autoUpdater.quitAndInstall();
				}
			});
	});

	autoUpdater.checkForUpdatesAndNotify().then(r => console.log(r));
}

const createWindow = () => {
	const win = new BrowserWindow({
		webPreferences: {
			preload: fileURLToPath(new URL('../preload/index.mjs', import.meta.url)),
			contextIsolation: true,
			nodeIntegration: false,
		},
	})
	if (isDev) {
		win.loadURL(process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173').then(r => console.log(r));
	} else {
		win.loadFile(path.resolve(fileURLToPath(new URL('../renderer/index.html', import.meta.url)))).then(() => {});
	}
}

app.whenReady().then(() => {
	createWindow();
	appUpdater();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})