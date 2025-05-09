

const PRODUCTION = false;

const CONFIG = {
    PAC_BACKGROUND_SERVICES: PRODUCTION ? 
    "https://mtrifonov-design.github.io/pinsandcurves-background-services/" 
    : "http://localhost:8000/",
    SELF_HOST: PRODUCTION ?
    "https://mtrifonov-design.github.io/pinsandcurves-panels/#"
    : "http://localhost:5174/#",
}


export default CONFIG;