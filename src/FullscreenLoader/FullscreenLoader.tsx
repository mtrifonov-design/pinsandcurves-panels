import React from "react";
import SvgIcon from "./SvgIcon";           // ← path to the logo component
import "./FullscreenLoader.css";          // ← the CSS just below

const FullscreenLoader: React.FC = () => (
  <div className="loader__backdrop">
    <div className="loader__logoWrap">
      {/* base – muted grey */}
      <SvgIcon className="loader__logoBase" />

      {/* shimmer layer – white, clipped by a moving gradient mask */}
      <SvgIcon className="loader__logoShimmer" />
    </div>
  </div>
);

export default FullscreenLoader;
