import { describe, expect, it } from "vitest";
import {
  clamp01,
  isValidRegion,
  MIN_REGION_FRACTION,
  regionFromPoints,
} from "@/lib/cleanup/region";

describe("clamp01", () => {
  it("clamps below 0 up to 0", () => {
    expect(clamp01(-0.5)).toBe(0);
  });

  it("clamps above 1 down to 1", () => {
    expect(clamp01(1.5)).toBe(1);
  });

  it("leaves in-range values untouched", () => {
    expect(clamp01(0.42)).toBe(0.42);
  });
});

describe("isValidRegion", () => {
  it("accepts a normal, well-formed region", () => {
    expect(isValidRegion({ x: 0.1, y: 0.1, width: 0.3, height: 0.2 })).toBe(
      true,
    );
  });

  it("accepts a region touching the far edge exactly", () => {
    expect(isValidRegion({ x: 0.5, y: 0.5, width: 0.5, height: 0.5 })).toBe(
      true,
    );
  });

  it("rejects a region that overflows the right edge", () => {
    expect(isValidRegion({ x: 0.8, y: 0.1, width: 0.3, height: 0.2 })).toBe(
      false,
    );
  });

  it("rejects a region that overflows the bottom edge", () => {
    expect(isValidRegion({ x: 0.1, y: 0.8, width: 0.2, height: 0.3 })).toBe(
      false,
    );
  });

  it("rejects a negative-origin region", () => {
    expect(isValidRegion({ x: -0.1, y: 0.1, width: 0.2, height: 0.2 })).toBe(
      false,
    );
  });

  it("rejects a region smaller than the minimum fraction", () => {
    const tooSmall = MIN_REGION_FRACTION / 2;
    expect(
      isValidRegion({ x: 0.1, y: 0.1, width: tooSmall, height: 0.2 }),
    ).toBe(false);
  });

  it("rejects non-finite values", () => {
    expect(isValidRegion({ x: NaN, y: 0.1, width: 0.2, height: 0.2 })).toBe(
      false,
    );
  });
});

describe("regionFromPoints", () => {
  it("builds a region regardless of drag direction", () => {
    const region = regionFromPoints(0.6, 0.6, 0.2, 0.2);
    expect(region.x).toBeCloseTo(0.2);
    expect(region.y).toBeCloseTo(0.2);
    expect(region.width).toBeCloseTo(0.4);
    expect(region.height).toBeCloseTo(0.4);
  });

  it("clamps out-of-bounds drag points into the 0..1 image bounds", () => {
    expect(regionFromPoints(-0.2, -0.2, 1.4, 1.4)).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });
});
