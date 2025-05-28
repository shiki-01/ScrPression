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
				className="fixed left:0 top:0 z:40 h:full w:full bg:rgba(30|41|59|20)"
			/>
			<div
				style={{ width: size.width + 'px', height: size.height + 'px' }}
				className="fixed left:50% top:50% z:50 translate(-50%,-50%) r:8px bg:#f8fafc p:20px f:#1e293b box-shadow:0|10px|15px|-3px|rgba(0,0,0,0.2)"
			>
				{children}
			</div>
		</>
	);
};

export default baseDialog;
