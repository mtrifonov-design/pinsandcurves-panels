
function ToggleExpand({ open, toggle }: { open: boolean, toggle: () => void }) {
    return <span 
    style={{ cursor: "pointer", userSelect: "none" }}
    className="materialSymbols" onClick={toggle}>{open ? "keyboard_arrow_down" : "keyboard_arrow_up"}</span>;
}

export {ToggleExpand};