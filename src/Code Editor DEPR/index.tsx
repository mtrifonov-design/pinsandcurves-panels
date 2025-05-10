// CodeEditor.tsx
import { useReducer, useRef } from "react";
import FullscreenLoader from "../FullscreenLoader/FullscreenLoader";
import { useUnit } from "../hooks";
import CONFIG from "../Config";
import Lobby from "./Lobby";
import CodeEditorContent from "./CodeEditorContent";


/* ─────────────────────── 1.  TYPES ────────────────────────────────────── */

enum Phase {
    NOT_INITIALISED = "NOT_INITIALISED",
    LOBBY = "LOBBY",
    OPEN_EDITOR = "OPEN_EDITOR",
    READY_TERMINATE = "READY_TERMINATE",
}

type Sub = {
    name: string;            // unique subscription name we created
    id?: string;             // server‑assigned id (after confirmation)
    assetId?: string;
    data?: unknown;
    unsubConfirmed?: boolean;
    closing?: boolean;
};

type Ctx = {
    phase: Phase;
    blockerId?: string;
    /** we know we have sent the INIT event once */
    initReceived: boolean;
    index: Sub;              // always present
    file?: Sub;              // present when user selects one
};

type Act =
    | { type: "SET_INIT_RECEIVED" }
    | { type: "INDEX_CONFIRMED"; id: string }
    | { type: "INDEX_DATA"; id: string; data: unknown;  }
    | { type: "OPEN_FILE_REQUEST"; assetId: string; subName: string }
    | { type: "FILE_CONFIRMED"; id: string; assetId?: string }
    | { type: "FILE_DATA"; id: string; data: unknown;  }
    | { type: "FILE_DELETED"; id: string }
    | { type: "REQUEST_CLOSE_FILE" }
    | { type: "TERMINATE"; blockerId: string }
    | { type: "UNSUB_CONFIRMED"; id: string }
    | { type: "BLOCKER_SENT" }
    | { type: "SUB_UPDATE"; id: string; update: unknown };   // ★ NEW

/* ─────────────────────── 2.  PURE REDUCER ─────────────────────────────── */

function reducer(state: Ctx, act: Act): Ctx {
    switch (act.type) {
        case "SET_INIT_RECEIVED":
            return { ...state, initReceived: true };

        case "INDEX_CONFIRMED":
            return { ...state, index: { ...state.index, id: act.id } };

        case "INDEX_DATA": {
            const next = {
                ...state,
                index: { ...state.index, data: act.data },
            };
            if (
                state.phase === Phase.NOT_INITIALISED &&
                next.index.id &&
                next.index.data !== undefined
            ) {
                next.phase = Phase.LOBBY;
            }
            return next;
        }

        case "OPEN_FILE_REQUEST":
            return {
                ...state,
                file: { name: act.subName, assetId: act.assetId },
            };

        case "FILE_CONFIRMED":                                     // ★ NEW
            return {
                ...state,
                file: {
                    ...state.file!,
                    id: act.id,
                    assetId: state.file?.assetId ?? act.assetId,         // keep existing or set new
                },
            };

        case "FILE_DATA":
            return {
                ...state,
                phase: Phase.OPEN_EDITOR,
                file: { ...state.file!, data: act.data },
            };

        case "FILE_DELETED":
            if (state.file?.id === act.id) {
                return { ...state, phase: Phase.LOBBY, file: undefined };
            }
            return state;

        case "TERMINATE":
            return { ...state, phase: Phase.READY_TERMINATE, blockerId: act.blockerId };

        case "REQUEST_CLOSE_FILE":                         // ★ NEW
            if (state.file) {
                return { ...state, file: { ...state.file, closing: true } };
            }
            return state;

        case "UNSUB_CONFIRMED": {
            let next = { ...state };
            if (state.index.id === act.id) {
                next.index = { ...state.index, unsubConfirmed: true };
            }

            // file logic: if closing → drop it and return to lobby
            if (state.file?.id === act.id) {
                if (state.file.closing) {
                    next = { ...state, phase: Phase.LOBBY, file: undefined };
                } else {
                    next.file = { ...state.file, unsubConfirmed: true };
                }
            }
            return next;
        }

        case "SUB_UPDATE":                                  // ★ NEW
            if (state.index.id === act.id) {
                return { ...state, index: { ...state.index, data: act.update } };
            }
            if (state.file?.id === act.id) {
                return { ...state, file: { ...state.file, data: act.update } };
            }
            return state;

        case "BLOCKER_SENT":
            return state; // terminal no‑op

        default:
            return state;
    }
}

/* ───────────────────── 3.  HELPERS ────────────────────────────────────── */

function sendSubscribe(assetId: string, subName: string) {
    CK_ADAPTER.pushWorkload({
        default: [{
            type: "worker",
            receiver: {
                instance_id: "ASSET_SERVER",
                modality: "wasmjs",
                resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`
            },
            payload: {
                subscribeToExistingAsset: {
                    asset_id: assetId,
                    subscription_name: subName,
                },
            },
        }],
    });
}

function sendUnsubscribe(assetId: string, subId: string) {
    CK_ADAPTER.pushWorkload({
        default: [{
            type: "worker",
            receiver: {
                instance_id: "ASSET_SERVER",
                modality: "wasmjs",
                resource_id: `${CONFIG.PAC_BACKGROUND_SERVICES}AssetServerV2`,
            },
            payload: {
                unsubscribeFromAsset: {
                    asset_id: assetId,
                    subscription_id: subId,
                },
            },
        }],
    });
}

function sendBlocker(blockerId: string) {
    CK_ADAPTER.pushWorkload({
        default: [{
            type: "blocker",
            blocker_id: blockerId,
            id: crypto.randomUUID(),
            blocker_count: 2,
        }],
    });
}

/* ──────────────────── 4.  INITIAL STATE ──────────────────────────────── */

function makeInitial(): Ctx {
    return {
        phase: Phase.NOT_INITIALISED,
        initReceived: false,
        index: { name: `CodeEditor_Index_${crypto.randomUUID()}` },
    };
}

/* ──────────────────── 5.  COMPONENT ──────────────────────────────────── */

export default function CodeEditor() {
    const [ctx, dispatch] = useReducer(reducer, undefined, makeInitial);

    /** remember whether we've already asked for the index once */
    const sentIndexSubscribe = useRef(false);

    //console.log("CodeEditor render", ctx);
    /* 5‑A — central event pump */
    useUnit(unit => {
        //console.log("CodeEditor unit", unit, ctx);
        const { payload } = unit;

        if (payload.receiveUpdate) {
            const { subscription_id, update } = payload.receiveUpdate;
            dispatch({ type: "SUB_UPDATE", id: subscription_id, update });
            return;
        }

        /* ---------- INIT arrives ---------- */
        if (payload.INIT && !ctx.initReceived) {
            dispatch({ type: "SET_INIT_RECEIVED" });

            // First subscription: index
            if (!sentIndexSubscribe.current) {
                sendSubscribe("index", ctx.index.name); // uses the V2 service
                sentIndexSubscribe.current = true;
            }
            return;
        }

        /* ---------- TERMINATE ---------- */
        if (payload.TERMINATE && ctx.phase !== Phase.READY_TERMINATE) {
            dispatch({ type: "TERMINATE", blockerId: payload.blocker_id });

            if (ctx.index.id) sendUnsubscribe("index", ctx.index.id);
            if (ctx.file?.id && ctx.file.assetId) sendUnsubscribe(ctx.file.assetId, ctx.file.id);
            return;
        }

        /* ---------- confirmations ---------- */
        if (payload.subscriptionConfirmation) {
            const { subscription_id, subscription_name } = payload.subscriptionConfirmation;

            if (subscription_name === ctx.index.name) {
                dispatch({ type: "INDEX_CONFIRMED", id: subscription_id });
            } else if (ctx.file && subscription_name === ctx.file.name) {
                dispatch({
                    type: "FILE_CONFIRMED",
                    id: subscription_id,
                    assetId: payload.subscriptionConfirmation.asset_id,    // may be undefined
                });
            }
            return;
        }

        /* ---------- asset data ---------- */
        if (payload.getAssetResponse) {
            const { subscription_id, asset_data } = payload.getAssetResponse;
            //   //console.log("getAssetResponse");  
            //   //console.log(payload.getAssetResponse);
            //   //console.log(ctx.index);
            //   //console.log("-----");

            if (subscription_id === ctx.index.id) {
                dispatch({ type: "INDEX_DATA", id: subscription_id, data: asset_data });
            } else if (subscription_id === ctx.file?.id) {
                dispatch({ type: "FILE_DATA", id: subscription_id, data: asset_data });
            }
            return;
        }

        /* ---------- delete notification ---------- */
        if (payload.deleteNotification) {
            const { subscription_id } = payload.deleteNotification;
            dispatch({ type: "FILE_DELETED", id: subscription_id });
            return;
        }

        /* ---------- unsubscribe confirmation ---------- */
        if (payload.unsubscribeConfirmation) {
            const { subscription_id } = payload.unsubscribeConfirmation;
            dispatch({ type: "UNSUB_CONFIRMED", id: subscription_id });

            // When we’re terminating, check whether all unsubs are done
            const idxDone = subscription_id === ctx.index.id || ctx.index.unsubConfirmed;
            const fileDone = ctx.file ? subscription_id === ctx.file.id || ctx.file.unsubConfirmed : true;

            if (
                ctx.phase === Phase.READY_TERMINATE &&
                idxDone && fileDone &&
                ctx.blockerId
            ) {
                sendBlocker(ctx.blockerId);
                dispatch({ type: "BLOCKER_SENT" });
            }
            return;
        }
    });

    /* 5‑B — user click to open a file */
    function handleOpen(assetId: string) {
        if (ctx.phase !== Phase.LOBBY) return;
        const subName = `CodeEditor_${assetId}_${crypto.randomUUID()}`;

        // effect first
        sendSubscribe(assetId, subName);

        // then state
        dispatch({ type: "OPEN_FILE_REQUEST", assetId, subName });
    }

    function handleCloseFile() {
        //console.log(ctx);
        if (ctx.phase !== Phase.OPEN_EDITOR || !ctx.file?.id) return;
        if (ctx.file.assetId) sendUnsubscribe(ctx.file.assetId, ctx.file.id);             // assetId placeholder still fine
        dispatch({ type: "REQUEST_CLOSE_FILE" });
    }

    /* 5‑C — render per state */
    if (ctx.phase === Phase.NOT_INITIALISED) return <FullscreenLoader />;

    if (ctx.phase === Phase.LOBBY) {
        // TODO: render list of files with onClick={() => handleOpen(id)}
        return <Lobby index={ctx.index} handleOpen={handleOpen} />
    }

    if (ctx.phase === Phase.OPEN_EDITOR && ctx.file) {
        return <CodeEditorContent file={ctx.file} index={ctx.index} handleCloseFile={handleCloseFile} />;
    }

    // READY_TERMINATE -> render nothing; component is shutting down
    return null;
}
