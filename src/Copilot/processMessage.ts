import SystemPrompt from "./SystemPrompt";
import StructuredOutputFormat from "./StructuredOutputFormat";
import OpenAI from "openai";
import { ProjectDataStructure } from "@mtrifonov-design/pinsandcurves-external";
type Project = ProjectDataStructure.PinsAndCurvesProject;

import { prompt as CodeAssistantPrompt, format as CodeAssistantFormat } from './AgentNetwork/CodeAssistantPrompt'
import { prompt as SignalAssistantPrompt, format as SignalAssistantFormat } from './AgentNetwork/SignalAssistantPrompt'
import callAgent from "./callAgent";
import CONFIG from "../Config";

const NANO = "gpt-4.1-nano-2025-04-14";
const MINI = "gpt-4.1-mini-2025-04-14";
const BIG = "gpt-4.1-2025-04-14"

const BASE_MODEL = MINI;

function formatSketch(appState: Project) {
    const p5jsSketch = appState.signalData["HIDDEN_CODE"]?.defaultValue;
    const content = `
    <P5JS_SKETCH>${p5jsSketch}</P5JS_SKETCH>
    `
    return content;
}

function formatSignals(appState: Project) {
    const signalData = appState.signalData;
    const timelineData = appState.timelineData;
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

    const content = `
    <SIGNALS>${JSON.stringify({timelineData,signals}, null, 2)}</SIGNALS>
    `
    return content;
}


function formatSignalsShort(appState: Project) {
    const signalData = appState.signalData;
    const signals = Object.values(signalData).map((signal) => ({
        id: signal.id,
        name: appState.orgData.signalNames[signal.id],
        type: signal.type,
        range: signal.range,
        defaultValue: signal.defaultValue,
    })).filter((signal) => signal.id !== "HIDDEN_CODE");

    const content = `
    <SIGNALS>${JSON.stringify(signals, null, 2)}</SIGNALS>
    `
    return content;
}

function formatAssistantContent(msg: any, assistantType: string) {
    if (assistantType === "signals") {
        return `
        <TIMELINE_OPERATIONS>${msg.timelineOperations}</TIMELINE_OPERATIONS>
        <CHAT_MESSAGE>${msg.chatMessage}</CHAT_MESSAGE>
        `;
    }
    if (assistantType === "code") {
        return `
        <P5JS_SKETCH>${msg.p5jsSketch}</P5JS_SKETCH>
        <CHAT_MESSAGE>${msg.chatMessage}</CHAT_MESSAGE>
        `;
    }

}


async function processMessage(messages: any, project: Project, assets: any[], openai: OpenAI, assistantType: string) {
    try {

        // extract the last uninterrrupted stretch of messages tagged with assistantType : the current assistant type
        messages = messages.filter((msg: any) => msg.role === "assistant" || msg.assistantType === assistantType);
        let messagesForAssistant = [];
        messages.forEach((msg: any, index: number) => {
            if (msg.role === "user") {
                messagesForAssistant.push({
                    role: "user",
                    content: msg.chatMessage,
                });
            } else if (msg.role === "assistant") {
                messagesForAssistant.push({
                    role: "assistant",
                    content: formatAssistantContent(msg,assistantType),
                });
            }
        })
        // only keep the last 15 messages
        messagesForAssistant = messagesForAssistant.slice(-15);
        let timelineOperations = [];
        let chatMessage = "";
        let p5jsSketch = "";

        if (assistantType === "code") {
            messagesForAssistant.push({
                role: "user",
                content: JSON.stringify(assets, null, 2),
            });
            messagesForAssistant.push({
                role: "user",
                content: formatSignalsShort(project),
            });
            messagesForAssistant.push({
                role: "user",
                content: formatSketch(project),
            });

            const response = await callAgent({
                model: BIG,
                prompt: CodeAssistantPrompt,
                format: CodeAssistantFormat,
            }, messagesForAssistant, openai);
            //console.log("Code Assistant Response: ", response);

            if (response.p5jsChangesNeeded) {
                timelineOperations.push(`projectTools.updateSignalDefaultValue("HIDDEN_CODE", \`${response.p5jsSketch}\`)`);
            }

            chatMessage = response.chatMessage;
            p5jsSketch = response.p5jsSketch;
        }

        if (assistantType === "signals") {
            messagesForAssistant.push({
                role: "user",
                content: formatSignals(project),
            });
            const response = await callAgent({
                model: BASE_MODEL,
                prompt: SignalAssistantPrompt,
                format: SignalAssistantFormat,
            }, messagesForAssistant, openai);
            //console.log("Signal Assistant Response: ", response);

            if (response.timelineChangesNeeded) timelineOperations = response.timelineOperations;
            chatMessage = response.chatMessage;
        }

        globalThis.CK_ADAPTER.pushWorkload({
            default: [
                {
                    type: "worker",
                    receiver: {
                        instance_id: "COPILOT_EVAL",
                        modality: "wasmjs",
                        resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}CopilotEval`,
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
                    p5JsSketch: p5jsSketch,
                    assistantType: assistantType,
                    timelineOperations: timelineOperations,
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