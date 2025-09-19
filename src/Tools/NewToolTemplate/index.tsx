import React, { useState, useEffect, useRef, useCallback } from 'react';
import { throttle } from 'lodash';
import Main from './graphics/main.js';
import defaultControls from './controls.js';
import renderStateReducer from './graphics/streams/renderStateReducer.js';
import EffectFoundation, { useEffectFoundation } from '../../LibrariesAndUtils/EffectFoundation/index.js';
import { exportResources } from '../../LibrariesAndUtils/NectarGL/Builder/index.js';
import { JSONAssetCreator } from '../../LibrariesAndUtils/JSONAsset/Provider.js';
import View from './view.js';

export function ToolInterior() {
  const {
    controls,
    graphics,
    index,
    local,
    timeline,
    composition,
    updateControls,
    updateGraphics,
    updateLocal,
    updateComposition
  } = useEffectFoundation();
  const state = local;


  useEffect(() => {
    const project = timeline.project;
    const focusRange = project.timelineData.focusRange;
    if (focusRange[1] !== 300) {
      timeline.projectTools.updateFocusRange([0, 300], true);
    }
  }, [timeline])

  const dimensionsRef = useRef([-1, -1]);
  const updateCb = useCallback(throttle((state, patch: Partial<NewControls>, composition) => {
    const nextLocal = { ...state, ...patch };
    updateLocal(nextLocal);
    // if (nextLocal.canvasWidth !== dimensionsRef.current[0] || nextLocal.canvasHeight !== dimensionsRef.current[1]) {
    //   dimensionsRef.current = [nextLocal.canvasWidth, nextLocal.canvasHeight];
    //   updateComposition({ ...composition, canvasDimensions: [nextLocal.canvasWidth, nextLocal.canvasHeight] });
    // }

    // const nextControls = renderStateReducer(nextLocal);
    // updateControls(nextControls);
  }, 50), []);

  const update = (patch: Partial<NewControls>) => {
    updateCb(state, patch, composition);
  };
  return <View update={update} state={state} />;
}

export default function Tool() {
  // const [loadedImage, setLoadedImage] = useState<string | null>(null);
  // useEffect(() => {
  //   const img = new Image();
  //   img.src = `/pinsandcurves-panels/neonshower/showerhead.png`;
  //   img.onload = () => {
  //     const canvas = document.createElement('canvas');
  //     canvas.width = img.width;
  //     canvas.height = img.height;
  //     const ctx = canvas.getContext('2d');
  //     ctx?.drawImage(img, 0, 0);
  //     const dataUrl = canvas.toDataURL();
  //     setLoadedImage(dataUrl);
  //   };
  // }, []);

  return <EffectFoundation
    defaultControls={renderStateReducer("newTool",defaultControls)}
    defaultGraphics={exportResources(Main())}
    defaultLocal={defaultControls}
    effectInstanceName='NeonShowerV0'
  >
    <>
      <ToolInterior />
      {/* {loadedImage && <JSONAssetCreator
        defaultName="showerhead.png"
        defaultData={loadedImage}
        defaultType={"png"}
      ><></></JSONAssetCreator>} */}
    </>
  </EffectFoundation>;
}