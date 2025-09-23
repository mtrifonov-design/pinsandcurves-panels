import { Icon, NumberInput } from "@mtrifonov-design/pinsandcurves-design";
import { trackHeight } from "../Right/constants";
import { useState } from "react";

function Rhombus() {
    return <Icon iconName="stat_0" />
}

function Value({ signal, state }: { signal: any, state: any }) {
    const [value, setValue] = useState(0);
    return <div>
        <NumberInput
            initialValue={value}
            onChange={(newValue) => setValue(newValue)}
        />
    </div>
}

function Signal({ signal, state, updateState }: { signal: any, updateState: (entry: any) => void }) {
    return <div style={{
        height: `${trackHeight}px`, 
    }}>
        <div style={{ 
        marginLeft: "60px", 
        height: `${trackHeight}px`,
        
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "var(--gray2)",
        paddingLeft: "12px",
        paddingRight: "12px",
        // borderTopLeftRadius: "var(--borderRadiusSmall)",
        // borderBottomLeftRadius: "var(--borderRadiusSmall)"
    }}>
        {signal}
        <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "6px",
        }}>
        <Value signal={signal} state={state} />
        <Rhombus />
        </div>
    </div>
    </div>
}

export default Signal;