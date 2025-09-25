type SelectionMachineState = 
| {
    type: 
    | 's_start_no_pins_selected' 
    | 'd_resize_track' 
    | 'd_drag_playhead'
}
| {
    type: 
    | 'd_make_selection' 
    selectedPinIds: string[];
    selectionBox: {
        x: number,
        y: number,
        w: number,
        h: number,
    }
}
| {
    type: 
    | 's_start_some_pins_selected' 
    selectedPinIds: string[];
}
| {
    type: 
    | 'd_transform_pins';
    selectedPinIds: string[];
    initial: {
        id: string; 
        frame: number;
        position: "left" | "right";
        span: number;
        type: "scale" | "translate";
        initialPositionX: number;
    };
    offsetX: number;
    scaleX: number;
}


type SelectionMachineEvent =
| { 
    type: 
    | 'mousedown_resizebar'
    | 'mouseup_resizebar'
    | 'delete_selected_pins'
    | 'mousedown_playhead'
    | 'mouseup_playhead'
}
| { 
    type: 
    | 'mousedown_begin_selectionoverlay'
    | 'mousemove_selectionoverlay'
    selectedPinIds: string[];
    selectionBox: {
        x: number,
        y: number,
        w: number,
        h: number,
    }
}
| { 
    type: 
    | 'mouseup_selectionoverlayCONDnon_empty_selection'
    | 'mouseup_selectionoverlayCONDempty_selection'
    selectedPinIds: string[];
}
| { 
    type: 
    | 'mousedown_transform_overlay'
    initial: {
        id: string; 
        frame: number;
        position: "left" | "right";
        span: number;
        type: "scale" | "translate";
    }
}
| { 
    type: 
    | 'mousedown_single_pin'
    initial: {
        id: string; 
        frame: number;
        position: "left" | "right";
        span: number;
        type: "scale" | "translate";
    }
    pinId: string;
}
| { 
    type: 
    | 'mousemove_transform_box'
    offsetX: number;
    scaleX: number;
}
| { 
    type: 
    | 'mouseup_transform_box'
    selectedPinIds?: string[];
}

type SelectionMachine = (state: SelectionMachineState, event: SelectionMachineEvent) => SelectionMachineState;

const selectionMachine: SelectionMachine = (state, event) => {
    switch (state.type) {
        case 's_start_no_pins_selected':
            switch (event.type) {
                case 'mousedown_resizebar':
                    return { type: 'd_resize_track' };
                case 'mousedown_begin_selectionoverlay':
                    return { type: 'd_make_selection', selectedPinIds: event.selectedPinIds, selectionBox: event.selectionBox };
                case 'mousedown_single_pin':
                    return { type: 'd_transform_pins', selectedPinIds: [event.pinId], 
                        initial: event.initial, offsetX: 0, scaleX: 1};
                case 'mousedown_playhead':
                    return { type: 'd_drag_playhead'}
            }
            break;
        case 'd_make_selection':
            switch (event.type) {
                case 'mousemove_selectionoverlay':
                    return { type: 'd_make_selection', selectedPinIds: event.selectedPinIds, selectionBox: event.selectionBox };
                case 'mouseup_selectionoverlayCONDnon_empty_selection':
                    return { type: 's_start_some_pins_selected', selectedPinIds: event.selectedPinIds };
                case 'mouseup_selectionoverlayCONDempty_selection':
                    return { type: 's_start_no_pins_selected' };
            }
            break;
        case 'd_resize_track':
            switch (event.type) {
                case 'mouseup_resizebar':
                    return { type: 's_start_no_pins_selected' };
            }
            break;
        case 's_start_some_pins_selected':
            switch (event.type) {
                case 'mousedown_transform_overlay':
                    return { type: 'd_transform_pins', selectedPinIds: state.selectedPinIds, 
                        initial: event.initial, offsetX: 0, scaleX: 1 };
                case 'mousedown_single_pin': {
                    if (state.selectedPinIds.includes(event.pinId)) {
                        return { type: 'd_transform_pins', selectedPinIds: state.selectedPinIds, 
                            initial: event.initial, offsetX: 0, scaleX: 1
                        };
                    } else {
                        return { type: 'd_transform_pins', selectedPinIds: [event.pinId], 
                            initial: event.initial, offsetX: 0, scaleX: 1 };
                    }
                }
                case 'mousedown_begin_selectionoverlay':
                    return { type: 'd_make_selection', selectedPinIds: event.selectedPinIds, selectionBox: event.selectionBox };
                case 'mousedown_resizebar':
                    return { type: 'd_resize_track' };



                case 'delete_selected_pins':
                    return { type: 's_start_no_pins_selected' };

                case 'mousedown_playhead':
                    return { type: 'd_drag_playhead' };
            }
            break;
        case 'd_transform_pins':
            console.log("event in state machine", event)
            switch (event.type) {
                case 'mouseup_transform_box':
                    console.log("mouseup playhead in state machine")
                    return { type: 's_start_some_pins_selected', selectedPinIds: state.selectedPinIds };
                case 'mousemove_transform_box':
                    return { type: 'd_transform_pins', selectedPinIds: state.selectedPinIds, 
                        initial: state.initial, offsetX: event.offsetX, scaleX: event.scaleX  };
            }
            break;
        case 'd_drag_playhead':
            switch (event.type) {
                case 'mouseup_playhead':
                    return { type: 's_start_no_pins_selected' };
            }
            break;
    }
    throw new Error(`Unhandled event type: ${event.type} in state: ${state.type}`);
}

export type { SelectionMachineState, SelectionMachineEvent,SelectionMachine };
export { selectionMachine };