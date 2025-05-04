import { useRef } from "react";
import { useAssets } from "./useAssets";

class IndexController {

    initialised = false
    data : any;
    constructor() {}
    load(data : any) {
        this.data = data;
        this.initialised = true;
    }
    receiveUpdate(update: any) {
        this.data = update;
    }
    getSnapshot() {
        return this.data;
    }
    update : (u: any) => void;
    create : (c: any) => void;
    delete : (d: any) => void;
    subscribe : (s: any) => void;
    unsubscribe : (u: any) => void;
    setHooks(hooks) {
        this.update = hooks.update;
        this.create = hooks.create;
        this.delete = hooks.delete;
        this.subscribe = hooks.subscribe;
        this.unsubscribe = hooks.unsubscribe;
    }
}

export function useIndex() {
    const indexController = useRef(new IndexController())
    const { initialized, assets } = useAssets([
        { assetId: "index", assetController: indexController.current }
    ])

    if (!initialized) {
        return {
            initialized,
            index: undefined
        }
    }

    return {
        initialized,
        index: assets["index"]
    }

}
  