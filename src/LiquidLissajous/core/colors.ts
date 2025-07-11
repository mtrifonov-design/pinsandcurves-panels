// original palette, but pre-linearised once so
// RaySystem needn’t call Math.pow every frame
const powVal = 1.5;
const src = [
    [219,204,242,  43,188,184],
    [ 32, 42,132,  43,188,184],
    [255,255,255, 255,  0,  0],
    [255,255,255,   0,255,  0],
    [255,255,255,   0,  0,255],
];
export const colorsLinear = src.map(c => ({
    colA:[c[0],c[1],c[2]].map(v=>Math.pow(v/255,powVal)),
    colB:[c[3],c[4],c[5]].map(v=>Math.pow(v/255,powVal)),
}));

export const colorConvert = (c) => {
    // convert from 0-255 to 0-1
    const r = c[0] / 255;
    const g = c[1] / 255;
    const b = c[2] / 255;
    // convert to linear space
    return [Math.pow(r, powVal), Math.pow(g, powVal), Math.pow(b, powVal)];
}


// Interpolate PARTICLE_COUNT color stops in HSL (hue) space
export function rgbToHsl([r, g, b]: number[]): [number, number, number] {
    r = Math.max(0, Math.min(1, r));
    g = Math.max(0, Math.min(1, g));
    b = Math.max(0, Math.min(1, b));
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}
export function hslToRgb([h, s, l]: [number, number, number]): [number, number, number] {
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r, g, b];
}