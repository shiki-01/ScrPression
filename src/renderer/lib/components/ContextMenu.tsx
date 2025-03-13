import React from 'react';
import { Icon } from '@iconify/react';

interface ContextMenuProps {
	position: { x: number; y: number };
	onClose: () => void;
}

/**
 * ContextMenu
 * @param position コンテキストメニューの表示位置
 * @param onClose コンテキストメニューを閉じる関数
 * @constructor
 */
const ContextMenu: React.FC<ContextMenuProps> = ({ position, onClose }) => {
	return (
		<div className="fixed inset-0 left-0 top-0 z-[998] h-full w-full">
			<button
				aria-label="Close"
				onClick={() => onClose()}
				className="fixed inset-0 opacity-0"
			></button>
			<div
				className="fixed z-[999] w-48 rounded-lg bg-slate-50 shadow-lg"
				style={{ top: position.y + 1, left: position.x + 1 }}
			>
				<div className="flex flex-col gap-1 p-2 text-sm">
					<button className="flex w-full flex-row items-center justify-start gap-4 bg-slate-50 px-2 py-1 transition-colors duration-300 hover:bg-slate-200">
						<Icon icon="ic:round-undo" className="h-5 w-5" />
						Undo
					</button>
					<button className="flex w-full flex-row items-center justify-start gap-4 bg-slate-50 px-2 py-1 transition-colors duration-300 hover:bg-slate-200">
						<Icon icon="ic:round-redo" className="h-5 w-5" />
						Redo
					</button>
					<span className="my-1 h-[1px] w-full bg-slate-200"></span>
					<button className="flex w-full flex-row items-center justify-start gap-4 bg-slate-50 px-2 py-1 transition-colors duration-300 hover:bg-slate-200">
						<Icon icon="ic:round-delete" className="h-5 w-5" />
						Add Comment
					</button>
					<span className="my-1 h-[1px] w-full bg-slate-200"></span>
					<button className="flex w-full flex-row items-center justify-start gap-4 bg-slate-50 px-2 py-1 transition-colors duration-300 hover:bg-slate-200">
						<Icon icon="ic:round-delete" className="h-5 w-5" />
						Clear Workspace
					</button>
					<button className="flex w-full flex-row items-center justify-start gap-4 bg-slate-50 px-2 py-1 transition-colors duration-300 hover:bg-slate-200">
						<Icon icon="ic:round-delete" className="h-5 w-5" />
						Save Workspace
					</button>
				</div>
			</div>
		</div>
	);
};

export default ContextMenu;
