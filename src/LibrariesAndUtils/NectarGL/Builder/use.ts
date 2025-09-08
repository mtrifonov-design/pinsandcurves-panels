function Use(data: {
    id: string,
    type: string,
    data: any
}[], bindings? : {
    [key: string]: string
}) {
    return {
        type: "Use",
        data : {
            resources: data,
            bindings: bindings || {}
        }
    }
};

export default Use;