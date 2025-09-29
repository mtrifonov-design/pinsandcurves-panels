import { MDndBox, MDndContainer, MDndTopProvider } from "./minimal-dnd";
import { produce } from "immer";
import Layer, { NewLayerStub } from "./Layer";

function TimelineLeftSide({ state, updateState }: { state: any, updateState: (entry: any) => void }) {
    return <MDndTopProvider><div style={{
        backgroundColor: "var(--gray1)",
        color: "var(--gray6)"
    }}>
        <MDndContainer containerId="layers" onCommit={(startIdx, idx, direction) => { 
            const nextState = produce(state, (draft: any) => {
                if (idx === null || direction === null) return;
                const layers = draft.composition.data.layers.map((layer, i) => [layer, i]);
                layers.push([draft.composition.data.layers[startIdx], idx -0.25 * direction]);
                layers.sort((a, b) => a[1] - b[1]);
                //console.log(layers);
                draft.composition.data.layers = layers
                .filter(([x,i]) => i !== startIdx)
                .map(x => x[0]);
            });
            updateState(nextState);
         }}>
            {state.composition.data.layers.map((layer: any, layerIndex: number) => (
                <MDndBox key={layer.id} idx={layerIndex}>
                <Layer key={layer.id} state={state} layer={layer} idx={layerIndex} updateState={updateState} />
                </MDndBox>
            ))}
            <NewLayerStub state={state} updateState={updateState} />
        </MDndContainer>
    </div>
    </MDndTopProvider>;
}

export default TimelineLeftSide;