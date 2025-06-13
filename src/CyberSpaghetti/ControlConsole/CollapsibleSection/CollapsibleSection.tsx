import React from 'react';
import './CollapsibleSection.css';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function CollapsibleSection({ title, children }: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={`collapsible-section${open ? '' : ' closed'}`}>
      <div
        className="collapsible-header"
        onClick={() => setOpen(o => !o)}
      >
        <span className="collapsible-title">{title}</span>
        <span className={`materialSymbols collapsible-arrow${open ? ' open' : ''}`}>
          arrow_drop_down
        </span>
      </div>
      <div className={`collapsible-content${open ? '' : ' closed'}`}
        style={{ maxHeight: open ? 'none' : 0 }}
      >
        <div className={`collapsible-inner${open ? '' : ' closed'}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
