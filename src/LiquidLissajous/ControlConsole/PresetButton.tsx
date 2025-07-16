import { Button } from "@mtrifonov-design/pinsandcurves-design"

function PresetButton({label, preset, onClick}) {

    const gradient = `
        linear-gradient(45deg, ${preset.particleColors.map(c => `rgb(${c.join(',')})`).join(', ')})
    `
    const numberColors = preset.particleColors.length;

    return <div style={{
        background: gradient,
        borderRadius: "var(--borderRadiusSmall)",
        boxShadow: `inset 0 0 7px 5px rgba(${preset.particleColors[numberColors-1].join(",")},0.3)`,
        cursor: "pointer",
        width: "auto",
        padding: "8px 16px",
        border: `2px solid rgb(${preset.particleColors[0].join(",")})`,
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