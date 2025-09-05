export default async function resolveGLSL(lines,base) {
    if (!Array.isArray(lines))
        lines = lines.split(/\r?\n/);
  
    let src = "";
    const response = await Promise.all(
        lines.map(async (line, i) => {
            const line_trim = line.trim();
            if (line_trim.startsWith('#include "')) {
                let include_url = line_trim.substring(10);
                include_url = include_url.replace(/\"|\;|\s/g, "");
                const text = await fetch(base+"/"+include_url).then((res) => res.text());
                return await resolveGLSL(text,base);
            }
            else
                return line;
        })
    );
    return response.join("\n");
}