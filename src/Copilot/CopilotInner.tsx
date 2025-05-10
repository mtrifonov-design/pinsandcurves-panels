import React, { useState } from "react";

import OpenAI from "openai";
import { ProjectDataStructure } from "@mtrifonov-design/pinsandcurves-external";
import processMessage from "./processMessage";

type Project = ProjectDataStructure.PinsAndCurvesProject;
import CONFIG from "../Config";

const ChatComponent = (p: {
    openai: OpenAI, project: Project,
    persistentState: any,
    setPersistentState: (state: any) => void,
    assets: any[],
}) => {
    // //console.log(p);
    const messages = p.persistentState.messages || [];
    const setMessages = (newMessages: any) => {
        p.setPersistentState((prevState: any) => ({
            ...prevState,
            messages: newMessages,
        }));
    }
    const [assistantType, setAssistantType] = useState("signals");
    const [userMessage, setUserMessage] = useState("");
    const [awaitingReply, setAwaitingReply] = useState(false);
    const openai = p.openai;
    const project = p.project;
    const assetsPreview = p.assets.map((asset) => {
        return {
            asset_name: asset.asset_name,
            asset_type: asset.asset_type,
            width: asset.width,
            height: asset.height,
        };
    });

    // //console.log(project);
    const handleSendMessage = async () => {
        if (!userMessage.trim()) return;

        // 1. Optimistically update local state with user's message
        const updatedMessages = [
            ...messages,
            { role: "user", chatMessage: userMessage, assistantType },
        ];
        setMessages(updatedMessages);
        setAwaitingReply(true);
        setUserMessage("");
        const newMessages = await processMessage(updatedMessages, project, assetsPreview, openai, assistantType);
        setMessages(newMessages);
        setAwaitingReply(false);
        globalThis.CK_ADAPTER.pushWorkload({
            default: [
                {
                    type: "worker",
                    receiver: {
                        instance_id: "COPILOT_DATA",
                        modality: "wasmjs",
                        resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}CopilotData`,
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
        <div style={{ 
            padding: "10px", 
            width: "100%", 
            height: "100%",
            display: "grid",
            gridTemplateRows: "1fr 300px",
            margin: "0 auto" }}>
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
            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px",
            }}>

                <div>
                    <div style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        alignItems: "center",
                        marginBottom: "10px",
                        gap: "10px",
                    }}>
                        <div style={{
                            padding: "5px",
                            border: assistantType === "signals" ? "2px solid black" : "1px solid #ccc",
                            borderRadius: "5px",
                            cursor: "pointer",
                        }}
                        onClick={() => setAssistantType("signals")}
                        >Signals</div>
                        <div style={{
                            padding: "5px",
                            border: assistantType === "code" ? "2px solid black" : "1px solid #ccc",
                            borderRadius: "5px",
                            cursor: "pointer",
                        }}
                        onClick={() => setAssistantType("code")}
                        >Code</div>
                    </div>
                    <textarea
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        placeholder="Type your message here..."
                        style={{
                            marginBottom: "10px",
                            boxSizing: "border-box",
                            padding: "8px",
                            width: "100%",
                            height: "100px",
                            resize: "none",
                        }}
                    />

                </div>
                <button
                    onClick={handleSendMessage}
                    style={{ width: "80px", padding: "8px" }}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatComponent;
