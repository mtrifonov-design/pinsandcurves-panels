

const metadata_registry : any = {
}

class CK_Adapter {

  private PASSWORD: string | undefined;

  private installCallback: Function | undefined;
  constructor(installCallback: Function) {
    ////console.log("CK_Adapter constructor");
    this.installCallback = installCallback;
    window.addEventListener('message', (event) => {
      let m = event.data;
      if (
        m &&
        m.type &&
        m.type === "ck-message"
      ) {
        const payload = m.payload;
        // //console.log("CK_Adapter", JSON.stringify(payload, null, 2));
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
          
          new Promise((resolve) => {
            if (this.installCallback) this.installCallback(resolve);
          }).then(() => {
            window.parent.postMessage(m, "*");
          });
        }
      }
    })
    window.addEventListener('message', (event) => {
      const m = event.data;
      ////console.log(JSON.stringify(m,null,2))
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
    console.log("CK_Adapter release", this.workload);
    window.parent.postMessage({
      type: "ck-message",
      payload: {
        PUSH_WORKLOAD: !this.computing ? true : undefined,
        CK_COMPUTE: this.computing ? true : undefined,
        pw: this.PASSWORD,
        response: this.computing ? this.workload : undefined,
        workload: !this.computing ? this.workload : undefined,
      },
    }, "*");
    this.computing = false;
    this.requestedManualRelease = false;
    this.workload = {};
  }

  computing = false;
  computeUnit(unit: any) {
    // //console.log("computeUnit", unit);
    // //console.log(this.unitCallback)
    this.computing = true;
    if (this.unitCallback) {
      this.unitCallback(unit);
      return;
    }

    if (unit.payload.INIT === true) {
      const callback = this.channelCallbacks["INIT"];
      if (callback) {
        callback(unit);
        return;
      }
    }

    this.release();
  }

  unitCallback: Function | undefined;
  onUnit(callback: Function) {
    this.unitCallback = callback;
  }

  public CK_INSTANCE_ID: string | undefined;

  requestedManualRelease = false;
  requestManualRelease() {
    this.requestedManualRelease = true;
  }

  workload = {};
  pushWorkload(workload: any, release?: boolean) {
    const threadKeys = Object.keys(workload);
    for (const threadKey of threadKeys) {
      if (this.workload[threadKey] === undefined) {
        this.workload[threadKey] = [];
      }
      this.workload[threadKey] = this.workload[threadKey].concat(workload[threadKey]);
    }

    if (this.computing && this.requestedManualRelease && release) {
      this.release();
    } 
    if (!this.computing) {
      this.release();
    }
  }

}

export default CK_Adapter;