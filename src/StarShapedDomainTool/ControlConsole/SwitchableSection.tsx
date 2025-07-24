import { Switch } from "radix-ui";
import "./SwitchableSection.css";
import { useState } from "react";

const SwitchableSection =  ({
    label = "Toggle Section",
    children,
    activeOnToggled = true,
    onToggle,
    checked,
}) => {

    const active = activeOnToggled ? checked : !checked;

    return <div style={{
        display: "flex",
        flexDirection: "column",
    }}>
        <div style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1em"
        }}>
            <div>
                {label}
            </div>
            <Switch.Root className="SwitchRoot"
                onCheckedChange={(checked) => {onToggle(checked)}}
                checked={checked}
            >
                <Switch.Thumb className="SwitchThumb" />
            </Switch.Root>
        </div>
        <div style={{
            opacity: active ? 1 : 0.2,
            pointerEvents: active ? "auto" : "none",
            userSelect: active ? "auto" : "none",
            transition: "opacity 0.2s ease-in-out",
        }}>
            {children}
        </div>
    </div>

};

export default SwitchableSection;