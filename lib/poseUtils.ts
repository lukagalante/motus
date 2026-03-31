export interface Point {
  x: number;
  y: number;
  visibility?: number;
}

export function velocity(prev: Point, curr: Point): number {
  const dx = curr.x - prev.x;
  const dy = curr.y - prev.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function velocityY(prev: Point, curr: Point): number {
  return curr.y - prev.y;
}

export function angleBetween(a: Point, b: Point, c: Point): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
  const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
  if (magAB === 0 || magCB === 0) return 0;
  const cosTheta = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  return Math.acos(cosTheta) * (180 / Math.PI);
}

export function midpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function averageY(points: Point[]): number {
  if (points.length === 0) return 0;
  return points.reduce((sum, p) => sum + p.y, 0) / points.length;
}
