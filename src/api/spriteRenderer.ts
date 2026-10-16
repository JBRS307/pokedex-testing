export type Point = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Face = {
  faceID: number;
  view: Rect;
  camera: Rect;
  rollAngle: number | null;
};

export const SPRITE_SCALE = 0.75;
export const FOREHEAD_OFFSET = 0.4;
export const ROLL_BASELINE = 270;

export const ROLL_QUARTER_TURN = 90;

export function spriteRotation({ rollAngle }: Face, mirrored: boolean): number {
  if (rollAngle == null) return 0;
  const degrees = mirrored ? -(rollAngle + ROLL_QUARTER_TURN) : rollAngle + ROLL_QUARTER_TURN;
  return ((((degrees + 180) % 360) + 360) % 360) - 180;
}

export function foreheadPoint(box: Rect, rotation: number): Point {
  const rad = (rotation * Math.PI) / 180;
  const distance = Math.min(box.width, box.height) * FOREHEAD_OFFSET;

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  return {
    x: centerX + distance * Math.sin(rad),
    y: centerY - distance * Math.cos(rad),
  };
}

export function centeredRect({ x, y }: Point, width: number, height: number): Rect {
  return {
    x: x - width / 2,
    y: y - height / 2,
    width,
    height,
  };
}

export function remapNormalized(r: Rect): Rect {
  return { x: 1 - r.y - r.height, y: r.x, width: r.height, height: r.width };
}

/**
 * Scales a normalized (`0..1`) camera-space rect into pixels. Placement math must run
 * on the result, not before it - a square in normalized units is not square in pixels.
 */
export function toPixels(r: Rect, width: number, height: number): Rect {
  return {
    x: r.x * width,
    y: r.y * height,
    width: r.width * width,
    height: r.height * height,
  };
}

/**
 * Sprite size as a fraction of the frame width. Derived from camera space in both paths
 * so the preview matches the capture - the preview is aspect-fill and therefore shows a
 * narrower field of view than the photo, so its own view-space face width is larger.
 */
export function spriteSize(box: Rect): number {
  return box.width * SPRITE_SCALE;
}

export function mirrorX(r: Rect): Rect {
  return {
    ...r,
    x: 1 - r.x - r.width,
  };
}
