import { productTypeSeedData } from './data/productTypes';

describe('Product Type Seed Data', () => {
  it('should contain exactly 6 product types', () => {
    expect(productTypeSeedData).toHaveLength(6);
  });

  it('should have unique slugs', () => {
    const slugs = productTypeSeedData.map((pt) => pt.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('should have unique sort orders', () => {
    const sortOrders = productTypeSeedData.map((pt) => pt.sortOrder);
    expect(new Set(sortOrders).size).toBe(sortOrders.length);
  });

  it('should have sequential sort orders starting from 1', () => {
    const sortOrders = productTypeSeedData.map((pt) => pt.sortOrder).sort((a, b) => a - b);
    expect(sortOrders).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should have valid slugs (lowercase, alphanumeric with hyphens)', () => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    for (const pt of productTypeSeedData) {
      expect(pt.slug).toMatch(slugRegex);
    }
  });

  it('should have both es and en translations for every product type', () => {
    for (const pt of productTypeSeedData) {
      expect(pt.name.es).toBeTruthy();
      expect(pt.name.en).toBeTruthy();
    }
  });

  it('should include expected product types from business requirements', () => {
    const slugs = productTypeSeedData.map((pt) => pt.slug);
    expect(slugs).toContain('t-shirt');
    expect(slugs).toContain('hoodie');
    expect(slugs).toContain('mug');
    expect(slugs).toContain('pillow');
    expect(slugs).toContain('phone-case');
    expect(slugs).toContain('trading-card');
  });

  it('should mark t-shirt and hoodie as having sizes', () => {
    const tShirt = productTypeSeedData.find((pt) => pt.slug === 't-shirt');
    const hoodie = productTypeSeedData.find((pt) => pt.slug === 'hoodie');
    expect(tShirt?.hasSizes).toBe(true);
    expect(hoodie?.hasSizes).toBe(true);
  });

  it('should mark non-clothing items as not having sizes', () => {
    const noSizesSlugs = ['mug', 'pillow', 'phone-case', 'trading-card'];
    for (const slug of noSizesSlugs) {
      const pt = productTypeSeedData.find((p) => p.slug === slug);
      expect(pt?.hasSizes).toBe(false);
    }
  });
});
