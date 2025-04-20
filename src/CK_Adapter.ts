

const metadata_registry : any = {
}

class CK_Adapter {

  private PASSWORD: string | undefined;

  private mode: "PUSH" | "COMPUTE" = "PUSH";

  private installCallback: Function | undefined;
  constructor(installCallback: Function) {
    //console.log("CK_Adapter constructor");
    this.installCallback = installCallback;
    window.addEventListener('message', (event) => {
      let m = event.data;
      if (
        m &&
        m.type &&
        m.type === "ck-message"
      ) {
        const payload = m.payload;
        const { CK_INSTALL } = payload;
        if (CK_INSTALL) {
          const { pw, instanceId, resourceId } = payload;
          this.PASSWORD = pw;
          this.CK_INSTANCE_ID = instanceId;
          const metadata = metadata_registry[resourceId];
          m = {
            ...m,
            payload: {
              ...payload,
              metadata: metadata,
            }
          }
          if (this.installCallback) this.installCallback();
          window.parent.postMessage(m, "*");
        }
      }
    })
    window.addEventListener('message', (event) => {
      const m = event.data;
      //console.log(JSON.stringify(m,null,2))
      if (
        m &&
        m.type &&
        m.type === "ck-message"
      ) {

        const payload = m.payload;
        const { CK_COMPUTE } = payload;
        if (CK_COMPUTE) {
          const { unit } = payload;
          this.mode = "COMPUTE";
          this.computeUnit(unit);
          this.release();
          this.mode = "PUSH";
        }
      }
    })
    globalThis.CK_ADAPTER = this;
  }

  release() {
    window.parent.postMessage({
      type: "ck-message",
      payload: {
        PUSH_WORKLOAD: this.mode === "PUSH" ? true : undefined,
        CK_COMPUTE: this.mode === "COMPUTE" ? true : undefined,
        pw: this.PASSWORD,
        response: this.mode === "COMPUTE" ? this.workload : undefined,
        workload: this.mode === "PUSH" ? this.workload : undefined,
      },
    }, "*");
    this.workload = {};
  }

  computeUnit(unit: any) {
    // console.log("computeUnit", unit);
    // console.log(this.unitCallback)
    if (this.unitCallback) {
      this.unitCallback(unit);
      this.pushWorkload({});
      return;
    }

    if (unit.payload.INIT === true) {
      const callback = this.channelCallbacks["INIT"];
      if (callback) {
        callback(unit);
        return;
      }
    }

    if (unit.payload.LOAD_SESSION) {
      unit.payload.channel = "LOAD_SESSION";
    }
    if (unit.payload.SAVE_SESSION) {
      unit.payload.channel = "SAVE_SESSION";
    }

    const channelId = unit.payload.channel;
    const channelCallback = this.channelCallbacks[channelId];
    if (channelCallback) {
      const result = channelCallback(unit);
    }
  }

  channelCallbacks: { [key: string]: Function } = {};
  onChannel(channelId: string, callback: Function) {
    this.channelCallbacks[channelId] = callback;
  }

  unitCallback: Function | undefined;
  onUnit(callback: Function) {
    this.unitCallback = callback;
  }

  public CK_INSTANCE_ID: string | undefined;

  workload = {};
  pushWorkload(workload: any) {
    // merge workload with existing workload on a thread level
    // console.log("MODE", this.mode, "PUSH_WORKLOAD", workload);
    const threadKeys = Object.keys(workload);
    for (const threadKey of threadKeys) {
      if (this.workload[threadKey] === undefined) {
        this.workload[threadKey] = [];
      }
      this.workload[threadKey] = this.workload[threadKey].concat(workload[threadKey]);
    }
    // schedule sendWorkload
    if (this.mode === "PUSH") {
      setTimeout(() => {
        this.release();
      }, 0);
    }
  }

}

export default CK_Adapter;