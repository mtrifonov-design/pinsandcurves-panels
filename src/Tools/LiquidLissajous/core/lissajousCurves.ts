const LISSAJOUS_CURVES : LissajousParams[] = [
    {
        a: 1,
        b: 1,
        c: 1,
        a_delta: 0,
        b_delta: 0.8,
        c_delta: 0.6
    },
    {
        a: 1,
        b: 2,
        c: 1,
        a_delta: 0.6,
        b_delta: 0.4,
        c_delta: 1.0
    },
    {
        a: 1,
        b: 3,
        c: 1,
        a_delta: 0.6,
        b_delta: 1.0,
        c_delta: 0.2
    },
    {
        a: 2,
        b: 3,
        c: 1,
        a_delta: 0.4,
        b_delta: 1.0,
        c_delta: 0.4
    },
    {
        a: 5,
        b: 3,
        c: 1,
        a_delta: 0.4,
        b_delta: 0.4,
        c_delta: 0.2
    },
    {
        a: 5,
        b: 7,
        c: 1,
        a_delta: 0.4,
        b_delta: 0.8,
        c_delta: 0.8
    }

];

function lissajousKnot(t: number, params: {
        a: number, a_delta: number,
        b: number, b_delta: number,
        c: number, c_delta: number
    }) {
        const x = Math.cos(params.a * t + params.a_delta);
        const y = Math.cos(params.b * t + params.b_delta);
        const z = Math.cos(params.c * t + params.c_delta);
        return [x, y, z]
    }

    type LissajousParams = {
  a: number, a_delta: number,
  b: number, b_delta: number,
  c: number, c_delta: number,
    integral: number; // Optional, for storing the integral value
};


function integrateLissajousKnot(
  params: LissajousParams,
  steps: number = 1000,
): number {
    const values = [];
    for (let i = 0; i < steps; i++) {
        const t = (i / (steps - 1)) * 2 * Math.PI;
        const [x, y, z] = lissajousKnot(t, params);
        values.push([x, y, z]);
    }
    let integral = 0;
    for (let i = 1; i < values.length - 1; i++) {
        const [x0, y0, z0] = values[i - 1];
        const [x1, y1, z1] = values[i];
        const length = Math.sqrt(
            (x1 - x0) ** 2 + (y1 - y0) ** 2 + (z1 - z0) ** 2
        );
        integral += length;
    }
    return integral;
}

for (const curve of LISSAJOUS_CURVES) {
    curve.integral = integrateLissajousKnot(curve);
}

const LISSAJOUS_CURVES_MAX_INTEGRAL = Math.max(...LISSAJOUS_CURVES.map(c => c.integral || 0));

export { LISSAJOUS_CURVES, lissajousKnot, LISSAJOUS_CURVES_MAX_INTEGRAL };
export type { LissajousParams };