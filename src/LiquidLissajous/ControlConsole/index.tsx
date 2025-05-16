import { NumberInput, Button, Icon } from '@mtrifonov-design/pinsandcurves-design';
import React, { useState, useSyncExternalStore } from 'react';
import { AssetProvider } from '../../AssetManager/context/AssetProvider';
import ControlsProvider, { useControls } from './ControlProvider';
import FullscreenLoader from '../../FullscreenLoader/FullscreenLoader';
import hexToRgb, {rgbToHex} from '../core/hexToRgb';

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
    const colors = state.particleColors.slice();
    colors[idx] = hexToRgb(value);
    update({ particleColors: colors });
  };

  const addColor    = () => update({ rayColors: [...state.particleColors, [255,255,255]] });
  const removeColor = idx => {
    if (state.particleColors.length === 1) return;      // must keep ≥1 colour
    update({ rayColors: state.particleColors.filter((_, i) => i !== idx) });
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
    

      {/* Global limits */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        color particle count&nbsp;
        <NumberInput
                initialValue={state.particleCount}
                min={0}
                max={50}
                step={1}
                onChange={c => update({ particleCount: c })}
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
        <legend>particle colours</legend>
        {state.particleColors.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4,
            justifyContent: 'center',
            borderRadius: "var(--borderRadiusSmall)",
            border: "1px solid var(--gray3)",
            padding: "0.0rem 0.5rem",

           }}>
            <input
              type="color"
              value={rgbToHex(state.particleColors[i])}
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