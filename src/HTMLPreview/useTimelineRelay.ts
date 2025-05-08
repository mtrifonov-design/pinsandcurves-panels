import { useTimeline } from "../TimelineUtils/TimelineProvider";
import { useEffect } from "react";

let subscriber : MessageEventSource | null = null;
let subscriberOrigin : string | undefined = undefined;

function useTimelineRelay() {
    const timeline = useTimeline();
    useEffect(() => {
        const listener = (message: MessageEvent) => {
            console.log("Message received", message);
            const { data } = message;
            if (!data) return;
            const { type } = data;
            if (type === "timeline_relay_subscribe") {
                subscriber = message.source;
                subscriberOrigin = message.origin;
                subscriber?.postMessage({
                    type: "timeline_relay_subscribe_response",
                    payload: {
                        timeline: timeline?.serialize(),
                    },
                }, { targetOrigin: message.origin });
            }
        }
        
        const unsub = timeline?.onPushUpdate(() => {
            console.log("timeline relay!!!!!!!!!")
            const update = timeline?.transferOutgoingEvent();
            console.log("Update received", update);
            if (update) {
                    subscriber?.postMessage({
                        type: "timeline_relay_update",
                        payload: {
                            update,
                        },
                    }, { targetOrigin: subscriberOrigin } );
            }
        });
        window.addEventListener("message", listener);
        return () => {
            window.removeEventListener("message", listener);
            unsub?.();
        }
    }, [timeline]);
}

export default useTimelineRelay;