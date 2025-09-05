// frames-to-mp4.ts
// A self‑contained helper that turns an array of data‑URL frames into a downloadable MP4
// using the WebCodecs API for H.264 encoding and the `mp4-muxer` library for containerisation.
//
// Author: ChatGPT – May 2025
//
// ────────────────────────────────────────────────────────────────────────────────
// INSTALL PEERS
//   npm i mp4-muxer                # tiny pure‑TS MP4 muxer – https://github.com/Vanilagy/mp4-muxer
//   # No extra install needed for WebCodecs – it ships with modern Chromium / Firefox Nightly.
//
// USAGE
//   import { framesToMp4 } from "./frames-to-mp4";
//   await framesToMp4(canvasFrames, { width: 1280, height: 720, fps: 30 });
//
// The call downloads "video.mp4" and additionally returns the Blob so you can
// e.g. upload it or show a preview.
// ────────────────────────────────────────────────────────────────────────────────

import { Muxer, ArrayBufferTarget } from "mp4-muxer";

/** Options accepted by {@link framesToMp4}. */
export interface Mp4Options {
  /** Width of each frame in pixels. */
  width: number;
  /** Height of each frame in pixels. */
  height: number;
  /** Frames per second for the output video. */
  fps: number;
  /** Approximate video bitrate in bits / s (default 1 Mb/s). */
  bitrate?: number;
  /** Filename suggested to the browser‟s download dialogue (default "video.mp4"). */
  filename?: string;
}

/**
 * Convert an array of data‑URL frames into an MP4 file and trigger a download.
 *
 * Each `frame` must come from the same source canvas and thus have identical
 * dimensions; pass those dimensions in {@link Mp4Options}. A Blob of the final
 * MP4 is returned for further use (uploading, object‑URL preview, …).
 *
 * @throws If the current browser lacks WebCodecs or H.264 support.
 */
export async function imagesToMp4(
  frames: string[],
  {
    width,
    height,
    fps,
    bitrate = 20e6, // 1 Mb/s
    filename = "video.mp4",
  }: Mp4Options,
): Promise<Blob> {
  // ── 1. Capability checks ───────────────────────────────────────────────────
  if (!("VideoEncoder" in globalThis)) {
    throw new Error("WebCodecs VideoEncoder is not available in this environment.");
  }

  // H.264 is the only codec that will safely fit into MP4 on the web.
  // We probe a short list of common profiles and pick the first supported.
//   const codecCandidates = [
//     "avc1.42001f",
//     // "avc1.42E01E", // Baseline 3.0 – widely supported
//     // "avc1.4D401E", // Main 3.0
//     // "avc1.64001F", // High 3.1
//   ];
//   let chosenCodec: string | undefined;

//   for (const c of codecCandidates) {
//     const { supported } = await VideoEncoder.isConfigSupported({
//       codec: c,
//       width,
//       height,
//       bitrate,
//       framerate: fps,
//       avc: { format: "annexb" },
//     });
//     if (supported) {
//       chosenCodec = c;
//       break;
//     }
//   }
//   if (!chosenCodec) {
//     throw new Error("None of the tested H.264 profiles are supported – “avc1” required for MP4.");
//   }

  // ── 2. Set up MP4 muxer ────────────────────────────────────────────────────
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { 
        codec: 'avc', 
        width, 
        height, 
        frameRate: fps,
    },
    fastStart: "in-memory", // Moves moov atom to the front so file plays immediately after download.
  });

  // ── 3. Set up the video encoder ────────────────────────────────────────────
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error("VideoEncoder error:", e),
  });

  encoder.configure({
    codec: 'avc1.42003D',
    width,
    height,
    bitrate,
    framerate: fps,
  });

  // ── 4. Feed frames ─────────────────────────────────────────────────────────
  const frameDurationUs = 1_000_000 / fps; // WebCodecs uses microseconds (µs).
  let pts = 0; // Presentation time‑stamp

  for (const dataUrl of frames) {
    //console.log("frame")
    // Turn data‑URL into an ImageBitmap without polluting DOM memory.
    const blob = await (await fetch(dataUrl)).blob();
    const bitmap = await createImageBitmap(blob);

    const videoFrame = new VideoFrame(bitmap, { 
      timestamp: pts,
    });
    encoder.encode(videoFrame);

    videoFrame.close();
    bitmap.close();

    pts += frameDurationUs;
  }

  // ── 5. Finalise ────────────────────────────────────────────────────────────
  await encoder.flush();
  encoder.close();

  muxer.finalize();
  const { buffer } = target;
  const mp4Blob = new Blob([buffer], { type: "video/mp4" });


  return mp4Blob;
}

