import { PreSceneObject, SceneObject, State } from ".";

function preSceneToSceneObjects(preSceneObjects: PreSceneObject[], state: State) : SceneObject[] {
    const { width : screenWidth, height: screenHeight } = state.local.data.screen;
    const { x : viewX, y: viewY, w: viewW, h: viewH } = state.local.data.viewport; 
    const sceneObjects: SceneObject[] = [];

    // convert everything to world space
    for (let i = 0; i < preSceneObjects.length; i++) {
        const pso = preSceneObjects[i];
        const geo = pso.__pre_geometry;
        let x = 0;
        if (geo.x[1] === "world") {
            x = geo.x[0];
        } else {
            x = viewX + (geo.x[0] / screenWidth) * viewW;
        }

        let y = 0;
        if (geo.y[1] === "world") {
            y = geo.y[0];
        } else {
            y = viewY + (geo.y[0] / screenHeight) * viewH;
        }

        let w = 0;
        if (geo.w[1] === "world") {
            w = geo.w[0];
        } else {
            w = (geo.w[0] / screenWidth) * viewW;
        }
        
        let h = 0;
        if (geo.h[1] === "world") {
            h = geo.h[0];
        } else {
            h = (geo.h[0] / screenHeight) * viewH;
        }

        if (geo.anchor === "center") {
            x -= w / 2;
            y -= h / 2;
        }

        sceneObjects.push({
            ...pso,
            geometry: {
                x, y, w, h
            }
        });
    }

    // now we cull the objects that are outside of the viewport
    const culledSceneObjects = sceneObjects.filter(so => {
        const { x, y, w, h } = so.geometry;
        if (x + w < viewX) return false;
        if (x > viewX + viewW) return false;
        if (y + h < viewY) return false;
        if (y > viewY + viewH) return false;
        return true;
    });

    // now we map everything to screen space
    const finalSceneObjects = culledSceneObjects.map(so => {
        const { x, y, w, h } = so.geometry;
        const screenX = ((x - viewX) / viewW) * screenWidth;
        const screenY = ((y - viewY) / viewH) * screenHeight;
        const screenW = (w / viewW) * screenWidth;
        const screenH = (h / viewH) * screenHeight;
        return {
            ...so,
            geometry: {
                x: screenX,
                y: screenY,
                w: screenW,
                h: screenH
            }
        };
    });
    console.log(finalSceneObjects);
    return finalSceneObjects;

}

export default preSceneToSceneObjects;