// Cubic Bézier coordinate functions
// Control points: (x0, y0), (x1, y1), (x2, y2), (x3, y3)
// Parameter t ∈ [0,1]

export function cubicBezierPointX(
  x0: number, x1: number, x2: number, x3: number, t: number
): number {
  const u = 1 - t;
  return (
    u * u * u * x0 +
    3 * u * u * t * x1 +
    3 * u * t * t * x2 +
    t * t * t * x3
  );
}

export function cubicBezierPointY(
  y0: number, y1: number, y2: number, y3: number, t: number
): number {
  const u = 1 - t;
  return (
    u * u * u * y0 +
    3 * u * u * t * y1 +
    3 * u * t * t * y2 +
    t * t * t * y3
  );
}
