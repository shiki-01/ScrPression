const dotenv = require("dotenv");
dotenv.config();

const config = {
	appId: 'com.shiki-01.scrpression',
	productName: 'ScrPression',
	directories: {
		output: 'dist',
		buildResources: 'build'
	},
	files: [
		'**/*',
		'!**/.vscode/*',
		'!src/*',
		'!electron.vite.config.ts',
		'!{.eslintrc.json,.prettierrc,.travis.yml,docs,dev-app-update.yml,CHANGELOG.md,README.md}'
	],
	publish: {
		provider: 'github',
		owner: 'shiki-01',
		repo: 'ScrPression',
		token: process.env.GH_TOKEN,
		private: false,
		releaseType: 'draft'
	},
	win: {
		target: [
			{
				target: 'nsis',
				arch: ['x64']
			}
		]
	},
	nsis: {
		oneClick: false,
		perMachine: false,
		allowToChangeInstallationDirectory: true,
		deleteAppDataOnUninstall: true
	}
};

module.exports = config;