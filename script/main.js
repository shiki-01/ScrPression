import path from 'path';
import fs from 'fs';
import {app, BrowserWindow, ipcMain, Menu, MenuItem} from 'electron';
import isDev from 'electron-is-dev';

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
	createWindow()

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