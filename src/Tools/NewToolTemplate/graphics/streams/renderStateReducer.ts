import { ControlsData } from "../../controls";
import exampleStream from "./exampleStream";

function renderStateReducer(prefix: string, state: ControlsData) {
    const renderState: any = {};
    renderState[`${prefix}_exampleStream`] = exampleStream(state);
    return renderState;
}

export default renderStateReducer;