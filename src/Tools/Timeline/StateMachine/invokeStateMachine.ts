import { selectionMachine } from ".";
import { produce } from "immer";
function invokeSelectionStateMachine(conditionalState: (mState:any) => boolean, event: (mState: any) => any, 
    { state, updateState, postProcessor,
        preCondProcessor,
     }: 
    { state: any, updateState: (newState: any) => void, 
        postProcessor?: (newState: any) => void,
        preCondProcessor?: (newState: any) => any
    }) {
    const machineState = state.local.data.timelineUI.selectionMachineState;
    let conditionSatisfied = false;
    let nextMachineState = state;
    if (conditionalState(machineState)) {
        conditionSatisfied = true;
        const newState = selectionMachine(machineState, event(machineState));
        let nextState = state;
        if (preCondProcessor) nextState = preCondProcessor(nextState);
        nextState = produce(nextState, (draft: any) => {
            draft.local.data.timelineUI.selectionMachineState = newState;
        });
        if (!postProcessor) {
            updateState(nextState);
        } else {
            nextMachineState = nextState;
        }
    }
    if (postProcessor) {
        const state = postProcessor(nextMachineState);
        if (state) updateState(state);
        if (conditionSatisfied && !state) {
            updateState(nextMachineState);
        }
    }
}

export default invokeSelectionStateMachine;