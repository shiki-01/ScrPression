import React from 'react';

interface BaseDialogProps {
	onClose: () => void;
	size: { width: number; height: number };
	children?: React.ReactNode;
}

/**
 * BaseDialog
 * @param onClose ダイアログを閉じる関数
 * @param size サイズ
 * @param children 子要素
 * @constructor BaseDialog
 */
const baseDialog: React.FC<BaseDialogProps> = ({ onClose, size, children }) => {
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
