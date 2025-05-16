export const rand   = s     => (((Math.sin(s)*43758.5453123)%1)+1)/2;
export const randN  = (k,n=1.61803398875)=>rand(k+n);

export const easeInExpo = x => x===0 ? 0 : Math.pow(2,10*x-10);
export const easeInSine = x => 1-Math.cos((x*Math.PI)/2);
