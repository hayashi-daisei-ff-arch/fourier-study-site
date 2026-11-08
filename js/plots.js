import { N2 } from './signals.js';
const BLUE='#2686b8',ORANGE='#e29459',GRID='#e7eef1',INK='#758c96';
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const phaseTick=(v)=>{
  if(Math.abs(v)<1e-8)return '0';
  if(Math.abs(Math.abs(v)-Math.PI)<1e-8)return v>0?'π':'−π';
  if(Math.abs(Math.abs(v)-Math.PI/2)<1e-8)return v>0?'π/2':'−π/2';
  return v.toFixed(2);
};

function setup(canvas) {
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(160,canvas.getBoundingClientRect().width||320);
  const h=Math.max(85,canvas.getBoundingClientRect().height||190);
  canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx,w,h};
}
export function drawLine(canvas, series, range=null, isSpec=false, isPhase=false, compact=false) {
  const {ctx,w,h}=setup(canvas);
  ctx.clearRect(0,0,w,h);
  const l=compact?6:34,r=compact?6:12,t=compact?10:14,b=compact?8:27;
  const pw=w-l-r,ph=h-t-b;
  let min=range?range.min:Infinity,max=range?range.max:-Infinity;
  if(!range){for(const s of series)for(const v of s.data){if(Number.isFinite(v)){min=Math.min(min,v);max=Math.max(max,v);}}}
  if(!Number.isFinite(min)||!Number.isFinite(max)){min=-1;max=1;}
  if(Math.abs(max-min)<1e-8){const pad=Math.max(.1,Math.abs(max)*.1);min-=pad;max+=pad;}
  if(!compact){
    ctx.lineWidth=1;ctx.font='10px system-ui';ctx.fillStyle=INK;
    for(let j=0;j<=4;j++){
      const yy=t+ph*j/4;
      ctx.beginPath();ctx.strokeStyle=GRID;ctx.moveTo(l,yy);ctx.lineTo(w-r,yy);ctx.stroke();
      const v=max-(max-min)*j/4;
      ctx.textAlign='right';ctx.fillText(isPhase?phaseTick(v):(v===0?'0':Math.abs(v)<.01?v.toExponential(1):v.toFixed(Math.abs(v)<3?2:1)),l-5,yy+3);
    }
    for(let j=0;j<=4;j++){
      const xx=l+pw*j/4;
      ctx.beginPath();ctx.strokeStyle=GRID;ctx.moveTo(xx,t);ctx.lineTo(xx,t+ph);ctx.stroke();
      ctx.textAlign='center';ctx.fillText(String(Math.round(-128+255*j/4)),xx,h-8);
    }
    if(isPhase){ctx.fillStyle='#6b8d97';ctx.textAlign='left';ctx.fillText('rad',l+4,t+9);}
  } else {
    ctx.strokeStyle=GRID;ctx.beginPath();ctx.moveTo(l,t+ph*.5);ctx.lineTo(l+pw,t+ph*.5);ctx.stroke();
  }
  if(min<=0&&max>=0){const y=t+ph*max/(max-min);ctx.strokeStyle='#cadbdf';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(l,y);ctx.lineTo(l+pw,y);ctx.stroke();}
  for(const s of series){
    const color=s.color||BLUE;
    if(isPhase){
      // DFT phase is defined per frequency bin, not a continuous curve. For
      // pure sinusoids only one or two bins may have non-negligible magnitude.
      // Drawing line segments through isolated bins produces a blank canvas.
      const count=Array.from(s.data).filter(Number.isFinite).length;
      const radius=count<=32?3.8:count<=100?2.7:1.8;
      const baseline=t+max/(max-min)*ph;
      if(count<=48){
        ctx.strokeStyle=color;ctx.lineWidth=1.2;
        for(let i=0;i<s.data.length;i++){
          const v=s.data[i];if(!Number.isFinite(v))continue;
          const x=l+i/Math.max(1,s.data.length-1)*pw,y=t+(max-v)/(max-min)*ph;
          ctx.beginPath();ctx.moveTo(x,baseline);ctx.lineTo(x,y);ctx.stroke();
        }
      }
      ctx.fillStyle=color;
      for(let i=0;i<s.data.length;i++){
        const v=s.data[i];if(!Number.isFinite(v))continue;
        const x=l+i/Math.max(1,s.data.length-1)*pw,y=t+(max-v)/(max-min)*ph;
        ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();
      }
      continue;
    }
    ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=compact?1.7:1.9;let drawing=false;
    s.data.forEach((v,i)=>{
      if(!Number.isFinite(v)){drawing=false;return;}
      const x=l+(i/Math.max(1,s.data.length-1))*pw,y=t+(max-v)/(max-min)*ph;
      if(drawing)ctx.lineTo(x,y);else {ctx.moveTo(x,y);drawing=true;}
    });ctx.stroke();
  }
}
export function specSeries(spec,kind,scale=256){
  const n=spec.re.length;
  const mags=Float64Array.from(spec.re,(v,i)=>Math.hypot(v,spec.im[i]));
  const maxmag=mags.reduce((m,v)=>Math.max(m,v),0);
  const a=new Float64Array(n);
  for(let i=0;i<n;i++){
    const j=(i+n/2)%n;
    if(kind==='mag')a[i]=mags[j]/scale;
    if(kind==='re')a[i]=spec.re[j]/scale;
    if(kind==='im')a[i]=spec.im[j]/scale;
    if(kind==='phase')a[i]=(mags[j]>Math.max(1e-9,maxmag*1e-4))?Math.atan2(spec.im[j],spec.re[j]):NaN;
  }
  return a;
}
export function spectrumRange(arr1,arr2,kind){
  if(kind==='phase')return {min:-Math.PI,max:Math.PI};
  let m=0;
  for(const a of [arr1,arr2])for(let i=0;i<a.length;i++)if(Number.isFinite(a[i]))m=Math.max(m,Math.abs(a[i]));
  return kind==='mag'?{min:0,max:Math.max(.0001,m*1.1)}:{min:-Math.max(.0001,m*1.08),max:Math.max(.0001,m*1.08)};
}
export function signalRange(...arrays){
  let m=.5;
  for(const a of arrays)for(let i=0;i<a.length;i++)m=Math.max(m,Math.abs(a[i]));
  return {min:-m*1.12,max:m*1.12};
}
const pixel=(r,g,b)=>[Math.round(clamp(r,0,255)),Math.round(clamp(g,0,255)),Math.round(clamp(b,0,255))];
function colorDiverging(v){
  const a=clamp(Math.abs(v));
  return v<0?pixel(226-164*a,232-90*a,237-47*a):pixel(226+23*a,232-105*a,237-156*a);
}
export function imageRange(a,b) {
  let min=0,max=1;
  for(const arr of [a,b]) for(let i=0;i<arr.length;i++){
    if(arr[i]<min)min=arr[i];if(arr[i]>max)max=arr[i];
  }
  return {min,max,signed:min<-.0001};
}
export function drawImage(canvas, a, range, n=N2) {
  canvas.width=n;canvas.height=n;
  const ctx=canvas.getContext('2d');const img=ctx.createImageData(n,n);
  const vscale=Math.max(Math.abs(range.min),Math.abs(range.max),1e-9);
  for(let i=0;i<a.length;i++){
    let color;
    if(range.signed)color=colorDiverging(a[i]/vscale);
    else {const z=clamp((a[i]-range.min)/Math.max(1e-9,range.max-range.min));const v=Math.round(z*255);color=[v,v,v];}
    img.data.set([...color,255],i*4);
  }
  ctx.putImageData(img,0,0);
}
function phaseColor(phi){
  const h=(phi+Math.PI)/(2*Math.PI)*6;
  const c=1,x=c*(1-Math.abs(h%2-1));
  const vals=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];
  return vals.map(v=>Math.round(45+v*195));
}
export function spec2Range(F,G,kind){
  let m=0;
  for(const s of [F,G])for(let i=0;i<s.re.length;i++)m=Math.max(m,kind==='re'?Math.abs(s.re[i]):kind==='im'?Math.abs(s.im[i]):Math.hypot(s.re[i],s.im[i]));
  return Math.max(m,1e-12);
}
export function drawSpectrum2(canvas, spec, kind, maxval, n=N2) {
  canvas.width=n;canvas.height=n;
  const ctx=canvas.getContext('2d');const img=ctx.createImageData(n,n);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const xx=(x+n/2)%n,yy=(y+n/2)%n,i=yy*n+xx,j=y*n+x;
    const re=spec.re[i],im=spec.im[i],mag=Math.hypot(re,im);
    let color;
    if(kind==='phase')color=mag>Math.max(1e-12,maxval*1e-6)?phaseColor(Math.atan2(im,re)):[18,35,48];
    else if(kind==='re'||kind==='im')color=colorDiverging((kind==='re'?re:im)/maxval);
    else {
      const value=kind==='maglinear'?mag/maxval:Math.log1p(mag)/Math.log1p(maxval);
      const t=clamp(value);
      color=pixel(11+232*Math.pow(t,1.6),31+203*Math.pow(t,.9),46+185*Math.pow(t,.55));
    }
    img.data.set([...color,255],j*4);
  }
  ctx.putImageData(img,0,0);
}
