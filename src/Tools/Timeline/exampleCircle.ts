import { exportResources, external } from "../../LibrariesAndUtils/NectarGL/Builder";
import ExampleCircle from "../../LibrariesAndUtils/StandardGraphics/exampleCircle";


function exampleCircleGraphics() {
    return exportResources(ExampleCircle({
        quad: external("quad"),
        quadSig: external("quadSig"),
        canvasSig: external("canvasSig"),
        compositionGlobal: external("compositionGlobal"),
        compositionGlobalSig: external("compositionGlobalSig"),
        inputTexture: external("inputTexture"),
        exportName: "exampleCircle",
    }));
}

export { exampleCircleGraphics };