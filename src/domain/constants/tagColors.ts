export type TagColor = {
  name: string;
  hex: string;
};

export const TAG_COLORS: TagColor[] = [
  { name: 'Naranja', hex: '#ff8000' },
  { name: 'Negra',   hex: '#000000' },
  { name: 'Café',    hex: '#3F2212' },
  { name: 'Amarilla',hex: '#FFFF00' },
  { name: 'Azul',    hex: '#0000FF' },
  { name: 'Plata',   hex: '#BEBEBE' },
  { name: 'Morada',  hex: '#EE82EE' },
  { name: 'Blanca',  hex: '#FFFFFF' },
  { name: 'Verde',   hex: '#77a345' },
  { name: 'Roja',    hex: '#FF0000' },
];

export const TAG_COLOR_HEXES = TAG_COLORS.map(c => c.hex);
