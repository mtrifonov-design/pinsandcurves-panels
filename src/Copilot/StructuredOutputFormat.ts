const StructuredOutputFormat = {
    format: {
      type: "json_schema",
      name: "chatResponse",
      schema: {
        type: "object",
        properties: {
            chatMessage: { 
            type: "string" 
          },
          timelineOperations: { 
            type: "array", 
            items: { 
              type: "string" 
            } 
          },
          notesToSelf: { 
            type: "string" 
          },
        },
        required: ["chatMessage", "timelineOperations", "notesToSelf"],
        additionalProperties: false,
      },
    }
  };

export default StructuredOutputFormat;