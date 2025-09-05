import json5 from "json5";

function parse(script: string) {
    const sections = script.split("---").map(section => {
        let firstSplit = section.split(":");
        let name = firstSplit[0].trim();
        let rest = firstSplit.slice(1).join(":").split("{");
        let keyword = rest[0];
        let json = rest.slice(1).join("{");
        name = name.trim();
        keyword = keyword.trim();
        json = json.trim();
        json = "{"+ json;
        json = json.substring(0, json.lastIndexOf("}")+1);
        if (name && keyword && json) {
            const parsedJSON = json5.parse(json);
            return {
                id: name,
                type: keyword,
                data: parsedJSON
            }
        }
        throw new Error("Invalid section format");
    });
    return sections;
};

export default parse;