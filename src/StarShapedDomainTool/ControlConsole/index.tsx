import { GradientPicker, NumberInput, CollapsibleSection } from '@mtrifonov-design/pinsandcurves-design';
import React, { useEffect, useSyncExternalStore } from 'react';
import { AssetProvider } from '../../AssetManager/context/AssetProvider';
import ControlsProvider, { useControls } from './ControlProvider';
import FullscreenLoader from '../../FullscreenLoader/FullscreenLoader';
//import hexToRgb, { rgbToHex } from '../core/hexToRgb';
import type { Controls } from '../StarShapedDomainControls';
import TimelineProvider, { useTimeline } from '../../TimelineUtils/TimelineProvider';
import PresetButton from './PresetButton';
import presets from './presets';
import SwitchableSection from './SwitchableSection';
import { ControlsData } from '../StarShapedDomainControls';
import ImageUploader from './UploadBox';
import DoDont from './DoDont';
export function CyberSpaghettiControlsInterior({
  controls,
}: { controls: Controls }) {

  // Add missing fields to ControlsData for advanced controls
  const state = useSyncExternalStore(
    controls.subscribeInternal.bind(controls),
    controls.getSnapshot.bind(controls)
  ) as ControlsData;

  useEffect(() => {
    updateAnimationSpeed(state.speed);
  }, []);

  const timeline = useTimeline();
  const update = (patch: Partial<ControlsData>) => {
    const next = { ...state, ...patch };
    controls.setData(next);
  };

  const updateAnimationSpeed = (speed: number) => {
    const maxFrameLoop = 500;
    const minFrameLoop = 15;
    speed = 1 - speed;
    const loopLength = minFrameLoop + (maxFrameLoop - minFrameLoop) * speed;
    timeline?.projectTools.updateFocusRange([0, Math.floor(loopLength)], true);
  }

  const setPreset = (preset: Partial<ControlsData>) => {
    if (preset.speed) updateAnimationSpeed(preset.speed);
    update({
      ...preset,
    });
  }


  return (
    <div
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
        EchoKnight (Beta)
      </h2>
      <div>
        Version 0.0.1.
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
          label="Daisy"
          preset={presets.daisy}
          onClick={setPreset}
        />
        <PresetButton
          label="Arcade"
          preset={presets.arcade}
          onClick={setPreset}
        />
        <PresetButton
          label="Love"
          preset={presets.love}
          onClick={setPreset}
        />
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
              onCommit={c => update({ width: c })}
            />
            <span>x</span>

            <NumberInput
              initialValue={state.height}
              min={100}
              max={1080 * 2}
              step={10}
              onCommit={c => update({ height: c })}
            />
          </div>
        </label>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: 'space-between',
        }}>
          animation speed &nbsp;
          <NumberInput
            initialValue={state.speed}
            min={0.1}
            max={1}
            step={0.01}
            onChange={c => {
              update({ speed: c })
            }}
            onCommit={(c) => {
              updateAnimationSpeed(c);
              update({ speed: c });
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
                update({ exportDuration: c })
              }}
            />
          </label>
        </SwitchableSection>
      </CollapsibleSection>
      <CollapsibleSection title="Composition" iconName="grid_on">
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: 'space-between',
        }}>
          center point &nbsp;
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <NumberInput
              initialValue={state.canvasPoint[0]}
              min={-1}
              max={1}
              step={0.01}
              onChange={c => update({ canvasPoint: [c, state.canvasPoint[1]] })}
            />
            <span>x</span>

            <NumberInput
              initialValue={state.canvasPoint[1]}
              min={-1}
              max={1}
              step={0.01}
              onChange={c => update({ canvasPoint: [state.canvasPoint[0], c] })}
            />
          </div>
        </label>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: 'space-between',
        }}>
          ripple scale &nbsp;
          <NumberInput
            initialValue={state.canvasScale}
            min={0.01}
            max={2}
            step={0.01}
            onChange={c => {
              update({ canvasScale: c })
            }}
          />

        </label>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          justifyContent: 'space-between',
        }}>
          perspective strength &nbsp;
          <NumberInput
            initialValue={state.perspectiveFactor}
            min={0.1}
            max={1}
            step={0.01}
            onChange={c => {
              update({ perspectiveFactor: c })
            }}
          />
        </label>
        <hr style={{
          borderColor: "var(--gray2)",
        }}></hr>
        <SwitchableSection label="overlay shape"
          checked={state.overlayShape}
          onToggle={(checked) => update({ overlayShape: checked })}
        >
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'space-between',
          }}>
            shape scale &nbsp;
            <NumberInput
              initialValue={state.shapeScale}
              min={0.01}
              max={2}
              step={0.01}
              onChange={c => {
                update({ shapeScale: c })
              }}
            />
          </label>
        </SwitchableSection>
      </CollapsibleSection>
      <CollapsibleSection title="Colors" iconName="palette">
        <div style={{
          width: '100%',
          height: '100px',
          padding: '1rem',
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
      </CollapsibleSection>
      <CollapsibleSection title="Shape" iconName="shapes">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}>

          <ImageUploader
            updateState={update}
            selectedImage={state.shapeImageAssetId}
            images={state.shapeImageAssetIds}
          />
          <CollapsibleSection 
          title="Some shapes may not work as expected" 
          iconName="info"
          titleStyle={{
            fontWeight: "normal",
            color: "var(--gray6)",
            fontSize: "1rem"
          }}
          >
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 250px',
            gap: '1rem',
            alignItems: 'start',
          }}>
          <div style={{
            fontSize: '0.8rem',
          }}>
            The algorithm used by this tool only works with certain kinds of shapes called <a style={{ textDecoration: "underline", color:"var(--gray7)" }} href="https://en.wikipedia.org/wiki/Star_domain" target="_blank">star domains</a>.
            These are shapes where you can pick a center point, and every straight line from that center crosses the boundary only once.
          </div>
            <DoDont style={{
              width: '100%',
              height: 'auto'
            }} />
            </div>


          </CollapsibleSection>
          <SwitchableSection label="display shape inspector"
            checked={(state.showShapeInspector)}
            onToggle={(checked) => update({ showShapeInspector: checked })}
          >
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              justifyContent: 'space-between',
            }}>
              shape center point &nbsp;
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <NumberInput
                  initialValue={state.shapePoint[0]}
                  min={-1}
                  max={1}
                  step={0.01}
                  onChange={c => update({ shapePoint: [c, state.shapePoint[1]] })}
                />
                <span>x</span>

                <NumberInput
                  initialValue={state.shapePoint[1]}
                  min={-1}
                  max={1}
                  step={0.01}
                  onChange={c => update({ shapePoint: [state.shapePoint[0], c] })}
                />
              </div>
            </label>
          </SwitchableSection>
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Effects" iconName="star">
        <SwitchableSection label="enable grain"
          checked={state.grainEnabled}
          onToggle={(checked) => update({ grainEnabled: checked })}
        >
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'space-between',
          }}>
            grain intensity &nbsp;
            <NumberInput
              initialValue={state.grainIntensity}
              min={0}
              max={1}
              step={0.01}
              onChange={c => {
                update({ grainIntensity: c })
              }}
            />
          </label>
        </SwitchableSection>
      </CollapsibleSection>
      <CollapsibleSection title="Give Feedback" iconName="favorite">
        <div style={{ marginBottom: "1rem", color: "var(--gray6)" }}>
          <span>Notice a bug? Have an idea? Want to say hi?</span>
          <br></br>
          Email <strong style={{ color: "var(--gray7)", lineHeight: "2.5" }}>martin@pinsandcurves.app </strong> or message
          us on <a href="https://www.instagram.com/pinsandcurves/"
            style={{ color: "var(--gray7)", fontWeight: "bold", textDecoration: "underline" }}>Instagram</a>.<br></br>
          We'd love to hear from you!
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