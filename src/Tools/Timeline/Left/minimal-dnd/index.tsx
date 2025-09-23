import { createContext, useContext, useState, useEffect } from "react";


const MDndContext = createContext(null);

function MDndTopProvider({ children }: { children: React.ReactNode }) {

    const [topLevelContext, setTopLevelContext] = useState({});

    return <MDndContext.Provider value={{topLevelContext, setTopLevelContext}}>
    {children}
    </MDndContext.Provider>
}

function useMDndDragHandle(selfIdx: number) {
    const { topLevelContext, setTopLevelContext, containerContext, setContainerContext } = useContext(MDndContext);
    const onPointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        const newTopLevelContext = { ...topLevelContext, dragging: true, dragContainerId: containerContext.id };
        console.log("drag start", newTopLevelContext);
        const newContainerContext = { ...containerContext, dragStartIdx: selfIdx };
        setTopLevelContext(newTopLevelContext);
        setContainerContext(newContainerContext);
    };
    return { onPointerDown };
}

function MDndContainer({ containerId, children, onCommit }: { containerId: string, children: React.ReactNode, onCommit: () => void }) {
    const { topLevelContext, setTopLevelContext } = useContext(MDndContext);
    const [containerContext, setContainerContext] = useState({ id: containerId });
    const dragging = topLevelContext.dragging;
    const dragContainerId = topLevelContext.dragContainerId;
    useEffect(() => {
        const handlePointerUp = (e: PointerEvent) => {
            console.log("drag end", containerContext);
            const newTopLevelContext = { ...topLevelContext, dragging: false, dragContainerId: null };
            setTopLevelContext(newTopLevelContext);
            const newContainerContext = { ...containerContext, dragOverIdx: null, dragDirection: null, dragStartIdx: null };
            setContainerContext(newContainerContext);
            onCommit(containerContext.dragStartIdx, containerContext.dragOverIdx, containerContext.dragDirection);
        }
        if (dragging && dragContainerId === containerId) {
            window.addEventListener("pointerup", handlePointerUp);
        }
        return () => {
            window.removeEventListener("pointerup", handlePointerUp);
        }
    }, [dragging, dragContainerId, topLevelContext, setTopLevelContext, containerContext, setContainerContext, containerId]);

    return <MDndContext.Provider value={{ topLevelContext, setTopLevelContext, containerContext, setContainerContext }}>
        {children}
    </MDndContext.Provider>
}

function MDndBox({ children, idx, }: { children: React.ReactNode, idx: number }) {
    const { topLevelContext, setTopLevelContext, containerContext, setContainerContext } = useContext(MDndContext);
    //console.log( useContext(MDndContext))
    const dragging = topLevelContext.dragging;
    const dragContainerId = topLevelContext.dragContainerId;
    const active = dragging && dragContainerId === containerContext.id;
    const dragOver = containerContext.dragOverIdx === idx;
    const dragDirection = containerContext.dragDirection;
    const dragOverInteraction = (direction: number) => {
        const newContainerContext = { ... containerContext, dragOverIdx: idx, dragDirection: direction };
        setContainerContext(newContainerContext);
    };

    return <div style={{
        position: "relative",
    }}>
        {children}
        <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: active ? "auto" : "none",
        zIndex: active ? 10 : -1,
        }}>
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "50%",
                
            }}
            onPointerOver={active ? (() => {dragOverInteraction(1)}) : undefined}
            >
                <div style={{
                    width: "100%",
                    height: "2px",
                    backgroundColor: dragOver && dragDirection === 1 ? "black" : "transparent",
                    top: 0,
                    left: 0,
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    position: "absolute",
                }}></div>
            </div>
            <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "50%",
            }}
            onPointerOver={active ? (() => {dragOverInteraction(-1)}) : undefined}
            >
                <div style={{
                    width: "100%",
                    position: "absolute",
                    height: "2px",
                    backgroundColor: dragOver && dragDirection === -1 ? "black" : "transparent",
                    bottom: 0,
                    left: 0,
                    transform: "translateY(50%)",
                    pointerEvents: "none",
                }}></div>
            </div>
        </div>
    </div>
}

export { MDndTopProvider, useMDndDragHandle, MDndBox, MDndContainer };