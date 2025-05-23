export {};

declare global {
	interface Window {
		electron: {
			utils: {
				openLink: (url: string) => void;
			};
		};
	}
}
