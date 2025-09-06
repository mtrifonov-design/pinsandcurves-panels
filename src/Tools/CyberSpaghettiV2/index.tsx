import { NumberInput, Button, Icon, CollapsibleSection } from '@mtrifonov-design/pinsandcurves-design';
import React, { useState, useSyncExternalStore, useEffect } from 'react';
import { AssetProvider } from '../../AssetManager/context/AssetProvider';

import FullscreenLoader from '../../LibrariesAndUtils/FullscreenLoader/FullscreenLoader';
import TimelineProvider from '../../LibrariesAndUtils/TimelineUtils/TimelineProvider';

import hexToRgb, { rgbToHex } from './hexToRgb';
import { useTimeline } from '../../LibrariesAndUtils/TimelineUtils/TimelineProvider';
import { spaghetti, speed_lines, star_field, star_shimmer, warp_speed } from './presets';
import FeedbackBox from '../../LibrariesAndUtils/FeedbackBox/FeedbackBox';

import { useJSONAssets } from '../../LibrariesAndUtils/JSONAsset/Provider.js';
import JSONAssetProvider from '../../LibrariesAndUtils/JSONAsset/Provider.js';
import defaultControls from './CyberSpaghettiControls.js';
import build from '../../LibrariesAndUtils/NectarGL/build.js';
import renderStateReducer from './renderStateReducer.js';


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



export function CyberSpaghettiControlsInterior({
  controls,
}: { controls: any }) {
  type NewControls = ReturnType<any>;
  const state = useSyncExternalStore(
    controls.subscribeInternal.bind(controls),
    controls.getSnapshot.bind(controls)
  )!.uiState as NewControls;

  const externalState = useSyncExternalStore(
    controls.subscribeToExternalState.bind(controls),
    controls.getExternalState.bind(controls)
  );

  const update = (patch: Partial<NewControls>) => {
    const nextUIState = { ...state, ...patch };
    const nextState = { uiState: nextUIState, sourceId: "start", renderState: renderStateReducer(nextUIState) }
    controls.setData(nextState);
  };

  const timeline = useTimeline();

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



  // Color helpers for new rayColors (hex strings)
  const updateColor = (idx: number, value: number[]) => {
    const colors = state.rayColors.slice();
    colors[idx] = value;
    update({ rayColors: colors });
  };
  const addColor = () => update({ rayColors: [...state.rayColors, [255, 255, 255]] });
  const removeColor = (idx: number) => {
    if (state.rayColors.length === 1) return;
    update({ rayColors: state.rayColors.filter((_, i) => i !== idx) });
  };

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
  const colorBoxStyle: React.CSSProperties = {
    backgroundColor: 'var(--gray2)',
    borderRadius: 'var(--borderRadiusSmall)',
    padding: '0.5rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    margin: '0.5rem 0',
    alignItems: 'center',
  };
  const legendStyle: React.CSSProperties = {
    color: 'white',
    fontSize: '1.15rem',
    fontWeight: 600,
    marginBottom: 8,
  };

  // --- Angle helpers ---
  function getArcSpan(start: number, end: number): number {
    // Returns the positive span in [0, 360), assumes start < end
    let span = end - start;
    if (span < 0) span += 360;
    return span;
  }
  function getMidAngle(start: number, end: number): number {
    // Returns the mid angle in [0, 360), assumes start < end
    const span = getArcSpan(start, end);
    let mid = (start + span / 2) % 360;
    if (mid < 0) mid += 360;
    return mid;
  }
  function getStartEndFromMidSpan(mid: number, span: number): [number, number] {
    // Returns [start, end] given mid and span, both in [0, 360), ensures start < end
    let start = (mid - span / 2) % 360;
    let end = (mid + span / 2) % 360;
    if (start < 0) start += 360;
    if (end < 0) end += 360;
    // Ensure start < end, if not, wrap end by +360
    if (start >= end) end += 360;
    return [start, end];
  }

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
          Cyber Spaghetti (Beta)
        </h2>
        v.0.0.0
      </div>

      <hr />

      Get started with a preset
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: "1rem",
        alignItems: "center",
        justifyContent: "flex-start",
        flexWrap: "wrap",
      }}>

        <PresetButton text="Star Shimmer" presetConfig={star_shimmer} update={update} updateLoop={updateLoop} />
        <PresetButton text="Cartoon Speed Lines" presetConfig={speed_lines} update={update} updateLoop={updateLoop} />
        <PresetButton text="Flying Sparks" presetConfig={star_field} update={update} updateLoop={updateLoop} />
        <PresetButton text="Warp Speed" presetConfig={warp_speed} update={update} updateLoop={updateLoop} />
        <PresetButton text="Spaghetti" presetConfig={spaghetti} update={update} updateLoop={updateLoop} />
      </div>

      Customize to your liking below.
      {/* --- Composition --- */}
      <CollapsibleSection iconName="grid_guides" title="Composition">
        <div style={groupedRowStyle}>
          <span>Background Color</span>
          <input
            type="color"
            value={rgbToHex(state.backgroundColor)}
            onChange={e => update({ backgroundColor: hexToRgb(e.target.value) })}
            style={{ width: 35, height: 35, background: 'none', border: 'none' }}
          />
        </div>
        <div style={groupedRowStyle}>
          <span>Canvas Size</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NumberInput initialValue={state.canvasWidth} min={0} max={3840} step={10} onChange={v => update({ canvasWidth: v })} />
            <span style={{ margin: '0 0.5rem' }}>x</span>
            <NumberInput initialValue={state.canvasHeight} min={0} max={3840} step={10} onChange={v => update({ canvasHeight: v })} />
          </div>
        </div>
        <div style={groupedRowStyle}>
          <span>Ray Origin</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NumberInput initialValue={state.centerX} min={0} max={1} step={0.01} onChange={v => update({ centerX: v })} />
            <span style={{ margin: '0 0.5rem' }}>x</span>
            <NumberInput initialValue={state.centerY} min={0} max={1} step={0.01} onChange={v => update({ centerY: v })} />
          </div>
        </div>
        <div style={labelRowStyle}>
          <span>Number of Rays</span>
          <NumberInput initialValue={state.numRays} min={0} max={10000} step={5} onChange={v => update({ numRays: v })} />
        </div>

        <div style={labelRowStyle}>
          <span>Outer Radius</span>
          <NumberInput initialValue={state.outerRadius} min={0} max={1} step={0.01} onChange={v => update({ outerRadius: v })} />
        </div>
        <div style={labelRowStyle}>
          <span>🎲 Outer Radius Randomization</span>
          <NumberInput initialValue={state.outerRadiusRandomization} min={0} max={1} step={0.01} onChange={v => update({ outerRadiusRandomization: v })} />
        </div>
        <div style={labelRowStyle}>
          <span>Inner Radius</span>
          <NumberInput initialValue={state.innerRadius} min={0} max={1} step={0.01} onChange={v => update({ innerRadius: v })} />
        </div>
        <div style={labelRowStyle}>
          <span>🎲 Inner Radius Randomization</span>
          <NumberInput initialValue={state.innerRadiusRandomization} min={0} max={1} step={0.01} onChange={v => update({ innerRadiusRandomization: v })} />
        </div>
        {/* <div style={labelRowStyle}>
          <span>Mid Angle</span>
          <NumberInput initialValue={getMidAngle(state.startAngle, state.endAngle)} min={0} max={360} step={1} onChange={v => {
            const span = getArcSpan(state.startAngle, state.endAngle);
            const [start, end] = getStartEndFromMidSpan(v, span);
            update({ startAngle: start, endAngle: end });
          }} key={externalState+"sa"} />
        </div>
        <div style={labelRowStyle}>
          <span>Arc Span</span>
          <NumberInput initialValue={getArcSpan(state.startAngle, state.endAngle)} min={0} max={360} step={1} onChange={v => {
            const mid = getMidAngle(state.startAngle, state.endAngle);
            const [start, end] = getStartEndFromMidSpan(mid, v);
            update({ startAngle: start, endAngle: end });
          }}
          key={externalState+"ea"} />
        </div> */}
      </CollapsibleSection>
      {/* --- Motion --- */}
      <CollapsibleSection iconName="animation" title="Motion">
        <div style={labelRowStyle}>
          <span>Ray Cycle Lifespan (frames)</span>
          <NumberInput initialValue={state.rayLife} min={0} max={300} step={1}
            onChange={v => { updateLoop(v, state.numCycles); return update({ rayLife: v }) }}
            onCommit={v => { updateLoop(v, state.numCycles); return update({ rayLife: v }) }}
          />
        </div>
        <div style={labelRowStyle}>
          <span>Number of Cycles</span>
          <NumberInput initialValue={state.numCycles} min={1} max={10} step={1}
            onChange={v => { updateLoop(state.rayLife, v); return update({ numCycles: v }) }}
            onCommit={v => { updateLoop(state.rayLife, v); return update({ numCycles: v }) }} />
        </div>
        <div style={labelRowStyle}>
          <span>Include Fade In/Out</span>
          <input type="checkbox" checked={state.includeFadeInOut} onChange={e => {
            timeline?.projectTools.updateFocusRange(determineFocusRange(state.rayLife, state.numCycles, e.target.checked), true);
            update({ includeFadeInOut: e.target.checked && state.numCycles !== 1 })
          }} />
        </div>
      </CollapsibleSection>
      {/* --- Rays - Appearance --- */}
      <CollapsibleSection iconName="line_weight" title="Rays Appearance">
        <div style={labelRowStyle}>
          <span>Blend Mode</span>
          <SingleSelectButtonGroup options={[
            { label: 'Normal', value: 'normal' },
            { label: 'Additive', value: 'additive' },
          ]} value={state.blendMode} onChange={v => update({ blendMode: v as NewControls['blendMode'] })} />
        </div>
        <div>
          <span style={{ display: 'block', marginBottom: 4, color: 'var(--gray6)', fontWeight: 500 }}>Colors</span>
          <div style={colorBoxStyle}>
            {state.rayColors.map((color, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, border: '2px solid var(--gray4)', borderRadius: 'var(--borderRadiusSmall)', padding: '2px 8px' }}>
                <input type="color" value={rgbToHex(color)} onChange={e => updateColor(i, hexToRgb(e.target.value))} style={{ width: 35, height: 35, background: 'none', border: 'none' }} />
                <Icon iconName={"delete"} onClick={() => removeColor(i)} />
              </div>
            ))}
            <Button text={"+ add color"} onClick={addColor} />
          </div>
        </div>
        <div style={labelRowStyle}>
          <span>Stroke Middle Thickness</span>
          <NumberInput initialValue={state.thickness} min={0} max={0.2} step={0.001} onChange={v => update({ thickness: v })} />
        </div>
        <div style={labelRowStyle}>
          <span>Stroke Ends Thickness (Relative)</span>
          <NumberInput initialValue={state.strokeCap} min={0} max={1} step={0.01} onChange={v => update({ strokeCap: v })} />
        </div>
        <div style={labelRowStyle}>
          <span>🎲 Thickness Randomization</span>
          <NumberInput initialValue={state.thicknessRandomization} min={0} max={1} step={0.01} onChange={v => update({ thicknessRandomization: v })} />
        </div>
        <div style={labelRowStyle}>
          <span>Ray Length</span>
          <NumberInput initialValue={state.rayLength} min={0} max={1} step={0.01} onChange={v => update({ rayLength: v })} />
        </div>
        <div style={labelRowStyle}>
          <span>🎲 Ray Length Randomization</span>
          <NumberInput initialValue={state.rayLengthRandomization} min={0} max={1} step={0.01} onChange={v => update({ rayLengthRandomization: v })} />
        </div>
        <div style={labelRowStyle}>
          <span>Feather</span>
          <NumberInput initialValue={state.feather} min={0} max={1} step={0.01} onChange={v => update({ feather: v })} />
        </div>

        <div style={labelRowStyle}>
          <span>Perspective Skew</span>
          <NumberInput initialValue={state.perspectiveSkew} min={0} max={1} step={0.01} onChange={v => update({ perspectiveSkew: v })} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection iconName="waves" title="Distortion">
        <div style={labelRowStyle}>
          <span>Pattern</span>
          <SingleSelectButtonGroup options={[
            { label: 'Zigzag', value: 'zigzag' },
            { label: 'Sine', value: 'sine' },
            { label: 'Jitter', value: 'jitter' },
          ]} value={state.pattern} onChange={v => update({ pattern: v as NewControls['pattern'] })} />
        </div>
        <div style={labelRowStyle}>
          <span>Amplitude</span>
          <NumberInput initialValue={state.amplitude} min={0} max={1} step={0.01} onChange={v => update({ amplitude: v })} />
        </div>
        <div style={labelRowStyle}>
          <span>Frequency</span>
          <NumberInput initialValue={state.frequency} min={0} max={1} step={0.01} onChange={v => update({ frequency: v })} />
        </div>
        <div style={labelRowStyle}>
          <span>🎲 Phase Randomization</span>
          <NumberInput initialValue={state.phaseRandomization} min={0} max={1} step={0.01} onChange={v => update({ phaseRandomization: v })} />
        </div>

      </CollapsibleSection>
      <CollapsibleSection title="Give Feedback" iconName="favorite">
        <div style={{ marginBottom: "1rem", color: "var(--gray6)" }}>

          <FeedbackBox preamble="[FEEDBACK FROM CYBERSPAGHETTI] " />

        </div>
      </CollapsibleSection>
    </div>
  );
}

function CyberSpaghettiExterior() {
  const jsonAssets = useJSONAssets();
  const ready = jsonAssets && jsonAssets["default.controls"];
  if (!ready) {
    return <FullscreenLoader />
  }
  return <CyberSpaghettiControlsInterior controls={jsonAssets["default.controls"]} />
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

  const [image,setImage] = useState<any|null>(null);
  useEffect(() => {
    const receiveImage = async () => {
      const script = await build("/cyberspaghetti/main.nectargl", {
          base: "http://localhost:3000"
        });
      setImage(script);
    };
    receiveImage();
  }, []);

  if (!image) {
    return <FullscreenLoader />;
  }

  return <AssetProvider>
    <JSONAssetProvider
      defaultName="default.controls"
      shouldCreate={true}
      defaultData={defaultControls}
    >
      <JSONAssetProvider
        defaultName="default.image"
        shouldCreate={true}
        defaultData={{
          sourceId: "start",
          source: image
        }}
      >
        <TimelineProvider
          defaultName={"default.timeline"}
        >
          <CyberSpaghettiExterior />
        </TimelineProvider>
      </JSONAssetProvider>
    </JSONAssetProvider>
  </AssetProvider>;
}