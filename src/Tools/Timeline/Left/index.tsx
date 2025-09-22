import { useState } from "react";


const rowHeight = 30;

function LittleHat({open,toggle}:{open:boolean,toggle:()=>void}) {
    return <span onClick={toggle} style={{
        display: "inline-block",
        width: "0",
        height: "0",
        marginRight: "6px",
        verticalAlign: "middle",
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderTop: open ? "none" : "12px solid black",
        borderBottom: open ? "12px solid black" : "none",
        cursor: "pointer"
    }}></span>;
}

function Signal({signal,updateState}:{signal:any,updateState:(entry:any)=>void}) {
    return <div style={{marginLeft:"24px",height: `${rowHeight}px`}}>
        s: {signal}
    </div>
}

function Effect({effect,updateState}:{effect:any,updateState:(entry:any)=>void}) {
    const [open,setOpen] = useState(false);
    return <div style={{marginLeft:"12px"}}>
        <div style={{height: `${rowHeight}px`}}><LittleHat open={open} toggle={() => setOpen(!open)} /> fx: {effect.type} {effect.instanceId}</div>
        <div>{open && effect.signals.map((signal: any) => <Signal key={signal} signal={signal} updateState={updateState} />)}</div>
    </div>
}

function Layer({layer,updateState}:{layer:any,updateState:(entry:any)=>void}) {
    const [open,setOpen] = useState(true);
    return <div>
        <div style={{height: `${rowHeight}px`}}><LittleHat open={open} toggle={() => setOpen(!open)} /> {layer.id}</div>
        <div>
            {open && layer.effects.map((effect: any, effectIndex: number) => <Effect key={effect.instanceId} effect={effect} updateState={updateState} />)}
        </div>
    </div>;
}

function TimelineLeftSide({state,updateState}:{state:any,updateState:(entry:any)=>void}) {

    return <div style={{
        padding: "12px",
    }}>
        {state.composition.data.layers.map((layer: any, layerIndex: number) => <Layer key={layer.id} layer={layer} updateState={updateState} />)}
    </div>;
}

export default TimelineLeftSide;