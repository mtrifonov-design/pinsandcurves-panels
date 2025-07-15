import { Button } from "@mtrifonov-design/pinsandcurves-design"

function PresetButton({label, preset, onClick}) {

    const gradient = `
        linear-gradient(45deg, ${preset.particleColors.map(c => `rgb(${c.join(',')})`).join(', ')})
    `
    const numberColors = preset.particleColors.length;

    return <div style={{
        background: gradient,
        borderRadius: "var(--borderRadiusSmall)",
        boxShadow: `inset 0 0 8px 4px rgba(255,255,255,0.2), 0 0 5px rgba(${preset.particleColors[1].join(",")},0.2)`,
        cursor: "pointer",
        width: "auto",
        padding: "8px 16px",
        border: `2px solid rgb(${preset.particleColors[0].join(",")})`,
        
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