const ColorPalette = {
  blue: {
    title: 'Move',
    primary: '#5A8DEE',
    secondary: '#A3C4F3',
    text: '#FFFFFF',
    bg: '#5A8DEE',
    border: '#3A6BC1',
    shadow: '0 4px 6px rgba(90, 141, 238, 0.1)',
  },
  red: {
    title: 'Custom',
    primary: '#EE5A77',
    secondary: '#F3A3B3',
    text: '#FFFFFF',
    bg: '#EE5A77',
    border: '#C13A55',
    shadow: '0 4px 6px rgba(238, 90, 119, 0.1)',
  },
  green: {
    title: 'Operation',
    primary: '#5AEE77',
    secondary: '#A3F3B3',
    text: '#FFFFFF',
    bg: '#5AEE77',
    border: '#3AC155',
    shadow: '0 4px 6px rgba(90, 238, 119, 0.1)',
  },
  yellow: {
    title: 'Jump',
    primary: '#EED55A',
    secondary: '#F3E3A3',
    text: '#FFFFFF',
    bg: '#EED55A',
    border: '#C1A33A',
    shadow: '0 4px 6px rgba(238, 213, 90, 0.1)',
  },
  orange: {
    title: 'Value',
    primary: '#EE8A5A',
    secondary: '#F3C4A3',
    text: '#FFFFFF',
    bg: '#EE8A5A',
    border: '#C16B3A',
    shadow: '0 4px 6px rgba(238, 138, 90, 0.1)',
  },
  cyan: {
    title: 'Search',
    primary: '#5AEEDE',
    secondary: '#A3F3F0',
    text: '#FFFFFF',
    bg: '#5AEEDE',
    border: '#3AC1B1',
    shadow: '0 4px 6px rgba(90, 238, 222, 0.1)',
  },
};

type ColorKey = keyof typeof ColorPalette;

export { ColorPalette, type ColorKey };