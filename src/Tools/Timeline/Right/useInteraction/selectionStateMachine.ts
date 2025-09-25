type TransformationAxes = 'x-y' | 'x' | 'y';
type TransformationAnchor = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'left' | 'right' | 'top' | 'bottom' | 'center' | 'start-point';
type TransformationCategory = 'translate' | 'scale';

type SelectionMachineState = 
| {
    type: 
    | 's_start_no_pins_selected' 
    | 'd_resize_track' 
}
| {
    type: 
    | 's_start_some_pins_selected' 
    | 'd_make_selection' 

    selectedPinIds: string[];
}
| {
    type: 
    | 'd_transform_pins';
    selectedPinIds: string[];
    category: TransformationCategory;
    axes: TransformationAxes;
    anchor: TransformationAnchor;
}


type SelectionMachineEvent =
| { 
    type: 
    | 'mousedown_resizebar'
    | 'mouseup_resizebar'
    | 'delete_selected_pins'
}
| { 
    type: 
    | 'mousedown_begin_selectionoverlay'
    | 'mousemove_selectionoverlay'
    | 'mouseup_selectionoverlayCONDnon_empty_selection'
    | 'mouseup_selectionoverlayCONDempty_selection'
    selectedPinIds: string[];
}
| { 
    type: 
    | 'mousedown_selection_overlay'
    category: TransformationCategory;
    axes: TransformationAxes;
    anchor: TransformationAnchor;
}
| { 
    type: 
    | 'mousedown_single_pin'
    category: TransformationCategory;
    axes: TransformationAxes;
    anchor: TransformationAnchor;
    pinId: string;
}
| { 
    type: 
    | 'mousedown_outside_selection_box'
    | 'mouseup_transformer'
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
                    return { type: 'd_make_selection', selectedPinIds: event.selectedPinIds };
                case 'mousedown_single_pin':
                    return { type: 'd_transform_pins', selectedPinIds: [event.pinId], category: event.category, axes: event.axes, anchor: event.anchor };
            }
            break;
        case 'd_make_selection':
            switch (event.type) {
                case 'mousemove_selectionoverlay':
                    return { type: 'd_make_selection', selectedPinIds: event.selectedPinIds };
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
                case 'mousedown_selection_overlay':
                    return { type: 'd_transform_pins', selectedPinIds: state.selectedPinIds, category: event.category, axes: event.axes, anchor: event.anchor };
                case 'mousedown_single_pin': {
                    if (state.selectedPinIds.includes(event.pinId)) {
                        return { type: 'd_transform_pins', selectedPinIds: state.selectedPinIds, category: event.category, axes: event.axes, anchor: event.anchor };
                    } else {
                        return { type: 'd_transform_pins', selectedPinIds: [event.pinId], category: event.category, axes: event.axes, anchor: event.anchor };
                    }
                }
                case 'mousedown_resizebar':
                    return { type: 'd_resize_track' };
                case 'mousedown_begin_selectionoverlay':
                    return { type: 'd_make_selection', selectedPinIds: event.selectedPinIds };


                case 'delete_selected_pins':
                    return { type: 's_start_no_pins_selected' };
                case 'mousedown_outside_selection_box':
                    return { type: 's_start_no_pins_selected' };
            }
            break;
        case 'd_transform_pins':
            switch (event.type) {
                case 'mouseup_transformer':
                    return { type: 's_start_some_pins_selected', selectedPinIds: state.selectedPinIds };
            }
            break;
    }
    throw new Error(`Unhandled event type: ${event.type} in state: ${state.type}`);
}

export type { SelectionMachineState, SelectionMachineEvent,SelectionMachine };
export { selectionMachine };