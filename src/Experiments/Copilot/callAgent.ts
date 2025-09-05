import OpenAI from "openai";

async function callAgent(agent : { model: string, prompt: string, format: string}, messageHistory : any[], openai : OpenAI) {
    const { prompt, format, model } = agent;
    const response = await openai.responses.create({
        model,
        input: [
            { "role": "system", "content": prompt },
            ...messageHistory,
        ],
        text: format,
    });
    const event = JSON.parse(response.output[0].content[0].text);
    return event;
}

export default callAgent;