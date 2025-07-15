import { lissajousKnot } from "../core/lissajousCurves";
import type { LissajousParams } from "../core/lissajousCurves";

type LissajousOption = {
  label?: string; // optional if you want a tooltip
  value: LissajousParams;
};

type LissajousButtonGroupProps = {
  options: LissajousOption[];
  value: LissajousParams;
  onChange: (val: LissajousParams) => void;
  style?: React.CSSProperties;
};


function LissajousPreview({ params, stroke = 'black' }: { params: LissajousParams; stroke?: string }) {
  const steps = 100;
  const path = Array.from({ length: steps }, (_, i) => {
    const t = (i / (steps - 1)) * 2 * Math.PI;
    const [x, y] = lissajousKnot(t, params);
    return [x, y];
  });

  // Normalize to fit [0, 1] range
  //const [minX, maxX] = [Math.min(...path.map(p => p[0])), Math.max(...path.map(p => p[0]))];
  //const [minY, maxY] = [Math.min(...path.map(p => p[1])), Math.max(...path.map(p => p[1]))];
  const normalized = path.map(([x, y]) => [
    (x + 1) * 50, 
    (-y + 1) * 50, 
  ]);

  const d = normalized.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x},${y}`).join(' ');

  return (
    <svg style={{width: "100px", height: "100px"}} viewBox="-20 -20 140 140">
      <path d={d} fill="none" stroke={stroke} strokeWidth={3} />
      
    </svg>
  );
}

function LissajousSelectButtonGroup({ options, value, onChange, style = {} }: LissajousButtonGroupProps) {
  return (
    <div style={{ 

        gap: 12, 
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        alignItems: "center",
        justifyContent: "center",



        ...style }}>
      {options.map(opt => {
        const selected =
          opt.value.a === value.a &&
          opt.value.b === value.b &&
          opt.value.c === value.c &&
          opt.value.a_delta === value.a_delta &&
          opt.value.b_delta === value.b_delta &&
          opt.value.c_delta === value.c_delta;
        return (
          <div
            key={JSON.stringify(opt.value)}
            onClick={() => onChange(opt.value)}
            style={{
              border: selected ? '2px solid var(--gray8)' : '2px solid var(--gray4)',
              borderRadius: 4,
              boxSizing: 'content-box',

              backgroundColor: selected ? 'var(--gray4)' : 'var(--gray2)',
              cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

            }}
            title={opt.label ?? ''}
          >
            <LissajousPreview params={opt.value} stroke={selected ? 'var(--gray8)' : 'var(--gray6)'} />
          </div>
        );
      })}
    </div>
  );
}



export default LissajousSelectButtonGroup;