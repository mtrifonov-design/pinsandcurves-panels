import { NumberInput, Button, Icon } from '@mtrifonov-design/pinsandcurves-design';
import React, { useState, useSyncExternalStore } from 'react';
import { AssetProvider } from '../../AssetManager/context/AssetProvider';
import ControlsProvider, { useControls } from './ControlProvider';
import FullscreenLoader from '../../FullscreenLoader/FullscreenLoader';
import hexToRgb, {rgbToHex} from '../core/hexToRgb';

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
export function CyberSpaghettiControlsInterior({
    controls,
}) {
  const state = useSyncExternalStore(controls.subscribeInternal.bind(controls), controls.getSnapshot.bind(controls));

  /** Helpers to mutate state and notify the parent */
  const update = patch => {
    const next = { ...state, ...patch };
    controls.setData(next);
  };

  const updateColor = (idx, value) => {
    const colors = state.rayColors.slice();
    colors[idx] = hexToRgb(value);
    update({ rayColors: colors });
  };

  const addColor    = () => update({ rayColors: [...state.rayColors, [255,255,255]] });
  const removeColor = idx => {
    if (state.rayColors.length === 1) return;      // must keep ≥1 colour
    update({ rayColors: state.rayColors.filter((_, i) => i !== idx) });
  };

  const setBackgroundColor = value => {
    const rgb = hexToRgb(value);
    update({ backgroundColor: rgb });
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
                onChange={c => update({ centerX: c })}
            />
        </label>
        <label>
          Y&nbsp;
          <NumberInput
                min={0}
                max={1080}
                step={5}
                onChange={c => update({ centerY: c })}
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
                value={rgbToHex(state.backgroundColor)}
                onChange={e => setBackgroundColor(e.target.value)}
                onBlur={e => setBackgroundColor(e.target.value)}
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
                onChange={c => update({ maxRays: c })}
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
              value={rgbToHex(state.rayColors[i])}
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
                max={5}
                step={0.1}
                onChange={c => update({ averageThickness: c })}
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
                max={5}
                step={0.1}
                onChange={c => update({ thicknessVariance: c })}
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
                onChange={c => update({ lifespan: c })}
        />
      </label>
    </div>
  );
}

function CyberSpaghettiExterior() {
    const controls = useControls();

    const ready = controls;
    if (!ready) {
        return <FullscreenLoader />
    }

    return <CyberSpaghettiControlsInterior controls={controls} />
}


export default function CyberSpaghettiControls() {


    return <AssetProvider>
            <ControlsProvider>
                <CyberSpaghettiExterior />
            </ControlsProvider>
    </AssetProvider>;
}