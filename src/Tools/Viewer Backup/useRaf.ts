import React from "react";

function useRaf(callback :any, isActive : boolean) {
    const savedCallback = React.useRef<any>();
    // Remember the latest function.
    React.useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);
    React.useEffect(() => {
        let startTime : number, animationFrame : number;
        function tick() {
            const timeElapsed = Date.now() - startTime;
            startTime = Date.now();
            loop();
            savedCallback.current && savedCallback.current(timeElapsed);
        }
        function loop() {
            animationFrame = window.requestAnimationFrame(tick);
        }
        if (isActive) {
            startTime = Date.now();
            loop();
            return () => {
                window.cancelAnimationFrame(animationFrame);
            };
        }
    }, [isActive]);
}

export default useRaf;