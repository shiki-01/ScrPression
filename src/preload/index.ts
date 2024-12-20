import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('versions', {
	node: () => process.versions.node,
	chrome: () => process.versions.chrome,
	electron: () => process.versions.electron
});

contextBridge.exposeInMainWorld('electron', {
	utils: {
		openLink: (url: string) => {
			return ipcRenderer.invoke('open-link', url);
		}
	}
});
