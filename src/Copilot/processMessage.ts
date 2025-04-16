import SystemPrompt from "./SystemPrompt";
import StructuredOutputFormat from "./StructuredOutputFormat";
import OpenAI from "openai";
import { ProjectDataStructure } from "@mtrifonov-design/pinsandcurves-external";
type Project = ProjectDataStructure.PinsAndCurvesProject;

function formatProject(appState: Project) {
    // Format the content based on the application state
    // For example, you might want to include the current project name or other details
    // in the system prompt.
    const content = `
    <PROJECT_STATE>${JSON.stringify(appState, null, 2)}</PROJECT_STATE>
    `
    return content;
}

function formatAssistantContent(chatMessage: string, timelineOperations: any, notesToSelf: string) {
    // Format the content based on the application state
    const content = `
    <CHAT_MESSAGE>${chatMessage}</CHAT_MESSAGE>
    <TIMELINE_OPERATIONS>${JSON.stringify(timelineOperations, null, 2)}</TIMELINE_OPERATIONS>
    <NOTES_TO_SELF>${notesToSelf}</NOTES_TO_SELF>
    `
    return content;
}

async function processMessage(messages: any, project: Project, openai: OpenAI) {
    try {

        // 3. Call the OpenAI API using the official library
        let messagesForAssistant = [];
        messages.forEach((msg, index) => {
            const lastMessage = index === messages.length - 1;
            if (msg.role === "user") {
                messagesForAssistant.push({
                    role: "user",
                    content: msg.chatMessage,
                });
            } else if (msg.role === "assistant") {
                messagesForAssistant.push({
                    role: "assistant",
                    content: formatAssistantContent(msg.chatMessage, msg.timelineOperations, msg.notesToSelf),
                });
            }
        })
        // only keep the last 15 messages
        messagesForAssistant = messagesForAssistant.slice(-15);


        console.log("request", messagesForAssistant);
        const response = await openai.responses.create({
            model: "gpt-4o-2024-08-06",
            input: [
                { "role": "system", "content": SystemPrompt },
                ...messagesForAssistant,
                { "role": "system", "content": formatProject(project) },
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
            ...messages,
            {
                role: "assistant",
                ...event,
            },
        ];
        return newMessages;


    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        // Optionally handle or display error in the chat:
        const newMessages = [
            ...messages,
            {
                role: "assistant",
                chatMessage: "Error: " + error.message,
                timelineOperations: [],
                notesToSelf: "",
            },
        ];
        return newMessages;
    }

}

export default processMessage;