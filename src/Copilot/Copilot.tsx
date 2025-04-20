import React, { useState } from "react";
import OpenAI from "openai";
import ChatComponent from "./CopilotInner";
import { ProjectDataStructure } from "@mtrifonov-design/pinsandcurves-external";

type Project = ProjectDataStructure.PinsAndCurvesProject;

const ChatWithApiKeyWrapper = (p: {
    project: Project,
    persistentState: any,
    setPersistentState: (state: any) => void,
    assets: any[],
}) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem("openai_api_key") || "");
  const [isKeySet, setIsKeySet] = useState(localStorage.getItem("openai_api_key") !== null);

  const handleApiKeySubmit = () => {
    if (apiKey.trim()) {
      setIsKeySet(true);
    }
  };

  // If user hasn't provided a key yet, show the "password" input.
  if (!isKeySet) {
    return (
      <div style={{ width: "400px", margin: "50px auto", textAlign: "center" }}>
        <h3>Please Enter Your OpenAI API Key</h3>
        <input
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          style={{ marginBottom: "10px", width: "100%", padding: "8px" }}
        />
        <br />
        <button onClick={handleApiKeySubmit} style={{ padding: "8px 16px" }}>
          Enter
        </button>
      </div>
    );
  }

  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
  localStorage.setItem("openai_api_key", apiKey);

  // Pass the openai instance to the child ChatComponent
  return <ChatComponent openai={openai} project={p.project} 
  persistentState={p.persistentState}
  setPersistentState={p.setPersistentState}
  assets={p.assets}
  />;
};

export default ChatWithApiKeyWrapper;
