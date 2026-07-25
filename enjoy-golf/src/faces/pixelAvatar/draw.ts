/**
 * ピクセル描画プリミティブ
 *
 * 文字グリッド (string[]) に対する mutable な描画ユーティリティ。
 * 楕円・矩形・線・自由ストロークで顔のパーツを描画する。
 */

export type Grid = string[]; // 各行が GRID_SIZE 文字

export function newGrid(size: number, fill = '_'): Grid {
  return Array.from({ length: size }, () => fill.repeat(size));
}

export function setPixel(grid: Grid, x: number, y: number, ch: string): void {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (iy < 0 || iy >= grid.length) return;
  const row = grid[iy];
  if (!row || ix < 0 || ix >= row.length) return;
  grid[iy] = row.substring(0, ix) + ch + row.substring(ix + 1);
}

export function getPixel(grid: Grid, x: number, y: number): string {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (iy < 0 || iy >= grid.length) return '_';
  const row = grid[iy];
  if (!row || ix < 0 || ix >= row.length) return '_';
  return row[ix];
}

export function fillRect(grid: Grid, x: number, y: number, w: number, h: number, ch: string): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(grid, x + dx, y + dy, ch);
    }
  }
}

/** 中心 (cx, cy) 半径 (rx, ry) の塗りつぶし楕円 */
export function fillEllipse(grid: Grid, cx: number, cy: number, rx: number, ry: number, ch: string): void {
  const x0 = Math.floor(cx - rx);
  const x1 = Math.ceil(cx + rx);
  const y0 = Math.floor(cy - ry);
  const y1 = Math.ceil(cy + ry);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const ndx = (x + 0.5 - cx) / rx;
      const ndy = (y + 0.5 - cy) / ry;
      if (ndx * ndx + ndy * ndy <= 1) {
        setPixel(grid, x, y, ch);
      }
    }
  }
}

/** 楕円のアウトラインのみ */
export function strokeEllipse(grid: Grid, cx: number, cy: number, rx: number, ry: number, ch: string): void {
  const x0 = Math.floor(cx - rx);
  const x1 = Math.ceil(cx + rx);
  const y0 = Math.floor(cy - ry);
  const y1 = Math.ceil(cy + ry);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const ndx = (x + 0.5 - cx) / rx;
      const ndy = (y + 0.5 - cy) / ry;
      const r = ndx * ndx + ndy * ndy;
      if (r <= 1 && r >= 0.7) {
        setPixel(grid, x, y, ch);
      }
    }
  }
}

/** Bresenham の直線 */
export function strokeLine(grid: Grid, x1: number, y1: number, x2: number, y2: number, ch: string): void {
  const dx = Math.abs(x2 - x1);
  const sx = x1 < x2 ? 1 : -1;
  const dy = -Math.abs(y2 - y1);
  const sy = y1 < y2 ? 1 : -1;
  let err = dx + dy;
  let x = x1;
  let y = y1;
  while (true) {
    setPixel(grid, x, y, ch);
    if (x === x2 && y === y2) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

/** 矩形の枠線のみ */
export function strokeRect(grid: Grid, x: number, y: number, w: number, h: number, ch: string): void {
  for (let dx = 0; dx < w; dx++) {
    setPixel(grid, x + dx, y, ch);
    setPixel(grid, x + dx, y + h - 1, ch);
  }
  for (let dy = 0; dy < h; dy++) {
    setPixel(grid, x, y + dy, ch);
    setPixel(grid, x + w - 1, y + dy, ch);
  }
}

/** 既存 grid の一部分を別 char に塗り替え（指定 char に一致するセルのみ） */
export function recolor(grid: Grid, fromCh: string, toCh: string, area?: { x: number; y: number; w: number; h: number }): void {
  const x0 = area?.x ?? 0;
  const y0 = area?.y ?? 0;
  const x1 = (area?.x ?? 0) + (area?.w ?? grid.length);
  const y1 = (area?.y ?? 0) + (area?.h ?? grid.length);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      if (getPixel(grid, x, y) === fromCh) {
        setPixel(grid, x, y, toCh);
      }
    }
  }
}

/** クローン */
export function cloneGrid(grid: Grid): Grid {
  return [...grid];
}

/** overlay (sparse, '.' は no-op) を base にマージ */
export function applyOverlayGrid(base: Grid, overlay: Grid): Grid {
  const result = [...base];
  for (let y = 0; y < overlay.length && y < result.length; y++) {
    const ovr = overlay[y];
    if (!ovr) continue;
    let row = result[y];
    let newRow = '';
    for (let x = 0; x < row.length; x++) {
      const oc = ovr[x] ?? '.';
      newRow += oc === '.' ? row[x] : oc;
    }
    result[y] = newRow;
  }
  return result;
}

/** hair (透過 '_' は base 保持) を base にマージ */
export function applyHairGrid(base: Grid, hair: Grid): Grid {
  const result = [...base];
  for (let y = 0; y < hair.length && y < result.length; y++) {
    const hr = hair[y];
    if (!hr) continue;
    let row = result[y];
    let newRow = '';
    for (let x = 0; x < row.length; x++) {
      const hc = hr[x] ?? '_';
      newRow += hc === '_' ? row[x] : hc;
    }
    result[y] = newRow;
  }
  return result;
}
