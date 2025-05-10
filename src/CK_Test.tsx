import { useEffect, useRef } from "react";

function CK_Test() {

    const guard = useRef(false);
    useEffect(() => {
        if (guard.current) return;
        guard.current = true;
        globalThis.CK_ADAPTER.onChannel("default", (unit) => {
            ////console.log("unit",unit);
            return {};
        })
        globalThis.CK_ADAPTER.pushWorkload({
            "default": [
                {
                    "type": "worker",
                    receiver: {
                        instance_id: "TESTER",
                        modality: "wasmjs",
                        resource_id: "http://localhost:5174/test.js",
                    },
                    payload: globalThis.CK_ADAPTER.CK_INSTANCE_ID,
                }
            ]
        })
    }, []);

  return (
    <div>
      <h1>CK_Test</h1>
      <p>CK_Test</p>
    </div>
  );
}

export default CK_Test;