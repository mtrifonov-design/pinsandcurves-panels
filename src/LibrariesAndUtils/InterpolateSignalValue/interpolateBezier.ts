import { brent } from "./brent"
import { cubicBezierPointX, cubicBezierPointY } from "./cubicBezier"

function interpolateBezier(cp0x: number, cp0y: number, cp1x: number, cp1y: number, t: number): number {
    const root = brent((x) => cubicBezierPointX(0, cp0x, cp1x, 1, x) - t, 0, 1, 1e-6, 100);
    return cubicBezierPointY(0, cp0y, cp1y, 1, root);
}

export default interpolateBezier;