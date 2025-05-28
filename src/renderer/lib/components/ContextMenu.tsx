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
		<div className="fixed inset:0 left:0 top:0 z:998 h:full w:full">
			<button
				aria-label="Close"
				onClick={() => onClose()}
				className="fixed inset:0 opacity:0"
			></button>
			<div
				className="fixed z-999 w:192px r:8px bg:#f8fafc box-shadow:0|10px|15px|-3px|rgba(0,0,0,0.2)"
				style={{ top: position.y + 1, left: position.x + 1 }}
			>
				<div className="flex flex:col  gap:1 p:8px font-size:14px">
					<button className="flex w:full flex:row align-items:center justify-content:start  gap:16px bg:#f8fafc px:8px py:4px transition:colors|300 bg:#e2e8f0:hover">
						<Icon icon="ic:round-undo" className="h:20px w:20px" />
						Undo
					</button>
					<button className="flex w:full flex:row align-items:center justify-content:start  gap:16px bg:#f8fafc px:8px py:4px transition:colors|300 bg:#e2e8f0:hover">
						<Icon icon="ic:round-redo" className="h:20px w:20px" />
						Redo
					</button>
					<span className="my-1 h:[1px] w:full bg:#e2e8f0"></span>
					<button className="flex w:full flex:row align-items:center justify-content:start  gap:16px bg:#f8fafc px:8px py:4px transition:colors|300 bg:#e2e8f0:hover">
						<Icon icon="ic:round-delete" className="h:20px w:20px" />
						Add Comment
					</button>
					<span className="my-1 h:[1px] w:full bg:#e2e8f0"></span>
					<button className="flex w:full flex:row align-items:center justify-content:start  gap:16px bg:#f8fafc px:8px py:4px transition:colors|300 bg:#e2e8f0:hover">
						<Icon icon="ic:round-delete" className="h:20px w:20px" />
						Clear Workspace
					</button>
					<button className="flex w:full flex:row align-items:center justify-content:start  gap:16px bg:#f8fafc px:8px py:4px transition:colors|300 bg:#e2e8f0:hover">
						<Icon icon="ic:round-delete" className="h:20px w:20px" />
						Save Workspace
					</button>
				</div>
			</div>
		</div>
	);
};

export default ContextMenu;
