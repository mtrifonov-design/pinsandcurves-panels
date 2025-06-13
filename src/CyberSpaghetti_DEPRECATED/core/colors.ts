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
