class CachedStream {

    versionId = "start";
    commands = [];

    constructor() { }

    getStream() {
        return {
            versionId: this.versionId,
            commands: this.commands
        };
    }

    updateStream(commands: any[], versionId?: string) {
        if (versionId) {
            this.versionId = versionId;
        } else {
            this.versionId = JSON.stringify(commands);
        }
        this.commands = commands;
    }

}

export default CachedStream;