import path from 'path';
import fs from 'fs';
import { app, BrowserWindow, dialog, ipcMain, Menu, MenuItem } from 'electron';
import isDev from 'electron-is-dev';
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.info('App starting...');

function appUpdater() {
	autoUpdater.on('update-downloaded', (info) => {
		dialog
			.showMessageBox({
				type: 'info',
				title: 'アップデートが利用可能です',
				message: '新しいバージョンをインストールしますか？',
				buttons: ['今すぐ再起動', 'あとで']
			})
			.then((/** @type {{ response: number; }} */ buttonIndex) => {
				if (buttonIndex.response === 0) {
					autoUpdater.quitAndInstall();
				}
			});
	});

	autoUpdater.checkForUpdatesAndNotify().then(r => console.log(r));
}

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const createWindow = () => {
	const win = new BrowserWindow({
		webPreferences: {
			preload: path.join(__dirname, 'preload.cjs'),
			contextIsolation: true,
			nodeIntegration: false
		}
	})
	win.loadURL(
		isDev
			? 'http://localhost:5173'
			: `file://${path.join(__dirname, '../index.html')}`
	).then(r => console.log(r));
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