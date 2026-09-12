import { AppSettings, DeliveryZone } from '../types';
export type { DeliveryZone };

export const SHOWROOM_INFO = {
  name: 'Khelcom Business',
  address: 'Showroom Khelcom Business, Nianing (Mbour)',
  city: 'Nianing, Mbour, Sénégal',
  landmark: 'Showroom Électronique & Électroménager à Nianing (Mbour)',
  googleMapsUrl: 'https://maps.app.goo.gl/QVw9tr1Hd99sqsQW7',
  pickupInstructions: 'Retrait direct en magasin : Les clients ayant choisi ce mode peuvent venir récupérer et tester leur produit directement dans notre showroom à Nianing (Mbour).',
  phone: '+221 78 108 71 48 / +221 77 136 01 46',
  phone1: '+221 78 108 71 48',
  phone2: '+221 77 136 01 46',
  phone1Raw: '221781087148',
  phone2Raw: '221771360146',
  whatsapp: '+221 78 108 71 48',
  whatsappRaw: '221781087148',
  whatsapp2: '+221 77 136 01 46',
  whatsapp2Raw: '221771360146',
  email: 'contact@khelcom-business.sn',
  openingHours: 'Lundi au Samedi de 08h30 à 20h30 | Dimanche de 10h00 à 19h00 (Ouvert 7j/7)',
  ninea: '007894523-2B2',
  rc: 'SN-MBR-2023-B-14820',
};

export const DELIVERY_POLICY = {
  onlyNianing: false,
  googleMapsUrl: 'https://maps.app.goo.gl/QVw9tr1Hd99sqsQW7',
  showroomNotice: 'Retrait gratuit en Showroom (ouvert à tous les clients) : Venez récupérer et tester votre appareil directement à notre Showroom de Nianing (Mbour).',
  notice: 'Retrait gratuit en Showroom (ouvert à tous les clients). Livraison à domicile rapide : Nianing, Mbour et environs selon la grille tarifaire active.',
};

// Zones de livraison à domicile de proximité (DE MAIN À MAIN À NIANING)
export const SENEGAL_DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'nianing-centre', name: 'Nianing Centre & Quartiers Résidentiels', region: 'Nianing', fee: 1000, estimatedTime: '1 à 2 heures' },
  { id: 'nianing-plage', name: 'Nianing Plage & Bords de Mer', region: 'Nianing', fee: 1000, estimatedTime: '1 à 2 heures' },
  { id: 'nianing-village', name: 'Nianing Village & Axe Route de Joal', region: 'Nianing', fee: 1000, estimatedTime: '1 à 2 heures' },
  { id: 'nianing-cite', name: 'Nianing Cité & Lotissements', region: 'Nianing', fee: 1000, estimatedTime: '1 à 2 heures' },
  { id: 'nianing-peripherie', name: 'Nianing Périphérie & Environs immédiats', region: 'Nianing', fee: 1500, estimatedTime: '2 à 3 heures' },
];

// 14 Régions administratives officielles du Sénégal
export interface SenegalRegionDetail {
  code: string;
  name: string;
  capital: string;
  departments: string[];
  defaultFee: number;
  estimatedTime: string;
}

export const SENEGAL_14_REGIONS: SenegalRegionDetail[] = [
  {
    code: 'DK',
    name: 'Dakar',
    capital: 'Dakar',
    departments: ['Dakar Plateau / Almadies', 'Pikine', 'Guédiawaye', 'Rufisque', 'Diamniadio'],
    defaultFee: 5000,
    estimatedTime: '24 à 48 heures',
  },
  {
    code: 'TH',
    name: 'Thiès',
    capital: 'Thiès',
    departments: ['Thiès Ville', 'Mbour', 'Saly Portudal', 'Somone / Ngaparou', 'Tivaouane', 'Joal-Fadiouth'],
    defaultFee: 3000,
    estimatedTime: '24 heures (Express GP)',
  },
  {
    code: 'DB',
    name: 'Diourbel',
    capital: 'Diourbel',
    departments: ['Diourbel Ville', 'Touba Sainte', 'Mbacké', 'Bambey'],
    defaultFee: 5000,
    estimatedTime: '24 à 48 heures',
  },
  {
    code: 'FK',
    name: 'Fatick',
    capital: 'Fatick',
    departments: ['Fatick Ville', 'Foundiougne', 'Gossas', 'Sokone', 'Passy'],
    defaultFee: 4000,
    estimatedTime: '24 à 48 heures',
  },
  {
    code: 'KL',
    name: 'Kaolack',
    capital: 'Kaolack',
    departments: ['Kaolack Ville', 'Nioro du Rip', 'Guinguinéo', 'Médina Baye'],
    defaultFee: 5000,
    estimatedTime: '24 à 48 heures',
  },
  {
    code: 'KF',
    name: 'Kaffrine',
    capital: 'Kaffrine',
    departments: ['Kaffrine Ville', 'Koungheul', 'Birkelane', 'Malem Hodar'],
    defaultFee: 6000,
    estimatedTime: '48 heures',
  },
  {
    code: 'LG',
    name: 'Louga',
    capital: 'Louga',
    departments: ['Louga Ville', 'Kébémer', 'Linguère', 'Dahra Djoloff'],
    defaultFee: 6000,
    estimatedTime: '48 heures',
  },
  {
    code: 'SL',
    name: 'Saint-Louis',
    capital: 'Saint-Louis',
    departments: ['Saint-Louis Île / Sor', 'Richard-Toll', 'Dagana', 'Podor', 'Ross Béthio'],
    defaultFee: 7000,
    estimatedTime: '48 à 72 heures',
  },
  {
    code: 'MT',
    name: 'Matam',
    capital: 'Matam',
    departments: ['Matam Ville', 'Ourossogui', 'Kanel', 'Ranérou', 'Thilogne'],
    defaultFee: 8000,
    estimatedTime: '48 à 72 heures',
  },
  {
    code: 'TC',
    name: 'Tambacounda',
    capital: 'Tambacounda',
    departments: ['Tambacounda Ville', 'Bakel', 'Goudiry', 'Koumpentoum'],
    defaultFee: 8000,
    estimatedTime: '48 à 72 heures',
  },
  {
    code: 'KD',
    name: 'Kédougou',
    capital: 'Kédougou',
    departments: ['Kédougou Ville', 'Salémata', 'Saraya'],
    defaultFee: 9000,
    estimatedTime: '48 à 72 heures',
  },
  {
    code: 'KL-S',
    name: 'Kolda',
    capital: 'Kolda',
    departments: ['Kolda Ville', 'Vélingara', 'Médina Yoro Foulah'],
    defaultFee: 8000,
    estimatedTime: '48 à 72 heures',
  },
  {
    code: 'SD',
    name: 'Sédhiou',
    capital: 'Sédhiou',
    departments: ['Sédhiou Ville', 'Bounkiling', 'Goudomp', 'Marsassoum'],
    defaultFee: 8000,
    estimatedTime: '48 à 72 heures',
  },
  {
    code: 'ZG',
    name: 'Ziguinchor',
    capital: 'Ziguinchor',
    departments: ['Ziguinchor Ville', 'Bignona', 'Oussouye', 'Cap Skirring', 'Kafountine'],
    defaultFee: 8000,
    estimatedTime: '48 à 72 heures',
  },
];

// Helper functions for dynamic pricing and display
export function getAllLocalZones(settings?: AppSettings): DeliveryZone[] {
  const custom = settings?.customNeighborhoods || [];
  return [...SENEGAL_DELIVERY_ZONES, ...custom];
}

export function getAllDistanceZones(settings?: AppSettings): DeliveryZone[] {
  const custom = settings?.customLocations || [];
  return [...DISTANCE_DELIVERY_ZONES, ...custom];
}

export function getEffectiveDistanceZoneFee(zone: DeliveryZone, settings?: AppSettings): number {
  if (!settings) return zone.fee;
  if (settings.customRegionFees && settings.customRegionFees[zone.id] !== undefined) {
    return Number(settings.customRegionFees[zone.id]);
  }
  if (settings.customRegionFees && settings.customRegionFees[zone.region] !== undefined) {
    return Number(settings.customRegionFees[zone.region]);
  }
  if (zone.isCustom && zone.fee !== undefined) {
    return Number(zone.fee);
  }
  if (settings.defaultDistanceFee !== undefined && settings.defaultDistanceFee > 0 && zone.fee === 5000) {
    return Number(settings.defaultDistanceFee);
  }
  return zone.fee;
}

export function getEffectiveLocalZoneFee(zone: DeliveryZone, settings?: AppSettings): number {
  if (!settings) return zone.fee;
  if (settings.customLocalZoneFees && settings.customLocalZoneFees[zone.id] !== undefined) {
    return Number(settings.customLocalZoneFees[zone.id]);
  }
  if (zone.isCustom && zone.fee !== undefined) {
    return Number(zone.fee);
  }
  if (settings.defaultDakarFee !== undefined && !zone.isCustom) {
    return Number(settings.defaultDakarFee);
  }
  return zone.fee;
}

export const DISTANCE_DELIVERY_ZONES: DeliveryZone[] = [
  { 
    id: 'dist-thies', 
    name: 'Région de Thiès (Mbour, Saly, Thiès Ville, Somone, Tivaouane, Joal)', 
    region: 'Thiès', 
    fee: 3000, 
    estimatedTime: '24 heures (Express GP)' 
  },
  { 
    id: 'dist-dakar', 
    name: 'Région de Dakar (Dakar Plateau, Almadies, Pikine, Guédiawaye, Rufisque, Diamniadio)', 
    region: 'Dakar', 
    fee: 5000, 
    estimatedTime: '24 à 48 heures' 
  },
  { 
    id: 'dist-diourbel', 
    name: 'Région de Diourbel (Touba Sainte, Mbacké, Diourbel Ville, Bambey)', 
    region: 'Diourbel', 
    fee: 5000, 
    estimatedTime: '24 à 48 heures' 
  },
  { 
    id: 'dist-fatick', 
    name: 'Région de Fatick (Fatick Ville, Foundiougne, Gossas, Sokone, Passy)', 
    region: 'Fatick', 
    fee: 4000, 
    estimatedTime: '24 à 48 heures' 
  },
  { 
    id: 'dist-kaolack', 
    name: 'Région de Kaolack (Kaolack Ville, Nioro du Rip, Guinguinéo, Médina Baye)', 
    region: 'Kaolack', 
    fee: 5000, 
    estimatedTime: '24 à 48 heures' 
  },
  { 
    id: 'dist-kaffrine', 
    name: 'Région de Kaffrine (Kaffrine Ville, Koungheul, Birkelane, Malem Hodar)', 
    region: 'Kaffrine', 
    fee: 6000, 
    estimatedTime: '48 heures' 
  },
  { 
    id: 'dist-louga', 
    name: 'Région de Louga (Louga Ville, Kébémer, Linguère, Dahra Djoloff)', 
    region: 'Louga', 
    fee: 6000, 
    estimatedTime: '48 heures' 
  },
  { 
    id: 'dist-saint-louis', 
    name: 'Région de Saint-Louis (Saint-Louis Île/Sor, Richard-Toll, Dagana, Podor)', 
    region: 'Saint-Louis', 
    fee: 7000, 
    estimatedTime: '48 à 72 heures' 
  },
  { 
    id: 'dist-matam', 
    name: 'Région de Matam (Matam Ville, Ourossogui, Kanel, Ranérou, Thilogne)', 
    region: 'Matam', 
    fee: 8000, 
    estimatedTime: '48 à 72 heures' 
  },
  { 
    id: 'dist-tambacounda', 
    name: 'Région de Tambacounda (Tambacounda Ville, Bakel, Goudiry, Koumpentoum)', 
    region: 'Tambacounda', 
    fee: 8000, 
    estimatedTime: '48 à 72 heures' 
  },
  { 
    id: 'dist-kedougou', 
    name: 'Région de Kédougou (Kédougou Ville, Salémata, Saraya)', 
    region: 'Kédougou', 
    fee: 9000, 
    estimatedTime: '48 à 72 heures' 
  },
  { 
    id: 'dist-kolda', 
    name: 'Région de Kolda (Kolda Ville, Vélingara, Médina Yoro Foulah)', 
    region: 'Kolda', 
    fee: 8000, 
    estimatedTime: '48 à 72 heures' 
  },
  { 
    id: 'dist-sedhiou', 
    name: 'Région de Sédhiou (Sédhiou Ville, Bounkiling, Goudomp, Marsassoum)', 
    region: 'Sédhiou', 
    fee: 8000, 
    estimatedTime: '48 à 72 heures' 
  },
  { 
    id: 'dist-ziguinchor', 
    name: 'Région de Ziguinchor (Ziguinchor Ville, Bignona, Oussouye, Cap Skirring)', 
    region: 'Ziguinchor', 
    fee: 8000, 
    estimatedTime: '48 à 72 heures' 
  },
];

