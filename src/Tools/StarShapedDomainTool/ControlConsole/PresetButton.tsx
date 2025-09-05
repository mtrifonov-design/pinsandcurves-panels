import { Button } from "@mtrifonov-design/pinsandcurves-design"

function PresetButton({label, preset, onClick}) {

    const colorStops = [...preset.colorStops].map(c => {
        return [Math.round(c.color.r * 255), Math.round(c.color.g * 255), Math.round(c.color.b * 255), c.position];
    })

    const gradient = `
        linear-gradient(90deg, ${colorStops.map(c => `rgb(${c.slice(0, 3).join(",")}) ${Math.floor(c[3] * 100)}%`).join(", ")})
    `
    const numberColors = colorStops.length;

    return <div style={{
        background: gradient,
        borderRadius: "var(--borderRadiusSmall)",
        boxShadow: `inset 0 0 7px 5px rgba(${colorStops[numberColors-1].join(",")},0.3)`,
        cursor: "pointer",
        width: "auto",
        padding: "8px 16px",
        border: `2px solid rgb(${colorStops[0].slice(0, 3).join(",")})`,
        height: "3em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        
    }}
        onClick={() => onClick(preset)}
    >
        <div style={{
            color: "white",
            textShadow: "0 0px 3px rgba(0,0,0,0.8)",
            fontWeight: 600,
        }}>
            {label}
        </div>

    </div>

}

export default PresetButton