function exportResources(buildCb :(s: string) => any[]) {
    return buildCb("@");
}


export default exportResources;