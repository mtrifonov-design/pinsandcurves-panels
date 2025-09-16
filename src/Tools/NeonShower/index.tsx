import { NumberInput, Button, Icon, CollapsibleSection } from '@mtrifonov-design/pinsandcurves-design';
import React, { useState, useSyncExternalStore, useEffect, useRef, useCallback } from 'react';
import { GradientPicker } from '@mtrifonov-design/pinsandcurves-design';
import { throttle } from 'lodash';
import Main from './graphics/main.js';
import FeedbackBox from '../../LibrariesAndUtils/FeedbackBox/FeedbackBox.js';
import defaultControls from './CyberSpaghettiControls.js';
import renderStateReducer from './renderStateReducer.js';
import EffectFoundation, { useEffectFoundation } from '../../LibrariesAndUtils/EffectFoundation/index.js';
import { exportResources } from '../../LibrariesAndUtils/NectarGL/Builder/index.js';
import { JSONAssetCreator } from '../../LibrariesAndUtils/JSONAsset/Provider.js';


function PresetButton({ text, presetConfig, update, updateLoop }: { text: string; presetConfig: ReturnType<Controls['getSnapshot']> }) {
  return <div style={{
    padding: "1rem 1rem",
    backgroundColor: "var(--gray1)",
    border: "2px solid var(--gray4)",
    color: "var(--gray7)",
    borderRadius: "var(--borderRadiusSmall)",
    cursor: "pointer",
    display: "inline-block",
    margin: "0.25rem 0",
    transition: "background-color 0.2s, color 0.2s",
  }}
    onClick={() => { update(presetConfig); updateLoop?.(presetConfig.rayLife, presetConfig.numCycles, presetConfig.includeFadeInOut) }}
  >
    {text}
  </div>

}


const baggageString = "a".repeat(1000000);

export function CyberSpaghettiControlsInterior() {
  type NewControls = ReturnType<any>;
  const {
    controls,
    graphics,
    index,
    local,
    timeline,
    composition,
    updateControls,
    updateGraphics,
    updateLocal,
    updateComposition
  } = useEffectFoundation();
  const state = local;
  //console.log(timeline);
  //console.log(JSON.stringify(state.colorStops[1].position, null, 2))
  useEffect(() => {
    const project = timeline.project;
    const focusRange = project.timelineData.focusRange;
    if (focusRange[1] !== 300) {
      timeline.projectTools.updateFocusRange([0, 300], true);
    }
  }, [timeline])

  const dimensionsRef = useRef([-1, -1]);




  const updateCb = useCallback(throttle((state, patch: Partial<NewControls>, composition) => {
    let nextLocal = { ...state, ...patch };

    //console.log("origin!", nextLocal.colorStops[1].position, null, 2);
    updateLocal(nextLocal);
    const nextControls = renderStateReducer(nextLocal);

    if (nextLocal.canvasWidth !== dimensionsRef.current[0] || nextLocal.canvasHeight !== dimensionsRef.current[1]) {
      dimensionsRef.current = [nextLocal.canvasWidth, nextLocal.canvasHeight];
      updateComposition({ ...composition, canvasDimensions: [nextLocal.canvasWidth, nextLocal.canvasHeight] });
    }

    //console.log(JSON.stringify(nextControls).length);
    //console.log(JSON.stringify(nextLocal).length);
    updateControls(nextControls);
  }, 50), []);

  const update = (patch: Partial<NewControls>) => {
    updateCb(state, patch, composition);
  };


  const determineFocusRange = (rayLife, numCycles, includeFadeInOut) => {
    const cycles = numCycles === 1 ? 2 : numCycles + 2;
    const c = cycles * rayLife;
    if (includeFadeInOut || numCycles === 1) {
      return [0, c];
    } else {
      return [rayLife, c - rayLife];
    }
  }

  const updateLoop = (rayLife, numCycles, includeFadeInOut?) => {
    //console.log("Updating loop with rayLife:", rayLife, "numCycles:", numCycles, "includeFadeInOut:", includeFadeInOut, "timeline:", timeline);
    timeline?.projectTools.updateFocusRange(determineFocusRange(rayLife, numCycles, includeFadeInOut !== undefined ? includeFadeInOut : state.includeFadeInOut), true);
    if (numCycles === 1) {
      update({
        includeFadeInOut: true,
      })
    }
  }

  // Shared styles
  const labelRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    marginBottom: 2,
  };
  const groupedRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // <-- add this for right-justified pairs
    gap: '0.75rem',
    marginBottom: 2,
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
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h2 style={{ color: 'var(--gray7)', fontWeight: "normal" }}>
          Neon Shower (Beta)
        </h2>
        v.0.0.0
      </div>

      <hr />
      Customize to your liking below.
      <CollapsibleSection iconName="grid_guides" title="Composition" defaultOpen={true}>
        <div style={groupedRowStyle}>
          <span>Canvas Size</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NumberInput initialValue={state.canvasWidth} min={0} max={3840} step={10} onCommit={v => update({ canvasWidth: v })} />
            <span style={{ margin: '0 0.5rem' }}>x</span>
            <NumberInput initialValue={state.canvasHeight} min={0} max={3840} step={10} onCommit={v => update({ canvasHeight: v })} />
          </div>
        </div>
      </CollapsibleSection>
      {/* --- Rays - Appearance --- */}
      <CollapsibleSection iconName="shower" title="Showerhead" defaultOpen={true}>
        <span style={{ display: 'block', marginBottom: 4, color: 'var(--gray6)', fontWeight: 500 }}>Colors</span>
        <div style={{
          paddingLeft: '1rem',
          paddingRight: '1rem',
          paddingBottom: '1.5rem',
        }}>
          <GradientPicker
            stops={state.colorStops}
            onChange={(colors) => {
              update({ colorStops: colors });
            }}
            style={{
              width: '100%',
              height: '200px',
            }}
          />
        </div>
        <div style={labelRowStyle}>
          <span>Pressure</span>
          <NumberInput initialValue={state.pressure} min={0} max={1} step={0.01} 
          onChange={v => update({ pressure: v, showUI: 1 })}
          onCommit={v => update({ pressure: v, showUI: 0 })}
          />
        </div>
        <div style={labelRowStyle}>
          <span>Temperature</span>
          <NumberInput initialValue={state.temperature} min={0} max={1} step={0.01} 
          onChange={v => update({ temperature: v, showUI: 1 })} 
          onCommit={v => update({ temperature: v, showUI: 0 })}
          />
        </div>
        <div style={groupedRowStyle}>
          <span>Position</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ margin: '0 0.5rem' }}>x</span>
            <NumberInput initialValue={state.centerX} min={0} max={1} step={0.01} onChange={v => update({ centerX: v, showUI: 1 })}
              onCommit={v => update({ centerX: v, showUI: 0 })}
            />
            <span style={{ margin: '0 0.5rem' }}>y</span>
            <NumberInput initialValue={state.centerY} min={0} max={1} step={0.01} onChange={v => update({ centerY: v, showUI: 1 })}
              onCommit={v => update({ centerY: v, showUI: 0 })}
            />
            <span style={{ margin: '0 0.5rem' }}>z</span>
            <NumberInput initialValue={state.centerZ} min={0} max={1} step={0.01} onChange={v => update({ centerZ: v, showUI: 1 })}
              onCommit={v => update({ centerZ: v, showUI: 0 })}
            />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Give Feedback" iconName="favorite">
        <div style={{ marginBottom: "1rem", color: "var(--gray6)" }}>

          <FeedbackBox preamble="[FEEDBACK FROM NEONSHOWER] " />

        </div>
      </CollapsibleSection>
    </div>
  );
}


interface SingleSelectOption<T> {
  label: string;
  value: T;
}

interface SingleSelectButtonGroupProps<T> {
  options: SingleSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: React.CSSProperties;
}

function SingleSelectButtonGroup<T extends string | number>({ options, value, onChange, style = {} }: SingleSelectButtonGroupProps<T>) {
  return (
    <div style={{ display: 'flex', gap: 8, ...style }}>
      {options.map(opt => (
        <div key={opt.value} style={{
        }}>
          <Button
            text={opt.label}
            onClick={() => onChange(opt.value)}
            bgColor={value === opt.value ? 'var(--gray4)' : 'var(--gray2)'}
            color={value === opt.value ? 'var(--gray8)' : 'var(--gray6)'}
          />
        </div>
      ))}
    </div>
  );
}

export default function CyberSpaghettiControls() {

  const [loadedImage, setLoadedImage] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = `/pinsandcurves-panels/neonshower/showerhead.png`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL();
      setLoadedImage(dataUrl);
    };
  }, []);

  return <EffectFoundation
    defaultControls={renderStateReducer(defaultControls)}
    defaultGraphics={exportResources(Main())}
    defaultLocal={defaultControls}
    effectInstanceName='NeonShowerV0'
  >
    <>
      <CyberSpaghettiControlsInterior />
      {loadedImage && <JSONAssetCreator
        defaultName="showerhead.png"
        defaultData={loadedImage}
        defaultType={"png"}
      ><></></JSONAssetCreator>}
    </>
  </EffectFoundation>;
}