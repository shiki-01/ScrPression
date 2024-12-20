import React, { useState } from 'react';
import type { BlockType } from '$lib/block/type';
import { ListStore } from '$lib/list/store';

interface AddBlockProps {
	onClose: () => void;
}

const baseDialog: React.FC<AddBlockProps> = ({ onClose }) => {
	const [value, setValue] = useState('');
	const listStore = ListStore.getInstance();

	const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
		event.preventDefault();
		const url = event.currentTarget.href;
		window.electron.utils.openLink(url);
	};

	const isValidBlockType = (value: any): value is BlockType => {
		try {
			const parsedValue = JSON.parse(value);
			return (
				typeof parsedValue.id === 'string' &&
				typeof parsedValue.size === 'object' &&
				typeof parsedValue.size.width === 'number' &&
				typeof parsedValue.size.height === 'number' &&
				typeof parsedValue.zIndex === 'number'
			);
		} catch {
			return false;
		}
	};

	const handleSubmit = () => {
		if (value.trim() === '') return;

		console.log('Submit', isValidBlockType(value));
		if (isValidBlockType(value)) {
			const newBlock = JSON.parse(value) as BlockType;
			listStore.addList(newBlock);
			console.log('Block added');
		}

		onClose();
	};

	return (
		<>
			<div
				onClick={() => {
					onClose();
				}}
				className="fixed left-0 top-0 z-40 h-full w-full bg-slate-800/20"
			/>
			<div className="fixed left-1/2 top-1/2 z-50 h-[400px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-slate-50 p-5 text-slate-800 shadow-lg">
				<div className="flex h-full w-full flex-col gap-5">
					<div className="flex flex-col gap-2">
						<h1 className="font-bold">Add Block</h1>
						<p className="text-sm">
							<a
								className="text-blue-500 underline"
								href="https://github.com/shiki-01/ScrPression/releases/tag/v1.0.1-beta"
								onClick={handleLinkClick}
							>
								GitHub のリリースページ ➚
							</a>{' '}
							より、サンプルテキストをコピーして適宜書き換えて貼り付けてね
						</p>
					</div>
					<textarea
						value={value}
						onChange={(e) => setValue(e.target.value)}
						className="h-full w-full resize-none border border-slate-800 bg-transparent p-2 focus:outline-none"
					></textarea>
					<button
						onClick={handleSubmit}
						className="w-full bg-blue-500 p-2 text-white focus:outline-none"
					>
						Submit
					</button>
				</div>
			</div>
		</>
	);
};

export default baseDialog;
