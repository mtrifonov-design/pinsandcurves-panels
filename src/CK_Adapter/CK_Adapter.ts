import { CK_Workload_Class } from "./CK_Workload";
import { OnUnit } from "./types";


const metadata_registry: any = {
}

class CK_Adapter {

  private PASSWORD: string | undefined;

  private installCallback: Function | undefined;
  constructor(installCallback: Function) {
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
          this.CK_RESOURCE_ID = resourceId;
          globalThis.CK_INSTANCE = this.CK_INSTANCE;
          const metadata = metadata_registry[resourceId];
          m = {
            ...m,
            payload: {
              ...payload,
              metadata: metadata,
            }
          }

          new Promise((resolve) => {
            if (this.installCallback) this.installCallback(
              resolve,
              this.onUnit.bind(this),
              this.pushWorkload.bind(this)
            );
          }).then(() => {
            window.parent.postMessage(m, "*");
          });
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
          this.computeUnit(unit);
        }
      }
    })
  }

  computing = false;
  computeUnit(unit: any) {
    this.computing = true;
    new Promise<undefined>((resolve) => {
      if (this.unitCallback) {
        const onDispatch = (w: unknown) => {
          this.computing = false;
          resolve(undefined);
          window.parent.postMessage({
            type: "ck-message",
            payload: {
              CK_COMPUTE: true,
              pw: this.PASSWORD,
              response: w,
            },
          }, "*");
        }
        // console.log("CK_Adapter: computeUnit", unit);
        const newWorkload = new CK_Workload_Class(onDispatch);
        this.unitCallback(unit, newWorkload);
        return;
      }
      setTimeout(() => {
        throw new Error("Timed out waiting for compute unit callback");
      }, 1000);
    })


  }

  unitCallback: OnUnit | undefined;
  onUnit(callback: OnUnit) {
    this.unitCallback = callback;
  }

  public CK_INSTANCE_ID: string | undefined;
  public CK_RESOURCE_ID: string | undefined;
  public get CK_INSTANCE() {
    if (!this.CK_INSTANCE_ID) {
      throw new Error("CK_INSTANCE_ID is not set");
    }
    return {
      instance_id: this.CK_INSTANCE_ID,
      resource_id: this.CK_RESOURCE_ID,
      modality: "iframe",
    };
  }

  pushWorkload(workload: unknown,metadata?: { [key: string]: unknown }) {
    window.parent.postMessage({
      type: "ck-message",
      payload: {
        PUSH_WORKLOAD: true,
        pw: this.PASSWORD,
        workload,
        metadata: metadata || {},
      },
    }, "*");
  }

}

export default CK_Adapter;