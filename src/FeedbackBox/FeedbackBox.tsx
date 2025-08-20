import { Button } from "@mtrifonov-design/pinsandcurves-design";
import React, { useRef, useState } from "react";
import styles from "./styles.module.css";

type FeedbackState = "editing" | "sending" | "sent" | "error";

function FeedbackBox() {

    const [state, setState] = useState<FeedbackState>("editing");
    const textboxRef = useRef<HTMLTextAreaElement>(null);

    const sendFeedback = async () => {
        if (textboxRef.current) {
            const feedback = textboxRef.current.value;
            // Send feedback to the server or process it
            const postEndpoint = "http://139.162.159.22:3000/1349064888063889449/feedback";

            setState("sending");
            try {
                const response = await fetch(postEndpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        data: feedback,
                    }),
                });
                if (response.ok) {
                    setState("sent");
                } else {
                    setState("error");
                }
            } catch (err) {
                setState("error");
                console.error("Error sending feedback:", err);
            }


        }
    }

    if (state === "editing" || state === "sending") {
        return (
            <div style={{
                position: "relative",
                width: "100%",
                height: "250px",
            }}>
                <textarea
                    ref={textboxRef}
                    style={{
                        width: "100%",
                        height: "250px",
                        borderRadius: "var(--borderRadiusSmall)",
                        border: "2px solid var(--gray5)",
                        backgroundColor: "var(--gray2)",
                        color: "var(--gray8)",
                        padding: "0.5rem",
                        resize: "none",
                        position: "absolute",
                        top: "0",
                        left: "0",
                    }}
                    disabled={state === "sending"}
                    className={styles.tarea}
                    placeholder="How can we improve? If you'd like us to get back to you, please include your email address in your message."

                >
                </textarea>
                <div style={{
                    position: "absolute",
                    bottom: "0",
                    right: "0",
                    padding: "0.5rem",
                }}
                
                >
                    <Button text={state === "editing" ? "Send" : "Sending..."} iconName="send"
                        bgColor="var(--green3)"
                        hoverBgColor="var(--green2)"
                        color="white"
                        hoverColor="white"
                        onClick={sendFeedback}
                    />
                </div>
            </div>
        )
    }
    if (state === "error" || state === "sent") {
        return (
            <div style={{
                width: "100%",
                height: "250px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid var(--gray5)",
                borderRadius: "var(--borderRadiusSmall)",
                flexDirection: "column",
                gap: "0.5rem",
            }}>
                <div className="materialSymbols" style={{ fontSize: "3rem" }}>{state === "error" ? "heart_broken" : "favorite"}</div>
                {state === "error" ?
                    <div>Something went wrong. Please try again later.</div>
                    :
                    <div>Thank you for your feedback! We appreciate your input.</div>
                }
                <Button text="Write another feedback" iconName="edit"
                    onClick={() => setState("editing")}
                />
            </div>
        );
    }
}


export default FeedbackBox;