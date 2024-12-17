import { ColorPalette, type ColorKey } from '$lib/utils/color';

const ColorType: Record<string, ColorKey> = {
	flag: 'yellow',
	move: 'blue',
	composition: 'red',
	works: 'cyan',
	loop: 'orange',
	value: 'green'
};

function getColor(type: string): ColorKey {
	return ColorType[type];
}

export { getColor };
