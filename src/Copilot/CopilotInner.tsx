import React, { useState } from "react";

import OpenAI from "openai";
import { ProjectDataStructure } from "@mtrifonov-design/pinsandcurves-external";
import processMessage from "./processMessage";

type Project = ProjectDataStructure.PinsAndCurvesProject;




const ChatComponent = (p: {
    openai: OpenAI, project: Project,
    persistentState: any,
    setPersistentState: (state: any) => void,
}) => {
    // console.log(p);
    const messages = p.persistentState.messages || [];
    const setMessages = (newMessages: any) => {
        p.setPersistentState((prevState: any) => ({
            ...prevState,
            messages: newMessages,
        }));
    }
    const [thinkDeep, setThinkDeep] = useState(false);
    const [userMessage, setUserMessage] = useState("");
    const [awaitingReply, setAwaitingReply] = useState(false);
    const openai = p.openai;
    const project = p.project;
    // console.log(project);
    const handleSendMessage = async () => {
        if (!userMessage.trim()) return;

        // 1. Optimistically update local state with user's message
        const updatedMessages = [
            ...messages,
            { role: "user", chatMessage: userMessage },
        ];
        setMessages(updatedMessages);
        setAwaitingReply(true);
        setUserMessage("");
        const newMessages = await processMessage(updatedMessages, project, openai,thinkDeep);
        setMessages(newMessages);
        setAwaitingReply(false);
        globalThis.CK_ADAPTER.pushWorkload({
            default: [
                {
                    type: "worker",
                    receiver: {
                        instance_id: "COPILOT_DATA",
                        modality: "wasmjs",
                        resource_id: "http://localhost:8000/CopilotData",
                    },
                    payload: {
                        channel: "PERSISTENT_DATA", 
                        request: "sendData",
                        payload: {
                            messages: newMessages,
                        }
                    },
                },
            ]
        });
    };

    return (
        <div style={{ padding: "10px", width: "400px", margin: "0 auto" }}>
            <div
                style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    height: "300px",
                    overflowY: "auto",
                    marginBottom: "10px",
                }}
            >
                {messages.map((msg, index) => (
                    <div key={index} style={{ marginBottom: "8px" }}>
                        <strong>{msg.role}:</strong> {msg.chatMessage}
                    </div>
                ))}
                {awaitingReply && (
                    <div style={{ marginTop: "10px", fontStyle: "italic" }}>
                        Assistant is thinking...
                    </div>
                )}
            </div>

            <textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Type your message here..."
                style={{
                    width: "100%",
                    marginBottom: "10px",
                    boxSizing: "border-box",
                    padding: "8px",
                }}
            />
            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={thinkDeep}
                        onChange={(e) => setThinkDeep(e.target.checked)}
                    />
                    Think Deeply
                </label>
            </div>
            <button
                onClick={handleSendMessage}
                style={{ width: "100%", padding: "8px" }}
            >
                Send
            </button>
        </div>
    );
};

export default ChatComponent;
