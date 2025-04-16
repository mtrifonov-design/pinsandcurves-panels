import React, { useState } from "react";
import SystemPrompt from "./SystemPrompt";
import StructuredOutputFormat from "./StructuredOutputFormat";
import OpenAI from "openai";
import { ProjectDataStructure } from "@mtrifonov-design/pinsandcurves-external";

type Project = ProjectDataStructure.PinsAndCurvesProject;

function formatUserContent(chatMessage: string, appState: Project) {
    // Format the content based on the application state
    // For example, you might want to include the current project name or other details
    // in the system prompt.
    const content = `
    <CHAT_MESSAGE>${chatMessage}</CHAT_MESSAGE>
    <PROJECT_STATE>${JSON.stringify(appState, null, 2)}</PROJECT_STATE>
    `
    return content;
}

function formatAssistantContent(chatMessage: string, timelineOperations: any) {
    // Format the content based on the application state
    const content = `
    <CHAT_MESSAGE>${chatMessage}</CHAT_MESSAGE>
    <TIMELINE_OPERATIONS>${JSON.stringify(timelineOperations, null, 2)}</TIMELINE_OPERATIONS>
    `
    return content;
}


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
    const [userMessage, setUserMessage] = useState("");
    const [awaitingReply, setAwaitingReply] = useState(false);
    const openai = p.openai;

    // Example "application state" that might be relevant to your system prompt:
    const appState = p.project;

    const handleSendMessage = async () => {
        if (!userMessage.trim()) return;

        // 1. Optimistically update local state with user's message
        const updatedMessages = [
            ...messages,
            { role: "user", chatMessage: userMessage, projectState: appState },
        ];
        setMessages(updatedMessages);
        setAwaitingReply(true);
        setUserMessage("");


        try {

            // 3. Call the OpenAI API using the official library
            

            let messagesForAssistant = [];
            updatedMessages.forEach((msg, index) => {
                const lastMessage = index === updatedMessages.length - 1;
                if (msg.role === "user") {
                    messagesForAssistant.push({
                        role: "user",
                        content: lastMessage ? formatUserContent(msg.chatMessage, msg.projectState) : msg.chatMessage,
                    });
                } else if (msg.role === "assistant") {
                    messagesForAssistant.push({
                        role: "assistant",
                        content: formatAssistantContent(msg.chatMessage, msg.timelineOperations),
                    });
                }
            })
            console.log("request", messagesForAssistant);

            const response = await openai.responses.create({
                model: "gpt-4o-2024-08-06",
                input: [
                    { "role": "system", "content": SystemPrompt },
                    ...messagesForAssistant,
                ],
                text: StructuredOutputFormat,
            });
            console.log(response);
            // 4. Parse the assistant's response (assuming it's valid JSON in .content)
            const event = JSON.parse(response.output[0].content[0].text);
            console.log(event);
            globalThis.CK_ADAPTER.pushWorkload({
                default: [
                    {
                        type: "worker",
                        receiver: {
                            instance_id: "COPILOT_EVAL",
                            modality: "wasmjs",
                            resource_id: "http://localhost:8000/CopilotEval",
                        },
                        payload: {
                            EVAL: true,
                            timelineOperations: event.timelineOperations,
                        },
                    },
                ]
            });

            const newMessages = [
                ...updatedMessages,
                {
                    role: "assistant",
                    ...event,
                },
            ];
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

        } catch (error) {
            console.error("Error calling OpenAI API:", error);
            // Optionally handle or display error in the chat:
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Oops! Something went wrong.",
                },
            ]);
        }
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
