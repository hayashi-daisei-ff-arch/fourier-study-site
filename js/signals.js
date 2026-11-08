import { fft, fft2, zeros } from './fft.js';

export const N1 = 256, N2 = 128;
export const templates1 = [
  ['cos','余弦波 cos'], ['sin','正弦波 sin'], ['rect','矩形パルス'],
  ['gauss','ガウス関数'], ['impulse','デルタ（離散インパルス）'],
  ['constant','定数関数'], ['compound','複合波'],
  ['even','偶関数（混合）'], ['odd','奇関数（混合）'],
];
export const secondary1 = [['gauss','ガウス'],['rect','矩形'],['cos','余弦'],['sin','正弦'],['impulse','インパルス']];
export const operations1 = [
 ['none','基本変換・逆変換'],['shift','位置の平行移動'],['offset','上下移動（定数加算）'],
 ['gain','振幅の変更（定数倍）'],['scale','横方向の伸縮'],['add','加算'],['sub','減算'],
 ['conv','畳み込み'],['multiply','信号の乗算'],['even','偶関数成分'],
 ['odd','奇関数成分'],['flip','左右反転'],['modulate','周波数シフト（複素変調）'],
 ['window','Hann窓を乗算'],['sample','標本化間隔とエイリアシング'],
];
const exp = Math.exp, PI=Math.PI;
export function default1Param(name) { return ['cos','sin','compound','even','odd'].includes(name)?8:name==='rect'?44:name==='gauss'?15:1; }
export function range1Param(name) {
  return ['cos','sin','compound','even','odd'].includes(name) ? {min:1,max:40,step:1,label:'周波数（画面全体の周期数）'} :
    name==='rect'? {min:4,max:160,step:2,label:'パルス幅（サンプル）'} :
    name==='gauss'? {min:3,max:70,step:1,label:'標準偏差（サンプル）'} :
    {min:1,max:1,step:1,label:'固定'};
}
export function signalValue(name, x, param=8) {
  switch(name) {
    case 'cos': return Math.cos(2*PI*param*x/N1);
    case 'sin': return Math.sin(2*PI*param*x/N1);
    case 'rect': return Math.abs(x) < param/2 ? 1 : 0;
    case 'gauss': return exp(-.5*(x/param)**2);
    case 'impulse': return Math.abs(x)<.5 ? 1 : 0;
    case 'constant': return 1;
    case 'compound': return Math.cos(2*PI*param*x/N1)+.48*Math.cos(2*PI*(param*2+3)*x/N1);
    case 'even': return .7*Math.cos(2*PI*param*x/N1)+.6*exp(-.5*(x/20)**2);
    case 'odd': return Math.sin(2*PI*param*x/N1)+.35*Math.sin(2*PI*(param*2+1)*x/N1);
    default: return 0;
  }
}
export function create1(name, p=default1Param(name)) {
  return Float64Array.from({length:N1},(_,i)=>signalValue(name,i-N1/2,p));
}
export function auxiliary1(name) { return create1(name, name==='gauss'?8:name==='rect'?24:name==='impulse'?1:6); }
function arrayComplex(r,i=zeros(r.length)) {return {re:r,im:i};}
export function apply1(name, param, operation, amount, secondName='gauss') {
  const f=create1(name,param), size=N1;
  const r=Float64Array.from(f), q=zeros(size);
  let aux=null;
  if (['add','sub','multiply','conv'].includes(operation)) aux=auxiliary1(secondName);
  switch(operation){
    case 'shift': {
      for(let i=0;i<size;i++) r[i]=f[(i-amount+size*4)%size]; break;
    }
    case 'offset': for(let i=0;i<size;i++)r[i]=f[i]+amount; break;
    case 'gain': for(let i=0;i<size;i++)r[i]=f[i]*amount; break;
    case 'scale': for(let i=0;i<size;i++)r[i]=signalValue(name,(i-size/2)*amount,param); break;
    case 'add': case 'sub':
      for(let i=0;i<size;i++)r[i]=f[i]+(operation==='add'?1:-1)*amount*aux[i];
      break;
    case 'multiply': for(let i=0;i<size;i++)r[i]=f[i]*aux[i]; break;
    case 'conv': {
      // h is defined about x=0 at array center. Reindex to h[0] at index zero.
      const h=Float64Array.from({length:size},(_,i)=>aux[(i+size/2)%size]);
      let sum=h.reduce((s,v)=>s+v,0);
      if(Math.abs(sum)<1e-10) sum=1; // non-smoothing h still well-defined
      const ff=fft(f,zeros(size)), hh=fft(h,zeros(size));
      const cr=zeros(size),ci=zeros(size);
      for(let k=0;k<size;k++) {
        cr[k]=(ff.re[k]*hh.re[k]-ff.im[k]*hh.im[k])/sum;
        ci[k]=(ff.re[k]*hh.im[k]+ff.im[k]*hh.re[k])/sum;
      }
      const inv=fft(cr,ci,true);
      r.set(inv.re);q.set(inv.im);break;
    }
    case 'even': case 'odd': for(let i=0;i<size;i++)r[i]=(f[i]+(operation==='even'?1:-1)*f[(size-i)%size])/2;break;
    case 'flip':for(let i=0;i<size;i++)r[i]=f[(size-i)%size];break;
    case 'modulate':
      for(let i=0;i<size;i++){
        const ang=2*PI*amount*(i-size/2)/size;
        r[i]=f[i]*Math.cos(ang);q[i]=f[i]*Math.sin(ang);
      }break;
    case 'window':for(let i=0;i<size;i++)r[i]=f[i]*(0.5-0.5*Math.cos(2*PI*i/(size-1)));break;
    case 'sample':for(let i=0;i<size;i++)r[i]=signalValue(name,(i-size/2)*amount,param);break;
  }
  const F=fft(f,zeros(size)), G=fft(r,q), restored=fft(G.re,G.im,true);
  return {f:arrayComplex(f,zeros(size)),g:arrayComplex(r,q),F,G,restored,aux};
}

export const templates2=[
 ['phantom','模擬医用画像'],['point','点（インパルス）'],['hline','水平線'],['vline','垂直線'],
 ['rect','矩形'],['circle','円'],['gauss','ガウス（PSF）'],['stripes','斜め縞'],
 ['grid','格子模様'],['checker','チェッカーボード'],['upload','アップロード画像'],
];
export const operations2=[
 ['none','基本変換・逆変換'],['shift','画像の平行移動'],['offset','輝度の加算'],['gain','画素値の定数倍'],
 ['rotate','画像の回転'],['scale','画像の拡大・縮小'],['add','画像の加算'],['sub','画像の減算'],
 ['conv','畳み込み（ガウスぼかし）'],['lowpass','ローパス'],['highpass','ハイパス'],
 ['bandpass','バンドパス'],['even','偶対称成分'],['odd','奇対称成分'],
 ['magonly','振幅のみで再構成'],['phaseonly','位相のみで再構成'],
 ['kspace','MRI：k空間の間引き（概念）'],
];
export function default2Param(name){return name==='stripes'?8:name==='grid'?8:name==='checker'?8: name==='gauss'?12: name==='point'?1: name==='phantom'?1:25;}
export function range2Param(name){
  if(['stripes','grid','checker'].includes(name))return {min:2,max:24,step:1,label:'周波数／分割数'};
  if(['circle','rect','gauss','hline','vline'].includes(name))return {min:4,max:50,step:1,label:'図形の大きさ'};
  return {min:1,max:1,step:1,label:'固定'};
}
function phantom(x,y) {
  const ell=(cx,cy,ax,ay)=> ((x-cx)/ax)**2+((y-cy)/ay)**2<=1;
  let v=ell(0,0,49,57)?.32:0;
  if(ell(0,0,36,50))v=.58;
  if(ell(-16,-10,12,19))v=.76;
  if(ell(17,-10,11,18))v=.8;
  if(ell(0,23,19,10))v=.3;
  if(ell(-6,13,5,11))v=.15;
  if(ell(9,16,6,7))v=.92;
  if(ell(0,-36,14,6))v=.66;
  return v;
}
export function create2(name,param=default2Param(name),uploaded=null){
  if(name==='upload' && uploaded && uploaded.length===N2*N2) return Float64Array.from(uploaded);
  if(name==='upload')name='phantom';
  const out=zeros(N2*N2);
  const w=N2/2;
  for(let y=0;y<N2;y++)for(let x=0;x<N2;x++){
    const xx=x-w, yy=y-w, id=y*N2+x;
    switch(name){
      case 'phantom':out[id]=phantom(xx,yy);break;
      case 'point':out[id]=(xx===0 && yy===0)?1:0;break;
      case 'hline':out[id]=(Math.abs(yy)<Math.max(1,param/12)&&Math.abs(xx)<55)?1:0;break;
      case 'vline':out[id]=(Math.abs(xx)<Math.max(1,param/12)&&Math.abs(yy)<55)?1:0;break;
      case 'rect':out[id]=(Math.abs(xx)<param*1.4&&Math.abs(yy)<param*.8)?1:0;break;
      case 'circle':out[id]=(xx*xx+yy*yy<param*param)?1:0;break;
      case 'gauss':out[id]=exp(-.5*(xx*xx+yy*yy)/(param*param));break;
      case 'stripes':out[id]=.5+.5*Math.cos(2*PI*param*(xx+yy*.65)/N2);break;
      case 'grid':out[id]=.5+.25*(Math.cos(2*PI*param*xx/N2)+Math.cos(2*PI*param*yy/N2));break;
      case 'checker':out[id]=((Math.floor(x*param/N2)+Math.floor(y*param/N2))%2===0)?1:0;break;
    }
  }
  return out;
}
export function secondary2(name) {return create2(name==='gauss'?'gauss':name==='rect'?'rect':name==='stripes'?'stripes':'circle',name==='gauss'?12:24);}
export const mod=(a,n)=>((a%n)+n)%n;
export function apply2(name, param, operation, args={}, uploaded=null) {
  const n=N2, n2=n*n;
  const f=create2(name,param,uploaded), g=Float64Array.from(f);
  let aux=null, F=fft2(f,zeros(n2),n), G;
  const a=args.a??0, b=args.b??0;
  let mask=null;
  const useSpectrum=['conv','lowpass','highpass','bandpass','magonly','phaseonly','kspace'].includes(operation);
  if(operation==='shift') {
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)g[y*n+x]=f[mod(y-b,n)*n+mod(x-a,n)];
  } else if(operation==='offset' || operation==='gain') {
    for(let i=0;i<n2;i++)g[i]=operation==='offset'?f[i]+a:f[i]*a;
  } else if(operation==='rotate' || operation==='scale'){
    const angle=operation==='rotate'?a*Math.PI/180:0;
    const c=Math.cos(angle),s=Math.sin(angle),scale=operation==='scale'?a:1;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const xx=(x-n/2)/scale, yy=(y-n/2)/scale;
      // Inverse sampling transform, exact at right angles up to floating-point tolerance.
      const sx=c*xx+s*yy+n/2, sy=-s*xx+c*yy+n/2;
      g[y*n+x]=sampleBilinear(f,sx,sy,n);
    }
  } else if(operation==='add' || operation==='sub') {
    aux=secondary2(args.second??'circle');
    for(let i=0;i<n2;i++)g[i]=f[i]+(operation==='add'?1:-1)*a*aux[i];
  } else if(operation==='even' || operation==='odd'){
    for(let y=0;y<n;y++)for(let x=0;x<n;x++)g[y*n+x]=(f[y*n+x]+(operation==='even'?1:-1)*f[mod(-y,n)*n+mod(-x,n)])/2;
  }
  if(useSpectrum) {
    G={re:Float64Array.from(F.re),im:Float64Array.from(F.im)};
    mask=new Float64Array(n2).fill(1);
    if(operation==='conv'){
      // Gaussian convolution kernel centered at h[0,0]. Its sum equals one.
      const radius=Math.max(0.5,a), ker=zeros(n2);let sum=0;
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const yy=y<n/2?y:y-n,xx=x<n/2?x:x-n;
        const v=exp(-.5*(xx*xx+yy*yy)/(radius*radius));
        ker[y*n+x]=v;sum+=v;
      }
      for(let i=0;i<n2;i++)ker[i]/=sum;
      const H=fft2(ker,zeros(n2),n);
      for(let i=0;i<n2;i++){
        const r=F.re[i]*H.re[i]-F.im[i]*H.im[i];
        const m=F.re[i]*H.im[i]+F.im[i]*H.re[i];
        G.re[i]=r;G.im[i]=m;
      }
      mask=null;
    } else if(operation==='magonly' || operation==='phaseonly'){
      const mags=Float64Array.from(F.re,(v,i)=>Math.hypot(v,F.im[i]));
      const factor=operation==='phaseonly'?mags.reduce((s,v)=>s+v,0)/Math.max(1,mags.reduce((s,v)=>s+(v>1e-9?1:0),0)):1;
      for(let i=0;i<n2;i++){
        if(operation==='magonly'){G.re[i]=mags[i];G.im[i]=0;}
        else {const m=mags[i]>1e-9?factor/mags[i]:0;G.re[i]=F.re[i]*m;G.im[i]=F.im[i]*m;}
      }
      mask=null;
    } else {
      const r1=a, r2=b;
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        const dx=Math.min(x,n-x),dy=Math.min(y,n-y),r=Math.hypot(dx,dy);
        let m=1;
        if(operation==='lowpass') m=r<=r1?1:0;
        if(operation==='highpass')m=r>=r1?1:0;
        if(operation==='bandpass')m=(r>=Math.min(r1,r2)&&r<=Math.max(r1,r2))?1:0;
        if(operation==='kspace')m=dy<=r1?1:0;
        const i=y*n+x;
        mask[i]=m;G.re[i]*=m;G.im[i]*=m;
      }
    }
    const inv=fft2(G.re,G.im,n,true);
    g.set(inv.re);
  } else G=fft2(g,zeros(n2),n);
  const restored=fft2(G.re,G.im,n,true);
  return {n,f,g,F,G,restored,mask,aux};
}
export function sampleBilinear(a,x,y,n){
  if(x<0||x>n-1||y<0||y>n-1)return 0;
  const x0=Math.floor(x),y0=Math.floor(y),x1=Math.min(x0+1,n-1),y1=Math.min(y0+1,n-1);
  const dx=x-x0,dy=y-y0;
  return a[y0*n+x0]*(1-dx)*(1-dy)+a[y0*n+x1]*dx*(1-dy)+a[y1*n+x0]*(1-dx)*dy+a[y1*n+x1]*dx*dy;
}
