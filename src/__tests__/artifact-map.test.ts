import { describe, it, expect } from 'vitest';
import { polarToCartesian } from '../components/artifact/ArtifactMap';

describe('Artifact Map Functions', () => {
  describe('polarToCartesian', () => {
    it('should calculate correct position for 0 degrees (top)', () => {
      const result = polarToCartesian(100, 100, 50, 0);
      expect(result.x).toBeCloseTo(100, 1);
      expect(result.y).toBeCloseTo(50, 1);
    });

    it('should calculate correct position for 90 degrees (right)', () => {
      const result = polarToCartesian(100, 100, 50, 90);
      expect(result.x).toBeCloseTo(150, 1);
      expect(result.y).toBeCloseTo(100, 1);
    });

    it('should calculate correct position for 180 degrees (bottom)', () => {
      const result = polarToCartesian(100, 100, 50, 180);
      expect(result.x).toBeCloseTo(100, 1);
      expect(result.y).toBeCloseTo(150, 1);
    });

    it('should calculate correct position for 270 degrees (left)', () => {
      const result = polarToCartesian(100, 100, 50, 270);
      expect(result.x).toBeCloseTo(50, 1);
      expect(result.y).toBeCloseTo(100, 1);
    });

    it('should calculate correct position for 300 degrees', () => {
      const result = polarToCartesian(100, 100, 50, 300);
      expect(result.x).toBeCloseTo(56.7, 1);
      expect(result.y).toBeCloseTo(75, 1);
    });

    it('should calculate correct position for 30 degrees', () => {
      const result = polarToCartesian(100, 100, 50, 30);
      expect(result.x).toBeCloseTo(125, 1);
      expect(result.y).toBeCloseTo(56.7, 1);
    });
  });
});