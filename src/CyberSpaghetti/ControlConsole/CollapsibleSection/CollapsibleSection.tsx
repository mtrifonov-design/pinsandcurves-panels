import React from 'react';
import './CollapsibleSection.css';
import { Icon } from '@mtrifonov-design/pinsandcurves-design';


interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  iconName?: string;
}

export default function CollapsibleSection({ title, children, iconName }: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={`collapsible-section${open ? '' : ' closed'}`}>
      <div
        className="collapsible-header"
        onClick={() => setOpen(o => !o)}
      >
        <span className="collapsible-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {iconName ? <Icon iconName={iconName} 
            hoverBgColor='transparent'
            hoverColor='var(--gray6)'
          /> : null}
          
        
        {title}</span>
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
