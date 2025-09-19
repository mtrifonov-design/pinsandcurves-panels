import FeedbackBox from '../../LibrariesAndUtils/FeedbackBox/FeedbackBox.js';
import { NumberInput, CollapsibleSection } from '@mtrifonov-design/pinsandcurves-design';
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
          New Tool (Beta)
        </h2>
        v.0.0.0
      </div>

      <hr />
      Customize to your liking below.
      <CollapsibleSection iconName="grid_guides" title="Composition" defaultOpen={true}>
        <div style={groupedRowStyle}>
          <span>Canvas Size</span>
          {/* <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <NumberInput initialValue={state.canvasWidth} min={0} max={3840} step={10} onCommit={v => update({ canvasWidth: v })} />
            <span style={{ margin: '0 0.5rem' }}>x</span>
            <NumberInput initialValue={state.canvasHeight} min={0} max={3840} step={10} onCommit={v => update({ canvasHeight: v })} />
          </div> */}
        </div>
      </CollapsibleSection>
    </div>
  );
}