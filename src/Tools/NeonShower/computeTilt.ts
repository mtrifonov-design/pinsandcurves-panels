

const tiltMax = Math.PI / 10;  // 18° clamp
const omega   = 10.0;          // spring natural frequency (rad/s)
const zeta    = 0.9;           // damping ratio (critically damped-ish)
const kInput  = 0.005;         // gain: slider velocity -> tilt "kick"

function clamp(x, minVal, maxVal) {
    return Math.min(Math.max(x, minVal), maxVal);
}

function computeTilt({
    xNow,
    xPrev,
    now,
    before,
    thetaNow,
    thetaPrev,
}) {
    const dt = Math.max(0.001, (now-before) / 1000);

  // Compute slider "velocity" in pixels/sec from only xNow and xPrev
  const vx = (xNow - xPrev) / dt;
  let theta = thetaNow;
  let thetaDot = (thetaNow - thetaPrev) / dt;

  // --- Tilt dynamics: mass-spring-damper with input from vx ---
  // theta_ddot = kInput*vx - 2*zeta*omega*thetaDot - (omega^2)*theta
  const thetaDDot = kInput * vx - 2 * zeta * omega * thetaDot - (omega * omega) * theta;

  // Integrate
  thetaDot += thetaDDot * dt;
  theta    += thetaDot * dt;

  // Clamp for safety
  //theta = clamp(theta, -tiltMax, tiltMax);
  return theta;
}

export default computeTilt;