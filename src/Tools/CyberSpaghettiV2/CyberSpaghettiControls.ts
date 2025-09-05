type ControlsData = {
    // Composition
    canvasWidth: number; // [0, 3840]
    canvasHeight: number; // [0, 3840]
    centerX: number; // [0.0, 1.0]
    centerY: number; // [0.0, 1.0]
    innerRadius: number; // [0.0, 1.0]
    outerRadius: number; // [0.0, 1.0]
    startAngle: number; // [0, 360]
    endAngle: number; // [0, 360]
    // Motion
    rayLife: number; // [0, 300]
    numCycles: number; // [1, 10]
    // Rays - Global
    numRays: number; // [0, 500]
    rayColors: number[][]; // array of color values (hex strings)
    blendMode: 'normal' | 'additive';
    // Rays - Appearance
    thickness: number; // [0.0, 1.0]
    feather: number; // [0.0, 1.0]

    amplitude: number; // [0.0, 1.0]
    frequency: number; // [0.0, 1.0]
    pattern: 'zigzag' | 'sine' | 'jitter';
    perspectiveSkew: number; // [0, 1.0]
    includeFadeInOut: boolean;
    phaseRandomization: number;
    rayLength: number; // [0.0, 1.0]
    rayLengthRandomization: number; // [0.0, 1.0]    
    thicknessRandomization: number; // [0.0, 1.0]
    innerRadiusRandomization: number; // [0.0, 1.0]
    outerRadiusRandomization: number; // [0.0, 1.0]
    strokeCap: number; // [0.0, 1.0] - 0.0 = butt, 0.5 = round, 1.0 = square
}



const defaultControls = {
    canvasWidth: 1920,
    canvasHeight: 1080,
    centerX: 0.5,
    centerY: 0.5,
    innerRadius: 0.2,
    outerRadius: 0.8,
    startAngle: 0,
    endAngle: 360,
    rayLife: 120,
    numCycles: 3,
    numRays: 100,
    rayColors: [[255, 0, 0]],
    blendMode: 'normal',
    thickness: 0.5,
    feather: 0.2,
    shape: 'constant',
    amplitude: 0.2,
    frequency: 0.5,
    pattern: 'sine',
    perspectiveSkew: 0.1,
    includeFadeInOut: true,
    phaseRandomization: 0.1,
    backgroundColor: [0, 0, 0],
    rayLength: 0.5,
    rayLengthRandomization: 0.1,
    thicknessRandomization: 0.1,
    innerRadiusRandomization: 0.1,
    outerRadiusRandomization: 0.1,
    strokeCap: 0.5,
}

export type {ControlsData};
export default defaultControls;
