import FeedbackBox from '../../LibrariesAndUtils/FeedbackBox/FeedbackBox.js';
import { NumberInput, CollapsibleSection, GradientPicker } from '@mtrifonov-design/pinsandcurves-design';
import React from 'react';


export default function View({
    update, state
} : {
    update: (patch: any) => void;
    state: any;
}) {

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
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginBottom: 2,
    };

    return (
    <div style={{
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