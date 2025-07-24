import { NumberInput, Button, Icon } from '@mtrifonov-design/pinsandcurves-design';
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { AssetProvider } from '../../AssetManager/context/AssetProvider';
import ControlsProvider, { useControls } from './ControlProvider';
import FullscreenLoader from '../../FullscreenLoader/FullscreenLoader';
import hexToRgb, { rgbToHex } from '../core/hexToRgb';
import type { Controls } from '../LiquidLissajousControls';
import TimelineProvider, { useTimeline } from '../../TimelineUtils/TimelineProvider';
import { CollapsibleSection } from '@mtrifonov-design/pinsandcurves-design';
import LissajousSelectButtonGroup from './LissajousPreview';
import { LISSAJOUS_CURVES, LISSAJOUS_CURVES_MAX_INTEGRAL } from '../core/lissajousCurves';
import PresetButton from './PresetButton';
import presets from './presets';
import SwitchableSection from './SwitchableSection';

export function CyberSpaghettiControlsInterior({
  controls,
}: { controls: Controls }) {




  // Add missing fields to ControlsData for advanced controls
  type AdvancedControls = ReturnType<Controls['getSnapshot']> & {
    showLissajousFigure: boolean;
    offset: number;
    ratioA: number;
    ratioB: number;
  };
  const state = useSyncExternalStore(
    controls.subscribeInternal.bind(controls),
    controls.getSnapshot.bind(controls)
  ) as AdvancedControls;

  useEffect(() => {
    updateAnimationSpeed(state.animationSpeed, state.lissajousParams.integral);
  }, []);

  const externalState = useSyncExternalStore(
    controls.subscribeToExternalState.bind(controls),
    controls.getExternalState.bind(controls)
  );

  const timeline = useTimeline();


  const update = (patch: Partial<AdvancedControls>) => {
    const next = { ...state, ...patch };
    controls.setData(next);
  };

  const updateColor = (idx: number, value: string) => {
    const colors = state.particleColors.slice();
    colors[idx] = hexToRgb(value) as [number, number, number];
    update({ particleColors: colors });
  };

    const updateBackgroundColor = (value: string) => {
    update({ backgroundColor: hexToRgb(value) });
  };

  const addColor = () => update({ particleColors: [...state.particleColors, [255, 255, 255]] });
  const removeColor = (idx: number) => {
    if (state.particleColors.length === 1) return;
    update({ particleColors: state.particleColors.filter((_, i) => i !== idx) });
  };

  const updateAnimationSpeed = (speed: number, distance: number) => {
    const minSpeed = 0.1;
    const maxFrameLoop = 5000;
    const adj = (1 / minSpeed) * LISSAJOUS_CURVES_MAX_INTEGRAL / maxFrameLoop;

    const loopLength = distance / (speed * adj);
    timeline?.projectTools.updateFocusRange([0, Math.floor(loopLength)],true);
    return Math.floor(loopLength);
  }

  const setPreset = (preset: typeof presets[keyof typeof presets]) => {
    const loopLength = updateAnimationSpeed(preset.animationSpeed, preset.lissajousParams.integral);
    update({
      ...preset,
      loopLifecycle: loopLength,
    });
  
  }


  return (
    <div className="hyperspeed-controls"
      style={{
        display: 'flex',
        gap: '20px',
        flexDirection: 'column',
        backgroundColor: "var(--gray1)",
        width: '100vw',
        minWidth: '400px',
        height: '100vh',
        padding: '1rem',
        color: 'var(--gray6)',
        overflow: 'scroll',
        scrollbarColor: 'var(--gray3) var(--gray1)',
      }}
    >
      <h2 style={{
        color: 'var(--gray7)',
        fontWeight: "normal",
      }}>
      Liquid Lissajous (Beta)
      </h2>
      <div>
        Version 0.0.5. <a style={{
          color: "var(--continuousBlue3)",
          textDecoration: "underline",
          cursor: "pointer",
        }}
          onClick={() => window.open("https://www.youtube.com/watch?v=ivXyCjc1SoM", "_blank")}
        >Watch tutorial</a>
      </div>
      <hr></hr>
      Pick a preset to get started 
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}>
        <PresetButton
          label="Burning Sunset"
          preset={presets.burningSunset}
          onClick={setPreset}
        />
        <PresetButton
          label="Ocean Blues"
          preset={presets.oceanBlues}
          onClick={setPreset}
        />
        <PresetButton
          label="Forest Greens"
          preset={presets.forestGreens}
          onClick={setPreset}
        />
        <PresetButton
          label="Hot Pink"
          preset={presets.hotPink}
          onClick={setPreset}
        />
        <PresetButton
          label="Tropical Disco"
          preset={presets.tropicalDisco}
          onClick={setPreset}
        />
        {/* <PresetButton
          label="Pastel Dream"
          preset={presets.pastelDream}
          onClick={update}
        /> */}

      </div>
      Customize to your liking
        <CollapsibleSection title="General" iconName="settings">
        
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        canvas size &nbsp;
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <NumberInput
            initialValue={state.width}
            min={100}
            max={1920 * 2}
            step={10}
            onChange={c => update({ width: c })}
          />
          <span>x</span>

          <NumberInput
            initialValue={state.height}
            min={100}
            max={1080 * 2}
            step={10}
            onChange={c => update({ height: c })}
          />
        </div>
      </label>
      {/* <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        loop length (in frames) &nbsp;
        <NumberInput
          initialValue={state.loopLifecycle}
          min={30}
          max={900}
          step={1}
          onChange={c => {
            update({ loopLifecycle: c })}}
          onCommit={(c) => {
            timeline?.projectTools.updateFocusRange([0, c],true);
            update({ loopLifecycle: c });
          }}
        />
      </label> */}
            <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        animation speed &nbsp;
        <NumberInput
          initialValue={state.animationSpeed}
          min={0.1}
          max={1}
          step={0.1}
          onChange={c => {
            update({ animationSpeed: c })}}
          onCommit={(c) => {
            
            const loopLength = updateAnimationSpeed(c, state.lissajousParams.integral);
            update({ animationSpeed: c, loopLifecycle: loopLength });
          }}
        />
      </label>
      <SwitchableSection label="export perfect loop" activeOnToggled={false}
          checked={state.exportPerfectLoop}
          onToggle={(checked) => update({ exportPerfectLoop: checked })}
        >
        <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                justifyContent: 'space-between',
              }}>
                export duration (seconds) &nbsp;
                <NumberInput
                  initialValue={state.exportDuration}
                  min={1}
                  max={30}
                  step={1}

                  onCommit={(c) => {
                    update({ exportDuration: c})
                  }}
                />
              </label>
        </SwitchableSection>
      </CollapsibleSection>
      <CollapsibleSection title="Colors" iconName="palette">
      {/* Global limits */}
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        mixing softness &nbsp;
        <NumberInput
          initialValue={state.mixingIntensity}
          min={0}
          max={1}
          step={0.01}
          onChange={c => update({ mixingIntensity: c })}
        />
      </label>
      {/* <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        background color &nbsp;
                  <input
              type="color"
              value={rgbToHex(state.backgroundColor)}
              onChange={e => updateBackgroundColor(e.target.value)}
              style={{
                border: "none",
                backgroundColor: "var(--gray3)",
                borderRadius: "var(--borderRadiusSmall)",
                width: "35px",
                height: "35px",
              }}
            />
      </label> */}



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
        {state.particleColors.map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 4,
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
      </CollapsibleSection>
      
      {/* Advanced Section Toggle Button */}
      {/* Advanced Section */}
      <CollapsibleSection title="Lissajous Knot" iconName="all_inclusive">
          {/* Show Lissajous Figure Toggle */}
          <div style={{
              display: "flex",
              flexDirection: "row",
              gap: "1rem",
              padding: "1.5rem",
              //border: "1px solid var(--gray3)",
              borderWidth: "2px",
              backgroundColor: "var(--gray2)",
              borderRadius: "var(--borderRadiusSmall)",
              marginBottom: "1rem",
              alignItems: "center",
            }}>
              <div>
                <Icon iconName="info" hoverBgColor='var(--gray2)' color="white"/>
              </div>
              <div>
              <b style={{color: "white"}}>What are Lissajous knots?</b><br></br>
              Lissajous knots are mathematical paths that are defined by equations involving sine and cosine functions.
              They are used here to create complex, looping paths on which color particles can move.
              Feel free to experiment with different parameters to create unique patterns.
              </div>
            </div>

          {/* Offset selection */}

          {/* <div>
            <div style={{ marginBottom: 4, fontSize: 13 }}>scale</div>
            <div>
              <NumberInput
                initialValue={state.figureScaleX}
                min={0.1}
                max={1}
                step={0.01}
                onChange={c => update({ figureScaleX: c })}
              />
              <span style={{ margin: '0 0.5rem' }}>x</span>
              <NumberInput
                initialValue={state.figureScaleY}
                min={0.1}
                max={1}
                step={0.01}
                onChange={c => update({ figureScaleY: c })}
              />
            </div>
          </div> */}

          {/* <div>
            <div style={{ marginBottom: 4 }}>offset</div>
            <SingleSelectButtonGroup<number>
              options={[
                { label: 'π/8', value: Math.PI / 8 },
                { label: 'π/4', value: Math.PI / 4 },
                { label: 'π/2', value: Math.PI / 2 },
                { label: '3/4π', value: 0.75 * Math.PI },
                { label: '7/8π', value: 7 / 8 * Math.PI },
              ]}
              value={state.offset}
              onChange={v => update({ offset: v })}

            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>ratio</div>
            <SingleSelectButtonGroup<string>
              options={[
                { label: '1:1', value: '1/1' },
                { label: '1:2', value: '1/2' },
                { label: '1:3', value: '1/3' },
                { label: '2:3', value: '2/3' },
                { label: '3:4', value: '3/4' },
                { label: '3:5', value: '3/5' },
                { label: '4:5', value: '4/5' },
                { label: '5:6', value: '5/6' },
              ]}
              value={`${state.ratioA}/${state.ratioB}`}
              onChange={v => {
                const [a, b] = v.split('/').map(Number);
                update({ ratioA: a, ratioB: b });
              }}
            />
          </div> */}
          <div style={{
          }}>
            <SwitchableSection label="display lissajous knot" 
              checked={(state.showLissajousFigure)}
              onToggle={(checked) => update({ showLissajousFigure: checked })}
            >
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}>
            <LissajousSelectButtonGroup
              value={state.lissajousParams}
              options={LISSAJOUS_CURVES.map(curve => ({
                label: `${curve.a}:${curve.b}`,
                value: curve,
              }))}
              onChange={(params) => {
  
                const loopLength = updateAnimationSpeed(state.animationSpeed, params.integral);
                update({ lissajousParams: params, loopLifecycle: loopLength,
                  rotateHorizontal: 0,
                  rotateVertical: 0,
                 });
              }}
          
          />
          <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        horizontal rotation &nbsp;
        <NumberInput
          initialValue={state.rotateHorizontal}
          min={0}
          max={360}
          step={1}
          onChange={c => {
            update({ rotateHorizontal: c })}}
        />
      </label>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        vertical rotation &nbsp;
        <NumberInput
          initialValue={state.rotateVertical}
          min={0}
          max={360}
          step={1}
          onChange={c => {
            update({ rotateVertical: c })}}
        />
      </label>
      </div>
          </SwitchableSection>
          </div>
          

      </CollapsibleSection>
      <CollapsibleSection title="Effects" iconName="star">
      <>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        noise intensity &nbsp;
        <NumberInput
          initialValue={state.noiseIntensity}
          min={0}
          max={1}
          step={0.01}
          onChange={c => {
            update({ noiseIntensity: c })}}
        />
      </label>
            {/* <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        noise scale &nbsp;
        <NumberInput
          initialValue={state.noiseScale}
          min={0}
          max={1}
          step={0.01}
          onChange={c => {
            update({ noiseScale: c })}}
        />
      </label>
            <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        noise speed &nbsp;
        <NumberInput
          initialValue={state.noiseSpeed}
          min={0}
          max={1}
          step={0.01}
          onChange={c => {
            update({ noiseSpeed: c })}}
        />
      </label>
                  <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        warp intensity &nbsp;
        <NumberInput
          initialValue={state.fluidWarpIntensity}
          min={0}
          max={1}
          step={0.01}
          onChange={c => {
            update({ fluidWarpIntensity: c })}}
        />
      </label>
            <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        warp scale &nbsp;
        <NumberInput
          initialValue={state.fluidWarpScale}
          min={0}
          max={1}
          step={0.01}
          onChange={c => {
            update({ fluidWarpScale: c })}}
        />
      </label>
            <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        justifyContent: 'space-between',
      }}>
        warp speed &nbsp;
        <NumberInput
          initialValue={state.fluidWarpSpeed}
          min={0}
          max={1}
          step={0.01}
          onChange={c => {
            update({ fluidWarpSpeed: c })}}
        />
      </label> */}
      </>
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
       defaultName={"liquidlissajous.timeline"}
      >
      <CyberSpaghettiExterior />
            </TimelineProvider>
    </ControlsProvider>
  </AssetProvider>;
}