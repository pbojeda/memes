export interface ProductTypeSeedData {
  name: { es: string; en: string };
  slug: string;
  hasSizes: boolean;
  sortOrder: number;
}

export const productTypeSeedData: ProductTypeSeedData[] = [
  { name: { es: 'Camiseta', en: 'T-Shirt' }, slug: 't-shirt', hasSizes: true, sortOrder: 1 },
  { name: { es: 'Sudadera', en: 'Hoodie' }, slug: 'hoodie', hasSizes: true, sortOrder: 2 },
  { name: { es: 'Taza', en: 'Mug' }, slug: 'mug', hasSizes: false, sortOrder: 3 },
  { name: { es: 'Cojín', en: 'Pillow' }, slug: 'pillow', hasSizes: false, sortOrder: 4 },
  { name: { es: 'Funda de móvil', en: 'Phone Case' }, slug: 'phone-case', hasSizes: false, sortOrder: 5 },
  { name: { es: 'Cromo', en: 'Trading Card' }, slug: 'trading-card', hasSizes: false, sortOrder: 6 },
];
