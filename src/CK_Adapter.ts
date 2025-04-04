

class CK_Adapter {

    private PASSWORD: string | undefined;

    private installCallback: Function | undefined;
    constructor(installCallback: Function) {
        this.installCallback = installCallback;
        window.addEventListener('message', (event) => {
            const m = event.data;
            if (
              m &&
              m.type &&
              m.type === "ck-message"
            ) {
              const payload = m.payload;
              const { CK_INSTALL } = payload;
              if (CK_INSTALL) {
                const { pw, instanceId } = payload;
                this.PASSWORD = pw;
                this.CK_INSTANCE_ID = instanceId;
                if (this.installCallback) this.installCallback();
                window.parent.postMessage(m, "*");
              }
            }
          })
          window.addEventListener('message', (event) => {
            const m = event.data;
            if (
              m &&
              m.type &&
              m.type === "ck-message"
            ) {
              const payload = m.payload;
              const { CK_COMPUTE } = payload;
              if (CK_COMPUTE) {
                const { unit } = payload;
                const result = this.computeUnit(unit);
                window.parent.postMessage({
                  type: "ck-message",
                  payload: {
                    CK_COMPUTE: true,
                    pw: this.PASSWORD,
                    response: result,
                  },
                }, "*");
              }
            }
          })
          globalThis.CK_ADAPTER = this;
    }

    computeUnit(unit: any) {
        if (unit.payload.channel === undefined) return {};
        const channelId = unit.payload.channel;
        const channelCallback = this.channelCallbacks[channelId];
        if (channelCallback) {
            const result = channelCallback(unit);
            return result;
        }
        return {};
    }

    channelCallbacks : { [key: string]: Function } = {};
    onChannel(channelId: string, callback: Function) {
        this.channelCallbacks[channelId] = callback;
    }

    public CK_INSTANCE_ID: string | undefined;




    pushWorkload(workload : any) {
        window.parent.postMessage({
          type: "ck-message",
          payload: {
            PUSH_WORKLOAD: true,
            pw: this.PASSWORD,
            workload,
          },
        }, "*");
    }

}

export default CK_Adapter;