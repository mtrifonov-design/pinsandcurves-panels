uint seed_from_float(float f) {
    // Scale + floor gives you a stable integer key
    return uint(floor(f * 4294967296.0)); // 2^32
}

uint splitmix32(uint x) {
    x += 0x9E3779B9u;
    x = (x ^ (x >> 16)) * 0x85EBCA6Bu;
    x = (x ^ (x >> 13)) * 0xC2B2AE35u;
    x =  x ^ (x >> 16);
    return x;
}

uint stream(uvec3 key) {
    // Mix three uints into one, then avalanche.
    uint x = key.x * 0x9E3779B1u ^ key.y * 0x85EBCA77u ^ key.z * 0xC2B2AE3Du;
    return splitmix32(x);
}

float u01(uint x) {
    // 2^-32 ≈ 1/4294967296.0
    return float(x) * (1.0 / 4294967296.0);
}

