/**
 * Convert a hex color string (e.g. "#1a2b3c" or "abc") to an [R, G, B] array.
 * @param {string} hex - 3- or 6-digit hex code, with or without the leading '#'.
 * @returns {[number, number, number]} RGB values in the 0-255 range.
 */
export default function hexToRgb(hex) {
    // Strip leading '#' and normalize 3-digit codes → 6-digit
    hex = hex.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    if (hex.length !== 6 || /[^0-9a-f]/i.test(hex)) {
      throw new Error('Invalid hex color');
    }
  
    const num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }
  
  /* Example
  hexToRgb('#3498db'); // → [52, 152, 219]
  hexToRgb('f80');     // → [255, 136, 0]
  */

export function rgbToHex([r, g, b]) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
  