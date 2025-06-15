import { NumberInput, Button, Icon } from '@mtrifonov-design/pinsandcurves-design';
import React, { useSyncExternalStore } from 'react';
import { AssetProvider } from '../../AssetManager/context/AssetProvider';
import ControlsProvider, { useControls } from './ControlProvider';
import FullscreenLoader from '../../FullscreenLoader/FullscreenLoader';
import type { Controls } from '../CyberSpaghettiControls';
import TimelineProvider from '../../TimelineUtils/TimelineProvider';
import CollapsibleSection from './CollapsibleSection/CollapsibleSection';
import './CollapsibleSection/CollapsibleSection.css';
import hexToRgb, { rgbToHex } from '../core/hexToRgb';
import { useTimeline } from '../../TimelineUtils/TimelineProvider';

export function CyberSpaghettiControlsInterior({
  controls,
}: { controls: Controls }) {
  type NewControls = ReturnType<Controls['getSnapshot']>;
  const state = useSyncExternalStore(
    controls.subscribeInternal.bind(controls),
    controls.getSnapshot.bind(controls)
  ) as NewControls;

  const externalState = useSyncExternalStore(
    controls.subscribeToExternalState.bind(controls),
    controls.getExternalState.bind(controls)
  );

  const update = (patch: Partial<NewControls>) => {
    const next = { ...state, ...patch };
    controls.setData(next);
  };

    const timeline = useTimeline();

    const determineFocusRange = (rayLife,numCycles, includeFadeInOut) => {
      const cycles = numCycles === 1 ? 2 : numCycles + 2;
      const c = cycles * rayLife;
      if (includeFadeInOut || numCycles === 1) {
        return [0, c];
      } else {
        return [rayLife, c - rayLife];
      }
    }

    const updateLoop = (rayLife,numCycles) => {
      timeline?.projectTools.updateFocusRange(determineFocusRange(rayLife,numCycles,state.includeFadeInOut),true);
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
  const addColor = () => update({ rayColors: [...state.rayColors, [255,255,255]] });
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
      <h2 style={{ color: 'var(--gray7)', fontWeight: "normal" }}>
        Cyber Spaghetti (New Controls)
      </h2>
      <hr />
      {/* --- Composition --- */}
      <CollapsibleSection title="Composition">
        <div style={groupedRowStyle}>
          <span>Canvas Size</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NumberInput initialValue={state.canvasWidth} min={0} max={3840} step={10} onChange={v => update({ canvasWidth: v })} key={externalState+"cw"} />
            <span style={{ margin: '0 0.5rem' }}>x</span>
            <NumberInput initialValue={state.canvasHeight} min={0} max={3840} step={10} onChange={v => update({ canvasHeight: v })} key={externalState+"ch"} />
          </div>
        </div>
        <div style={groupedRowStyle}>
          <span>Center</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NumberInput initialValue={state.centerX} min={0} max={1} step={0.01} onChange={v => update({ centerX: v })} key={externalState+"cx"} />
            <span style={{ margin: '0 0.5rem' }}>x</span>
            <NumberInput initialValue={state.centerY} min={0} max={1} step={0.01} onChange={v => update({ centerY: v })} key={externalState+"cy"} />
          </div>
        </div>
        <div style={labelRowStyle}>
          <span>Num Rays</span>
          <NumberInput initialValue={state.numRays} min={0} max={500} step={1} onChange={v => update({ numRays: v })} key={externalState+"nr"} />
        </div>
        <div style={labelRowStyle}>
          <span>Inner Radius</span>
          <NumberInput initialValue={state.innerRadius} min={0} max={1} step={0.01} onChange={v => update({ innerRadius: v })} key={externalState+"ir"} />
        </div>
        <div style={labelRowStyle}>
          <span>Outer Radius</span>
          <NumberInput initialValue={state.outerRadius} min={0} max={1} step={0.01} onChange={v => update({ outerRadius: v })} key={externalState+"or"} />
        </div>
        <div style={labelRowStyle}>
          <span>Start Angle</span>
          <NumberInput initialValue={state.startAngle} min={0} max={360} step={1} onChange={v => update({ startAngle: v })} key={externalState+"sa"} />
        </div>
        <div style={labelRowStyle}>
          <span>End Angle</span>
          <NumberInput initialValue={state.endAngle} min={0} max={360} step={1} onChange={v => update({ endAngle: v })} key={externalState+"ea"} />
        </div>
      </CollapsibleSection>
      {/* --- Motion --- */}
      <CollapsibleSection title="Motion">
        <div style={labelRowStyle}>
          <span>Ray Life (frames)</span>
          <NumberInput initialValue={state.rayLife} min={0} max={300} step={1} 
          onChange={v => {updateLoop(v,state.numCycles); return update({ rayLife: v })}}
          onCommit={v => {updateLoop(v,state.numCycles);return update({ rayLife: v })}} key={externalState+"rl"} 
          />
        </div>
        <div style={labelRowStyle}>
          <span>Num Cycles</span>
          <NumberInput initialValue={state.numCycles} min={1} max={10} step={1} 
          onChange={v => {updateLoop(state.rayLife,v); return update({ numCycles: v })}}
          onCommit={v => {updateLoop(state.rayLife,v); return update({ numCycles: v })}} key={externalState+"nc"} />
        </div>
        <div style={labelRowStyle}>
          <span>Include Fade In/Out</span>
          <input type="checkbox" checked={state.includeFadeInOut} onChange={e => {
            timeline?.projectTools.updateFocusRange(determineFocusRange(state.rayLife,state.numCycles,e.target.checked),true);
            update({ includeFadeInOut: e.target.checked && state.numCycles !== 1 })}} />
        </div>
      </CollapsibleSection>
      {/* --- Rays - Appearance --- */}
      <CollapsibleSection title="Rays - Appearance">
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
          <span>Thickness</span>
          <NumberInput initialValue={state.thickness} min={0} max={1} step={0.01} onChange={v => update({ thickness: v })} key={externalState+"th"} />
        </div>
        <div style={labelRowStyle}>
          <span>Feather</span>
          <NumberInput initialValue={state.feather} min={0} max={1} step={0.01} onChange={v => update({ feather: v })} key={externalState+"fe"} />
        </div>
        <div style={labelRowStyle}>
          <span>Shape</span>
          <SingleSelectButtonGroup options={[
            { label: 'Constant', value: 'constant' },
            { label: 'Tapered', value: 'tapered' },
          ]} value={state.shape} onChange={v => update({ shape: v as NewControls['shape'] })} />
        </div>
        <div style={labelRowStyle}>
          <span>Perspective Skew</span>
          <NumberInput initialValue={state.perspectiveSkew} min={0} max={1} step={0.01} onChange={v => update({ perspectiveSkew: v })} key={externalState+"ps"} />
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Rays - Distortion">

        <div style={labelRowStyle}>
          <span>Amplitude</span>
          <NumberInput initialValue={state.amplitude} min={0} max={1} step={0.01} onChange={v => update({ amplitude: v })} key={externalState+"am"} />
        </div>
        <div style={labelRowStyle}>
          <span>Frequency</span>
          <NumberInput initialValue={state.frequency} min={0} max={1} step={0.01} onChange={v => update({ frequency: v })} key={externalState+"fr"} />
        </div>
        <div style={labelRowStyle}>
          <span>Phase Randomization</span>
          <NumberInput initialValue={state.phaseRandomization} min={0} max={1} step={0.01} onChange={v => update({ phaseRandomization: v })} key={externalState+"fr"} />
        </div>
        <div style={labelRowStyle}>
          <span>Pattern</span>
          <SingleSelectButtonGroup options={[
            { label: 'Zigzag', value: 'zigzag' },
            { label: 'Sine', value: 'sine' },
            { label: 'Jitter', value: 'jitter' },
          ]} value={state.pattern} onChange={v => update({ pattern: v as NewControls['pattern'] })} />
        </div>
      </CollapsibleSection>
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
  return <AssetProvider>
    <ControlsProvider>
      <TimelineProvider
       shouldCreate={false}
       defaultName={"cyberspaghetti.timeline"}
      >
      <CyberSpaghettiExterior />
            </TimelineProvider>
    </ControlsProvider>
  </AssetProvider>;
}