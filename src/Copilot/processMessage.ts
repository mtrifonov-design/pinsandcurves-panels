import SystemPrompt from "./SystemPrompt";
import StructuredOutputFormat from "./StructuredOutputFormat";
import OpenAI from "openai";
import { ProjectDataStructure } from "@mtrifonov-design/pinsandcurves-external";
type Project = ProjectDataStructure.PinsAndCurvesProject;

import { prompt as MentorPrompt, format as MentorFormat } from './AgentNetwork/MentorPrompt'
import { prompt as CodeAssistantPrompt, format as CodeAssistantFormat } from './AgentNetwork/CodeAssistantPrompt'
import { prompt as SignalAssistantPrompt, format as SignalAssistantFormat } from './AgentNetwork/SignalAssistantPrompt'
import callAgent from "./callAgent";

function formatProject(appState: Project) {
    // Format the content based on the application state
    // For example, you might want to include the current project name or other details
    // in the system prompt.

    const signalData = appState.signalData;
    const signals = Object.values(signalData).map((signal) => ({
        id: signal.id,
        name: appState.orgData.signalNames[signal.id],
        type: signal.type,
        range: signal.range,
        defaultValue: signal.defaultValue,
        isStatic: signal.isStatic,
        pins: signal?.pinIds.map((pinId) => ({
            id: pinId,
            value: signal.pinValues[pinId],
            time: signal.pinTimes[pinId],
            functionString: signal.curves[pinId],
        })).sort((a, b) => a.time - b.time),
    })).filter((signal) => signal.id !== "HIDDEN_CODE");

    const p5jsSketch = appState.signalData["HIDDEN_CODE"]?.defaultValue;

    const project = {
        signals: signals,
        p5jsSketch: p5jsSketch,
    }

    const content = `
    <PROJECT_STATE>${JSON.stringify(project, null, 2)}</PROJECT_STATE>
    `
    // console.log(content)
    return content;
}

function formatAssistantContent(chatMessage: string, timelineOperations: any, thresholdMet: string, brief: string) {
    // Format the content based on the application state
    const content = `
    <THRESHOLD_MET>${thresholdMet}</THRESHOLD_MET>
    <BRIEF>${thresholdMet ? brief : ""}</BRIEF>
    <CHAT_MESSAGE>${thresholdMet ? "" : chatMessage}</CHAT_MESSAGE>
    `
    //<TIMELINE_OPERATIONS>${JSON.stringify(timelineOperations, null, 2)}</TIMELINE_OPERATIONS>
    return content;
}

async function processMessage(messages: any, project: Project, openai: OpenAI, thinkDeep: boolean = false) {
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
                    content: formatAssistantContent(msg.chatMessage, msg.timelineOperations, msg.thresholdMet, msg.brief, ),
                });
            }
        })
        // only keep the last 15 messages
        messagesForAssistant = messagesForAssistant.slice(-15);
        const mentorResponse = await callAgent({
            model: "gpt-4o-2024-08-06",
            prompt: MentorPrompt,
            format: MentorFormat,
        }, [...messagesForAssistant, {role:"user", content: formatProject(project)}], openai);

        console.log("Mentor Response: ", mentorResponse);
        // const response = await openai.responses.create({
        //     model: "gpt-4o-2024-08-06",
        //     input: [
        //         { "role": "system", "content": MentorPrompt },
        //         ...messagesForAssistant,
        //         { "role": "system", "content": formatProject(project) },
        //     ],
        //     text: MentorFormat,
        // });
        // console.log(response);
        // // 4. Parse the assistant's response (assuming it's valid JSON in .content)
        // const event = JSON.parse(response.output[0].content[0].text);
        let timelineOperations = [];
        let chatMessage = mentorResponse.chatMessage;
        
        if (mentorResponse.thresholdMet) {
            // const response = await openai.responses.create({
            //     model: thinkDeep ? "o4-mini-2025-04-16" : "gpt-4o-2024-08-06", //"o4-mini-2025-04-16",
            //     input: [
            //         { "role": "system", "content": CodeAssistantPrompt },
            //         ...messagesForAssistant,
            //         { "role": "system", "content": formatProject(project) },
            //         { "role": "system", "content": event.brief },
            //     ],
            //     text: CodeAssistantFormat,
            // });
            // console.log(response);
            // const newEvent = JSON.parse(response.output[thinkDeep ? 1 : 0].content[0].text);
            // event.signalAgentBrief = newEvent.signalAgentBrief;
            // event.p5jsSketch = newEvent.p5jsSketch;
            // event.chatMessage = newEvent.chatMessage;
            // console.log(event.p5jsSketch);
            // console.log(event.signalAgentBrief);

            const codeAssistantResponse = await callAgent({
                model: "gpt-4o-2024-08-06",
                prompt: CodeAssistantPrompt,
                format: CodeAssistantFormat,
            }, [{role: "user", content: mentorResponse.brief },{role:"user", content: formatProject(project)}], openai);
            console.log("Code Assistant Response: ", codeAssistantResponse);

            let signalAgentTimelineOperations = [];
            if (codeAssistantResponse.signalChangesNeeded) {

                const signalAgentResponse = await callAgent({
                    model: "gpt-4o-2024-08-06",
                    prompt: SignalAssistantPrompt,
                    format: SignalAssistantFormat,
                }, [{role: "user", content: codeAssistantResponse.signalAgentBrief },{role:"user", content: formatProject(project)}], openai);
                console.log("Signal Agent Response: ", signalAgentResponse);
                signalAgentTimelineOperations = signalAgentResponse.timelineOperations;
            }

            // const signalAgentResponse = await openai.responses.create({
            //     model: thinkDeep ? "o4-mini-2025-04-16" : "gpt-4o-2024-08-06", //"o4-mini-2025-04-16",
            //     input: [
            //         { "role": "system", "content": SignalAssistantPrompt },
            //         ...messagesForAssistant,
            //         { "role": "system", "content": formatProject(project) },
            //         { "role": "system", "content": event.signalAgentBrief },
            //     ],
            //     text: SignalAssistantFormat,
            // });
            //const signalAgentEvent = JSON.parse(signalAgentResponse.output[thinkDeep ? 1 : 0].content[0].text);
            timelineOperations = [`projectTools.updateSignalDefaultValue("HIDDEN_CODE", \`${codeAssistantResponse.p5jsSketch}\`)`,...signalAgentTimelineOperations];
            chatMessage = codeAssistantResponse.chatMessage;

        }

        console.log("Timeline Operations: ", timelineOperations);
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
                        timelineOperations: timelineOperations,
                    },
                },
            ]
        });

        const newMessages = [
            ...messages,
            {
                role: "assistant",
                ...{
                    chatMessage: chatMessage,
                    thresholdMet: mentorResponse.thresholdMet,
                    brief: mentorResponse.brief,
                }
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