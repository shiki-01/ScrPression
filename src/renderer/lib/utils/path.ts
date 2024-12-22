const path = (
	type: 'flag' | 'works' | 'loop' | 'move' | 'composition' | 'value',
	size: {
		width: number;
		height: number;
	}
) => {
	return type === 'flag'
		? `M 14 2 L 42 2 L ${size.width - 14} 2 Q ${size.width} 2 ${size.width} 14 L ${size.width} ${size.height - 18} Q ${size.width} ${size.height - 14} ${size.width - 4} ${size.height - 14} L 40 ${size.height - 14} L 40 ${size.height - 10} Q 40 ${size.height - 8} 36 ${size.height - 8} L 20 ${size.height - 8} Q 16 ${size.height - 8} 16 ${size.height - 10} L 16 ${size.height - 14} L 4 ${size.height - 14} Q 2 ${size.height - 14} 2 ${size.height - 18} L 2 14 Q 2 2 14 2 Z`
		: type === 'works' || type === 'move' || type === 'composition'
			? `M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L ${size.width - 4} 2 Q ${size.width} 2 ${size.width} 4 L ${size.width} ${size.height - 18} Q ${size.width} ${size.height - 14} ${size.width - 4} ${size.height - 14} L 40 ${size.height - 14} L 40 ${size.height - 10} Q 40 ${size.height - 8} 36 ${size.height - 8} L 20 ${size.height - 8} Q 16 ${size.height - 8} 16 ${size.height - 10} L 16 ${size.height - 14} L 4 ${size.height - 14} Q 2 ${size.height - 14} 2 ${size.height - 18} L 2 4 Q 2 2 4 2 Z`
			: `M 4 2 L 14 2 L 14 4 Q 14 8 20 8 L 38 8 Q 42 8 42 4 L 42 2 L ${size.width - 4} 2 Q ${size.width} 2 ${size.width} 4 L ${size.width} ${size.height - 18} Q ${size.width} ${size.height - 14} ${size.width - 4} ${size.height - 14} L 48 ${size.height - 14} L 48 ${size.height - 10} Q 48 ${size.height - 8} 44 ${size.height - 8} L 28 ${size.height - 8} Q 24 ${size.height - 8} 24 ${size.height - 10} L 24 ${size.height - 14} L 12 ${size.height - 14} Q 8 ${size.height - 14} 8 ${size.height - 10} L 8 ${size.height + 11} Q 8 ${size.height + 15} 14 ${size.height + 15} L ${size.width - 4} ${size.height + 15} Q ${size.width} ${size.height + 15} ${size.width} ${size.height + 19} L ${size.width} ${size.height + 30} Q ${size.width} ${size.height + 34} ${size.width - 4} ${size.height + 34} L 4 ${size.height + 34} Q 2 ${size.height + 34} 2 ${size.height + 30} L 2 4 Q 2 2 4 2 Z`;
};

export { path };
