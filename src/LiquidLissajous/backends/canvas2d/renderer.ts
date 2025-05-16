export class Canvas2DRenderer {
    constructor(canvas, raySys){
        this.ctx     = canvas.getContext('2d');
        this.raySys  = raySys;
        this.center  = {x:canvas.width*0.5, y:canvas.height*0.5};
    }
    draw(){
        const ctx = this.ctx;
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);

        //console.log(this.raySys.count,this.raySys.BURST_MAX);
        const {buffer,count} = this.raySys;
        for (let i=0;i<count;++i){
            const o   = i*12;
            const a   = buffer[o],  v = buffer[o+1];
            const s   = buffer[o+2],e = buffer[o+3];
            const cA  = `rgb(${buffer[o+6]*255|0},${buffer[o+7]*255|0},${buffer[o+8]*255|0})`;
            const cB  = `rgb(${buffer[o+9]*255|0},${buffer[o+10]*255|0},${buffer[o+11]*255|0})`;

            // draw two simple line segments: start→mid (cA), mid→end (cB)
            const asp = ctx.canvas.width / ctx.canvas.height;
            const dir = {x:Math.cos(a)/asp, y:Math.sin(a)};
            const p0  = {x:this.center.x+dir.x*s*this.center.y,
                         y:this.center.y+dir.y*s*this.center.y};
            const p1  = {x:this.center.x+dir.x*e*this.center.y,
                         y:this.center.y+dir.y*e*this.center.y};
            ctx.strokeStyle = cA;
            ctx.beginPath(); ctx.moveTo(this.center.x,this.center.y);
            ctx.lineTo(p0.x,p0.y); ctx.stroke();
            ctx.strokeStyle = cB;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(p0.x,p0.y); ctx.lineTo(p1.x,p1.y); ctx.stroke();
        }
    }
}
