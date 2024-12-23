import React, { useRef } from 'react';
import pointer from '$lib/img/pointer.svg';

interface PointerProps {
	position: { x: number; y: number };
	isLeave: boolean;
}

const Pointer: React.FC<PointerProps> = ({ position, isLeave }) => {
	const pointerRef = useRef<HTMLDivElement>(null);

	return (
		<div
			ref={pointerRef}
			className="pointer-events-none fixed"
			style={{
				visibility: isLeave ? 'hidden' : 'visible',
				top: position.y,
				left: position.x,
				zIndex: 9999
			}}
		>
			<img
				src={pointer}
				alt="pointer"
				style={{
					filter: 'drop-shadow(0px 8px 8px rgba(0, 0, 0, 0.2))'
				}}
				className="pointer-events-none max-h-[40px] max-w-[25px] drop-shadow-2xl"
			/>
		</div>
	);
};

export default Pointer;
