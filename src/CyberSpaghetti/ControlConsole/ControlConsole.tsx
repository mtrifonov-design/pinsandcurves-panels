import { NumberInput, Button, Icon } from '@mtrifonov-design/pinsandcurves-design';
import React, { useState } from 'react';

/**
 * All the tunables the renderer will need.
 */
const DEFAULT_SETTINGS = {
  centerX: 0,
  centerY: 0,
  backgroundColor: '#000000',
  maxRays: 500,
  rayColors: ['#ffffff'],
  averageThickness: 2,      // degrees
  thicknessVariance: 1,     // degrees
  lifespan: 60              // frames
};

/**
 * Control panel for the “hyperspeed dwarf” ray-field effect.
 *
 * @param {object}   props
 * @param {object=}  props.settings   – initial settings (optional)
 * @param {function} props.onChange   – receives every settings mutation (optional)
 */
export default function HyperspeedControls({
  settings = DEFAULT_SETTINGS,
}) {
  const [state, setState] = useState(settings);

  /** Helpers to mutate state and notify the parent */
  const update = patch => {
    const next = { ...state, ...patch };
    setState(next);
  };

  const updateColor = (idx, value) => {
    const colors = state.rayColors.slice();
    colors[idx] = value;
    update({ rayColors: colors });
  };

  const addColor    = () => update({ rayColors: [...state.rayColors, '#ffffff'] });
  const removeColor = idx => {
    if (state.rayColors.length === 1) return;      // must keep ≥1 colour
    update({ rayColors: state.rayColors.filter((_, i) => i !== idx) });
  };

  return (
    <div className="hyperspeed-controls" 
        style={{ 
            display: 'flex',
            gap: '20px',
            flexDirection: 'column',
            backgroundColor: "var(--gray1)",
            width: '100vw',
            height: '100vh',
            padding: '1rem',
            color: 'var(--gray6)',
            overflow: 'scroll',
            scrollbarColor: 'var(--gray3) var(--gray1)',
         }}
    >
      {/* Centre */}
      <fieldset style={{
        borderColor: 'var(--gray4)',
        borderRadius: 'var(--borderRadiusSmall)',
        display: 'flex',
        flexDirection: 'row',
        gap: '0.5rem',
        justifyContent: 'flex-start',
      }}>
        <legend>center point</legend>
        <label>
          X&nbsp;
          <NumberInput
                min={0}
                max={1920}
                step={5}
            />
        </label>
        <label>
          Y&nbsp;
          <NumberInput
                min={0}
                max={1080}
                step={5}
                onChange={e => update({ centerY: e })}
                onCommit={e => update({ centerY: e })}
            />
        </label>
      </fieldset>

      {/* Background */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        background&nbsp;
        <input
              type="color"
              style={{
                border: "none",
                backgroundColor: "var(--gray3)",
                borderRadius: "var(--borderRadiusSmall)",
                width: "35px",
                height: "35px",
              }}
            />
      </label>

      {/* Global limits */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        max rays&nbsp;
        <NumberInput
                min={0}
                max={1000}
                step={1}
            />

      </label>

      {/* Colours */}
      <fieldset
        style={{
            borderColor: 'var(--gray4)',
            borderRadius: 'var(--borderRadiusSmall)',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '0.5rem',
            alignContent: 'center',
        }}
      >
        <legend>ray colours</legend>
        {state.rayColors.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4,
            justifyContent: 'center',
            borderRadius: "var(--borderRadiusSmall)",
            border: "1px solid var(--gray3)",
            padding: "0.0rem 0.5rem",

           }}>
            <input
              type="color"
              value={c}
              onChange={e => updateColor(i, e.target.value)}
              style={{
                border: "none",
                backgroundColor: "var(--gray3)",
                borderRadius: "var(--borderRadiusSmall)",
                width: "35px",
                height: "35px",
              }}
            />
            <Icon iconName={"delete"} onClick={() => removeColor(i)} />
          </div>
        ))}
        <Button text={"+ add colour"} onClick={addColor} />
      </fieldset>

      {/* Thickness */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        ray average thickness (°)&nbsp;
        <NumberInput
                min={0}
                max={10}
                step={0.1}
            />
      </label>

      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        ray thickness variance (°)&nbsp;
        <NumberInput
                min={0}
                max={10}
                step={0.1}
            />
      </label>


      {/* Lifespan */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        ray lifespan (frames)&nbsp;
        <NumberInput
                min={0}
                max={300}
                step={1}
            />
      </label>
    </div>
  );
}
