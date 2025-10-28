function assetGenerator() {
    const canvasSize = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.fillStyle = "white";
    ctx.font = "bold 400px Comic Sans MS";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A", canvasSize / 2, canvasSize / 2);
    return canvas.toDataURL("image/png");
}

export default assetGenerator;