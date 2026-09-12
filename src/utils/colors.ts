export interface ColorPreset {
  name: string;
  hex: string;
  border?: string;
}

export const POPULAR_COLORS: ColorPreset[] = [
  { name: 'Noir Mat', hex: '#18181b' },
  { name: 'Gris Inox', hex: '#94a3b8' },
  { name: 'Blanc Pur', hex: '#ffffff', border: '#cbd5e1' },
  { name: 'Argent Métallisé', hex: '#cbd5e1' },
  { name: 'Gris Anthracite', hex: '#334155' },
  { name: 'Titane / Sidéral', hex: '#64748b' },
  { name: 'Bleu Nuit', hex: '#1e3a8a' },
  { name: 'Bleu Ciel', hex: '#0ea5e9' },
  { name: 'Rouge Écarlate', hex: '#dc2626' },
  { name: 'Bordeaux', hex: '#881337' },
  { name: 'Or / Champagne', hex: '#d97706' },
  { name: 'Rose Gold', hex: '#fb7185' },
  { name: 'Beige / Crème', hex: '#fef3c7', border: '#d1d5db' },
  { name: 'Vert Forêt', hex: '#15803d' },
  { name: 'Marron Café', hex: '#78350f' },
];

const COLOR_NAME_MAP: Record<string, string> = {
  noir: '#18181b',
  black: '#18181b',
  sombre: '#1e293b',
  blanc: '#ffffff',
  white: '#ffffff',
  inox: '#94a3b8',
  'gris inox': '#94a3b8',
  'acier inox': '#94a3b8',
  gris: '#64748b',
  grey: '#64748b',
  gray: '#64748b',
  argent: '#cbd5e1',
  silver: '#cbd5e1',
  anthracite: '#334155',
  titane: '#71717a',
  titanium: '#71717a',
  bleu: '#2563eb',
  blue: '#2563eb',
  'bleu nuit': '#1e3a8a',
  'bleu marine': '#172554',
  rouge: '#dc2626',
  red: '#dc2626',
  bordeaux: '#881337',
  or: '#d97706',
  gold: '#d97706',
  dore: '#d97706',
  champagne: '#e2d9c8',
  rose: '#ec4899',
  pink: '#ec4899',
  'rose gold': '#fb7185',
  beige: '#fef3c7',
  creme: '#fef3c7',
  vert: '#16a34a',
  green: '#16a34a',
  marron: '#78350f',
  brown: '#78350f',
  jaune: '#eab308',
  yellow: '#eab308',
  violet: '#7c3aed',
  purple: '#7c3aed',
  orange: '#ea580c',
};

/**
 * Resolves a hex color code from an explicit hex or matching color name.
 */
export function getColorHex(colorHex?: string, colorName?: string): string | undefined {
  if (colorHex && /^#([0-9A-Fa-f]{3}){1,2}$/i.test(colorHex.trim())) {
    return colorHex.trim();
  }
  if (!colorName || !colorName.trim()) {
    return undefined;
  }
  const clean = colorName
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (COLOR_NAME_MAP[clean]) {
    return COLOR_NAME_MAP[clean];
  }

  for (const [key, hex] of Object.entries(COLOR_NAME_MAP)) {
    const cleanKey = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (clean.includes(cleanKey) || cleanKey.includes(clean)) {
      return hex;
    }
  }

  return undefined;
}
