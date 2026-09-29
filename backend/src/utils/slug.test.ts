import { describe, it, expect } from 'vitest';
import { generateSlug, generateUniqueSlug } from './slug';

describe('Slug Generator', () => {
  describe('generateSlug', () => {
    it('should convert to lowercase', () => {
      expect(generateSlug('ACME Corp')).toBe('acme-corp');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('My Organization')).toBe('my-organization');
    });

    it('should replace underscores with hyphens', () => {
      expect(generateSlug('my_organization')).toBe('my-organization');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Acme @ Corp!')).toBe('acme-corp');
    });

    it('should collapse multiple hyphens', () => {
      expect(generateSlug('My   Organization')).toBe('my-organization');
      expect(generateSlug('My___Organization')).toBe('my-organization');
      expect(generateSlug('My---Organization')).toBe('my-organization');
    });

    it('should trim leading and trailing hyphens', () => {
      expect(generateSlug('-My Organization-')).toBe('my-organization');
      expect(generateSlug('  My Organization  ')).toBe('my-organization');
    });

    it('should handle empty string', () => {
      expect(generateSlug('')).toBe('');
    });

    it('should handle string with only special characters', () => {
      expect(generateSlug('!@#$%')).toBe('');
    });

    it('should preserve numbers', () => {
      expect(generateSlug('Org 123')).toBe('org-123');
    });

    it('should handle unicode', () => {
      expect(generateSlug('Café Résumé')).toBe('café-résumé');
    });
  });

  describe('generateUniqueSlug', () => {
    it('should append random suffix', () => {
      const slug = generateUniqueSlug('My Org');
      expect(slug).toMatch(/^my-org-[a-z0-9]{4}$/);
    });

    it('should generate different suffixes on each call', () => {
      const slug1 = generateUniqueSlug('My Org');
      const slug2 = generateUniqueSlug('My Org');

      expect(slug1).not.toBe(slug2);
      expect(slug1).toMatch(/^my-org-[a-z0-9]{4}$/);
      expect(slug2).toMatch(/^my-org-[a-z0-9]{4}$/);
    });

    it('should use base slug from generateSlug', () => {
      const slug = generateUniqueSlug('My @ Org!');
      expect(slug).toMatch(/^my-org-[a-z0-9]{4}$/);
    });
  });
});