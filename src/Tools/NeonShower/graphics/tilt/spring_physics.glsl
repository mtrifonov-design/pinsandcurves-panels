//******************************************************************************
// Cached set of motion parameters that can be used to efficiently update
// multiple springs using the same time step, angular frequency and damping
// ratio.
//******************************************************************************
struct tDampedSpringMotionParams
{
    // newPos = posPosCoef*oldPos + posVelCoef*oldVel
    float m_posPosCoef, m_posVelCoef;
    // newVel = velPosCoef*oldPos + velVelCoef*oldVel
    float m_velPosCoef, m_velVelCoef;
};

//******************************************************************************
// This function will compute the parameters needed to simulate a damped spring
// over a given period of time.
// - An angular frequency is given to control how fast the spring oscillates.
// - A damping ratio is given to control how fast the motion decays.
//     damping ratio > 1: over damped
//     damping ratio = 1: critically damped
//     damping ratio < 1: under damped
//******************************************************************************
void CalcDampedSpringMotionParams(
    inout tDampedSpringMotionParams pOutParams, // motion parameters result
    float                           deltaTime,  // time step to advance
    float                           angularFrequency, // angular frequency of motion
    float                           dampingRatio)     // damping ratio of motion
{
    const float epsilon = 0.0001;

    // force values into legal range (use locals; don't write to params)
    float damping = max(dampingRatio, 0.0);
    float omega   = max(angularFrequency, 0.0);

    // if there is no angular frequency, the spring will not move and we can
    // return identity
    if ( omega < epsilon )
    {
        pOutParams.m_posPosCoef = 1.0; pOutParams.m_posVelCoef = 0.0;
        pOutParams.m_velPosCoef = 0.0; pOutParams.m_velVelCoef = 1.0;
        return;
    }

    if (damping > 1.0 + epsilon)
    {
        // over-damped
        float za = -omega * damping;
        float zb =  omega * sqrt(damping*damping - 1.0);
        float z1 = za - zb;
        float z2 = za + zb;

        float e1 = exp( z1 * deltaTime );
        float e2 = exp( z2 * deltaTime );

        float invTwoZb = 1.0 / (2.0*zb); // = 1 / (z2 - z1)

        float e1_Over_TwoZb = e1*invTwoZb;
        float e2_Over_TwoZb = e2*invTwoZb;

        float z1e1_Over_TwoZb = z1*e1_Over_TwoZb;
        float z2e2_Over_TwoZb = z2*e2_Over_TwoZb;

        pOutParams.m_posPosCoef =  e1_Over_TwoZb*z2 - z2e2_Over_TwoZb + e2;
        pOutParams.m_posVelCoef = -e1_Over_TwoZb    + e2_Over_TwoZb;

        pOutParams.m_velPosCoef = (z1e1_Over_TwoZb - z2e2_Over_TwoZb + e2)*z2;
        pOutParams.m_velVelCoef = -z1e1_Over_TwoZb + z2e2_Over_TwoZb;
    }
    else if (damping < 1.0 - epsilon)
    {
        // under-damped
        float omegaZeta = omega * damping;
        float alpha     = omega * sqrt(1.0 - damping*damping);

        float expTerm = exp( -omegaZeta * deltaTime );
        float cosTerm = cos( alpha * deltaTime );
        float sinTerm = sin( alpha * deltaTime );

        float invAlpha = 1.0 / alpha;

        float expSin = expTerm*sinTerm;
        float expCos = expTerm*cosTerm;
        float expOmegaZetaSin_Over_Alpha = expTerm*omegaZeta*sinTerm*invAlpha;

        pOutParams.m_posPosCoef = expCos + expOmegaZetaSin_Over_Alpha;
        pOutParams.m_posVelCoef = expSin*invAlpha;

        pOutParams.m_velPosCoef = -expSin*alpha - omegaZeta*expOmegaZetaSin_Over_Alpha;
        pOutParams.m_velVelCoef =  expCos - expOmegaZetaSin_Over_Alpha;
    }
    else
    {
        // critically damped
        float expTerm     = exp( -omega*deltaTime );
        float timeExp     = deltaTime*expTerm;
        float timeExpFreq = timeExp*omega;

        pOutParams.m_posPosCoef = timeExpFreq + expTerm;
        pOutParams.m_posVelCoef = timeExp;

        pOutParams.m_velPosCoef = -omega*timeExpFreq;
        pOutParams.m_velVelCoef = -timeExpFreq + expTerm;
    }
}

//******************************************************************************
// This function will update the supplied position and velocity values over
// according to the motion parameters.
//******************************************************************************
void UpdateDampedSpringMotion(
    inout float                     pPos,            // position value to update
    inout float                     pVel,            // velocity value to update
    float                           equilibriumPos,  // position to approach
    tDampedSpringMotionParams       params)          // motion parameters to use
{
    float oldPos = pPos - equilibriumPos; // update in equilibrium relative space
    float oldVel = pVel;

    pPos = oldPos*params.m_posPosCoef + oldVel*params.m_posVelCoef + equilibriumPos;
    pVel = oldPos*params.m_velPosCoef + oldVel*params.m_velVelCoef;
}
