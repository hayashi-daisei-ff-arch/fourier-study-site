import test from 'node:test';
import assert from 'node:assert/strict';

class FakeElement {
  constructor(tag='div'){
    this.tagName=tag.toUpperCase();this.children=[];this.listeners={};this.hidden=false;this.open=false;
    this.classList={toggle:()=>{}};this.style={};this.value='';this.innerText='';this.textContent='';
    this.ctx={
      setTransform(){},clearRect(){},beginPath(){},stroke(){},moveTo(){},lineTo(){},fillText(){},fillRect(){},putImageData(){},
      createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)}}
    };
  }
  replaceChildren(...children){this.children=children;}
  append(...items){this.children.push(...items);}
  addEventListener(name,handler){(this.listeners[name]??=[]).push(handler);}
  dispatch(name){for(const fn of this.listeners[name]||[])fn({target:this});}
  setAttribute(){}
  getBoundingClientRect(){return {width:330,height:200};}
  getContext(){return this.ctx;}
  focus(){}
}

test('UI initializes and every operation renders without an exception in a mock Canvas DOM',async()=>{
  const ids=[
    'tab-1','tab-2','pane-1','pane-2','reset1','reset2','template1','template2',
    'operation1','operation2','specview1','specview2','param1','param2','opparams1','opparams2',
    'auxbox1','auxcanvas1','signal1a','signal1b','spec1a','spec1b','err1','err2','reconwrap1','reconwrap2',
    'reconchart1','image2a','image2b','spec2a','spec2b','reconimage2','question1','question2',
    'choices1','choices2','check1','check2','feedback1','feedback2',
    'theory-title1','theory-title2','theory-formula1','theory-formula2','theory-desc1','theory-desc2',
    'theory-extra1','theory-extra2','caution1','caution2','image-scale-info','upload-box','upload2','upload-info'
  ];
  const elements=Object.fromEntries(ids.map(id=>[id,new FakeElement()]));
  elements['pane-2'].hidden=true;
  globalThis.document={
    getElementById(id){assert.ok(elements[id],`missing id: ${id}`);return elements[id];},
    createElement(tag){return new FakeElement(tag);},querySelector(){return null;}
  };
  globalThis.window={devicePixelRatio:1,addEventListener(){}};
  globalThis.requestAnimationFrame=()=>{};
  await import('../js/app.js');
  assert.ok(elements.err1.textContent.includes('最大復元誤差'));
  const one=['none','shift','offset','gain','scale','add','sub','conv','multiply','even','odd','flip','modulate','window','sample'];
  for(const op of one){elements.operation1.value=op;elements.operation1.dispatch('change');assert.ok(elements['theory-title1'].textContent,`1d theory ${op}`);}
  elements['tab-2'].dispatch('click');
  const two=['none','shift','offset','gain','rotate','scale','add','sub','conv','lowpass','highpass','bandpass','even','odd','magonly','phaseonly','kspace'];
  for(const op of two){elements.operation2.value=op;elements.operation2.dispatch('change');assert.ok(elements['theory-title2'].textContent,`2d theory ${op}`);}
  assert.ok(elements.err2.textContent.includes('実部誤差'));
  elements.reset1.dispatch('click');elements.reset2.dispatch('click');
});
