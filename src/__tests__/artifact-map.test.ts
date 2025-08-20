import { describe, it, expect } from 'vitest';
import { pathFor, pathForPixel, Point } from '../components/artifact/ArtifactArrow';
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

    it('should calculate correct position for 300 degrees (Safety node)', () => {
      const result = polarToCartesian(100, 100, 50, 300);
      expect(result.x).toBeCloseTo(56.7, 1);
      expect(result.y).toBeCloseTo(75, 1);
    });

    it('should calculate correct position for 30 degrees (Clarity node)', () => {
      const result = polarToCartesian(100, 100, 50, 30);
      expect(result.x).toBeCloseTo(125, 1);
      expect(result.y).toBeCloseTo(56.7, 1);
    });
  });

  describe('pathFor', () => {
    const center: Point = { x: 100, y: 100 };
    const from: Point = { x: 50, y: 50 };
    const to: Point = { x: 150, y: 150 };

    it('should generate a valid SVG path string', () => {
      const path = pathFor(from, to, center);
      expect(path).toMatch(/^M \d+\.?\d*,\d+\.?\d* C \d+\.?\d*,\d+\.?\d* \d+\.?\d*,\d+\.?\d* \d+\.?\d*,\d+\.?\d*$/);
    });

    it('should start with M command and from coordinates', () => {
      const path = pathFor(from, to, center);
      expect(path.startsWith(`M ${from.x},${from.y}`)).toBe(true);
    });

    it('should end with to coordinates', () => {
      const path = pathFor(from, to, center);
      expect(path.endsWith(`${to.x},${to.y}`)).toBe(true);
    });

    it('should contain C command for cubic bezier curve', () => {
      const path = pathFor(from, to, center);
      expect(path).toContain(' C ');
    });

    it('should generate different paths for different inputs', () => {
      const path1 = pathFor(from, to, center);
      const path2 = pathFor(to, from, center);
      expect(path1).not.toBe(path2);
    });

    it('should produce consistent output for same inputs', () => {
      const path1 = pathFor(from, to, center);
      const path2 = pathFor(from, to, center);
      expect(path1).toBe(path2);
    });

    it('should curve away from center', () => {
      // Test with a horizontal line that should curve away from center
      const horizontalFrom: Point = { x: 60, y: 100 };
      const horizontalTo: Point = { x: 140, y: 100 };
      const pathData = pathFor(horizontalFrom, horizontalTo, center);
      
      // Extract the control points from the path
      const matches = pathData.match(/C ([\d.]+),([\d.]+) ([\d.]+),([\d.]+)/);
      expect(matches).toBeTruthy();
      
      if (matches) {
        const c1y = parseFloat(matches[2]);
        const c2y = parseFloat(matches[4]);
        
        // Control points should be either both above or both below the center line
        // to create an arc that curves away from center
        expect(Math.abs(c1y - 100)).toBeGreaterThan(5);
        expect(Math.abs(c2y - 100)).toBeGreaterThan(5);
      }
    });
  });

  describe('pathForPixel', () => {
    const center: Point = { x: 100, y: 100 };
    const from: Point = { x: 50, y: 50 };
    const to: Point = { x: 150, y: 150 };

    it('returns at least 3 points and only orthogonal segments', () => {
      const pts = pathForPixel(from, to, center);
      expect(pts.length).toBeGreaterThanOrEqual(3);

      for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        const dy = pts[i].y - pts[i - 1].y;
        expect(dx === 0 || dy === 0).toBe(true);
      }
    });

    it('bows away from center compared to straight midpoint', () => {
      const pts = pathForPixel(from, to, center, 6, 12);
      // Approximate midpoint of the polyline: pick the midpoint of the middle segment
      const midIndex = Math.floor((pts.length - 1) / 2);
      const midA = pts[midIndex];
      const midB = pts[midIndex + 1] ?? pts[midIndex];
      const polyMid = { x: (midA.x + midB.x) / 2, y: (midA.y + midB.y) / 2 };

      const straightMid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      const d2 = (p: Point) => (p.x - center.x) ** 2 + (p.y - center.y) ** 2;

      expect(d2(polyMid)).toBeGreaterThan(d2(straightMid));
    });
  });
});
