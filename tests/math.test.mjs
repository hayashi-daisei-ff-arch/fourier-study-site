import test from 'node:test';
import assert from 'node:assert/strict';
import {fft,fft2,maxError} from '../js/fft.js';
import {apply1,apply2,create1,create2,N1,N2} from '../js/signals.js';
const z=n=>new Float64Array(n), close=(v,target=0,tol=1e-8)=>assert.ok(Math.abs(v-target)<tol,`${v} not within ${tol} of ${target}`);
const arrMax=a=>a.reduce((m,v)=>Math.max(m,Math.abs(v)),0);
test('radix-2 DFT/IFFT identity',()=>{
 for(const n of [4,32,256]){
  const a=Float64Array.from({length:n},(_,i)=>Math.sin(i*1.73)+.4*Math.cos(i*2.47));
  const b=Float64Array.from({length:n},(_,i)=>Math.cos(i*1.47)/3);
  const f=fft(a,b),inv=fft(f.re,f.im,true);
  close(maxError(a,inv.re));close(maxError(b,inv.im));
 }
});
test('1D impulse: spectrum has flat magnitude',()=>{
 const a=apply1('impulse',1,'none',0);
 for(let i=0;i<N1;i++)close(Math.hypot(a.F.re[i],a.F.im[i]),1);
});
test('1D shift: magnitude invariant, phase changes',()=>{
 const r=apply1('gauss',13,'shift',17);
 for(let i=0;i<N1;i++)close(Math.hypot(r.F.re[i],r.F.im[i]),Math.hypot(r.G.re[i],r.G.im[i]),1e-8);
 close(maxError(r.g.re,r.restored.re));
});
test('1D constant addition changes only the DC bin',()=>{
 const r=apply1('cos',8,'offset',.75);
 close(r.G.re[0]-r.F.re[0],.75*N1);
 for(let i=1;i<N1;i++)close(Math.hypot(r.G.re[i]-r.F.re[i],r.G.im[i]-r.F.im[i]));
});
test('1D even / odd symmetry translates into real/imag',()=>{
 const e=apply1('compound',8,'even');const o=apply1('compound',8,'odd');
 close(arrMax(e.G.im));close(arrMax(o.G.re));
});
test('1D convolution keeps constant amplitude after normalized gaussian',()=>{
 const r=apply1('constant',1,'conv',0,'gauss');
 for(let i=0;i<N1;i++)close(r.g.re[i],1);
});
test('1D modulation shifts one frequency bin as expected',()=>{
 const r=apply1('cos',7,'modulate',13);
 const f7=Math.hypot(r.F.re[7],r.F.im[7]);
 close(Math.hypot(r.G.re[20],r.G.im[20]),f7);
 close(maxError(r.g.im,r.restored.im));
});
test('2D impulse spectrum flat and IFFT lossless',()=>{
 const f=create2('point');const F=fft2(f,z(N2*N2),N2);
 for(let i=0;i<N2*N2;i++)close(Math.hypot(F.re[i],F.im[i]),1);
 const back=fft2(F.re,F.im,N2,true);
 close(maxError(f,back.re));
});
test('2D shift preserves magnitude',()=>{
 const r=apply2('phantom',1,'shift',{a:15,b:11});
 for(let i=0;i<N2*N2;i++)close(Math.hypot(r.F.re[i],r.F.im[i]),Math.hypot(r.G.re[i],r.G.im[i]),1e-7);
 close(maxError(r.g,r.restored.re));
});
test('2D lowpass removes every highpass bin and maintains reconstruction',()=>{
 const r=apply2('phantom',1,'lowpass',{a:14});
 close(Math.hypot(r.G.re[65],r.G.im[65]));
 close(maxError(r.g,r.restored.re));
});
test('2D even symmetry has negligible imaginary FFT',()=>{
 const r=apply2('phantom',1,'even');
 close(arrMax(r.G.im),0,1e-7);
});
test('2D phase-only output is (near) real',()=>{
 const r=apply2('phantom',1,'phaseonly');
 close(arrMax(r.restored.im),0,1e-7);
});
test('1D coarser sampling aliases cosine frequency',()=>{
 const r=apply1('cos',40,'sample',4);
 const mag=k=>Math.hypot(r.G.re[k],r.G.im[k]);
 close(mag(96),N1/2,1e-7); // 40 * 4 = 160, aliases to -96.
 close(mag(160),N1/2,1e-7);
});
test('2D constant addition only changes DC bin',()=>{
 const r=apply2('circle',25,'offset',{a:.25});
 close(r.G.re[0]-r.F.re[0],.25*N2*N2,1e-7);
 close(r.G.re[N2+7]-r.F.re[N2+7],0,1e-7);
});
test('2D gaussian circular convolution preserves image sum',()=>{
 const r=apply2('phantom',1,'conv',{a:8});
 const sum=a=>a.reduce((p,v)=>p+v,0);
 close(sum(r.g),sum(r.f),1e-7);
 close(maxError(r.g,r.restored.re),0,1e-7);
});
