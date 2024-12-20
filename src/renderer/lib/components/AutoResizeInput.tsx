import React, { useLayoutEffect, useRef, useState } from 'react';

interface AutoResizeInputProps {
	initialValue: string;
	style?: React.CSSProperties;

	[key: string]: any;
}

const AutoResizeInput: React.FC<AutoResizeInputProps> = ({
	initialValue = '',
	style = {},
	...props
}) => {
	const [value, setValue] = useState(initialValue);
	const [width, setWidth] = useState('auto');
	const spanRef = useRef<HTMLSpanElement>(null);

	useLayoutEffect(() => {
		if (spanRef.current) {
			const newWidth = spanRef.current.offsetWidth;
			setWidth(`${Math.max(newWidth + 1, 16)}px`);
		}
	}, [value]);

	return (
		<div className="field h-full" style={{ display: 'inline-block', position: 'relative' }}>
			<span
				ref={spanRef}
				className="field"
				style={{
					visibility: 'hidden',
					position: 'absolute',
					fontSize: '16px',
					whiteSpace: 'pre'
				}}
			>
				{value || props.placeholder || ''}
			</span>
			<input
				{...props}
				value={value}
				className={'field h-full text-center ' + props.className}
				style={{
					...style,
					width
				}}
				onChange={(e) => {
					setValue(e.target.value);
					props.onChange?.(e);
				}}
			/>
		</div>
	);
};

export default AutoResizeInput;
