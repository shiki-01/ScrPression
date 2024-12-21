import React, { useState } from 'react';
import type { BlockType } from '$lib/block/type';
import { ListStore } from '$lib/list/store';

interface BaseDialogProps {
	onClose: () => void;
	size: { width: number; height: number };
	children?: React.ReactNode;
}

const baseDialog: React.FC<BaseDialogProps> = ({ onClose, size, children }) => {
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

	return (
		<>
			<div
				onClick={() => {
					onClose();
				}}
				className="fixed left-0 top-0 z-40 h-full w-full bg-slate-800/20"
			/>
			<div
				style={{ width: size.width + 'px', height: size.height + 'px' }}
				className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-slate-50 p-5 text-slate-800 shadow-lg"
			>
				{children}
			</div>
		</>
	);
};

export default baseDialog;
