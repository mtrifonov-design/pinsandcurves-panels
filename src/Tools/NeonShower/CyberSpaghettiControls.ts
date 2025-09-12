type ControlsData = {
    canvasWidth: number; 
    canvasHeight: number; 
    centerX: number; 
    centerY: number; 
    centerZ: number;
    temperature: number,
    pressure: number,
    showUI: number,
    colorStops: {
        color: {
            r: number;
            g: number;
            b: number;
        };
        position: number;
        id: string;        
    }[];
}



const defaultControls = {
    canvasWidth: 1920,
    canvasHeight: 1080,
    centerX: 0.5,
    centerY: 0.5,
    centerZ: 0.5,
    temperature: 0.5,
    pressure: 0.5,
    showUI: 0,
    colorStops: [
            {
                color: { r: 1, g: 0, b: 0 },
                position: 0.0,
                id: crypto.randomUUID(),
            },
            {
                color: { r: 0, g: 0, b: 1 },
                position: 0.5,
                id: crypto.randomUUID(),
            }
    ],

}

export type {ControlsData};
export default defaultControls;
