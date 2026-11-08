import { N1,N2,templates1,secondary1,operations1,templates2,operations2,default1Param,range1Param,default2Param,range2Param,apply1,apply2,auxiliary1 } from './signals.js';
import {maxError} from './fft.js';
import {drawLine,specSeries,spectrumRange,signalRange,imageRange,drawImage,drawSpectrum2,spec2Range} from './plots.js?v=phase-fix-1';

const $=(id)=>document.getElementById(id);
const defaults1=()=>({name:'cos',p:8,op:'shift',a:24,b:0,second:'gauss',spec:'mag'});
const defaults2=()=>({name:'phantom',p:1,op:'lowpass',a:15,b:40,second:'circle',spec:'mag',uploaded:null});
let s1=defaults1(),s2=defaults2(),last1,last2;
const questionSets1={
 none:['フーリエ変換と逆変換について，正しい説明はどれですか？',['元の信号の復元には振幅と位相の両方が必要','すべての変換結果は実数','逆変換はできない'],0,'元の信号を再構成するには複素スペクトルを使用します．'],
 shift:['周期的な信号を左右にずらしたとき，振幅スペクトルはどうなりますか？',['変わらず，位相が変わる','必ず2倍になる','すべて0になる'],0,'循環シフトの性質により，変わるのは位相です．'],
 offset:['信号全体に一定値を加えると，最も直接的に変化する周波数成分は？',['直流成分（k=0）','最大周波数','すべての成分が等しく増加'],0,'定数のDFTは直流成分だけが非ゼロです．'],
 gain:['信号を2倍すると，複素スペクトルはどうなりますか？',['全成分が2倍になる','周波数が2倍になる','位相だけが2倍になる'],0,'フーリエ変換は線形変換です．'],
 scale:['実空間で波形を横方向に圧縮すると，連続フーリエ変換の幅は？',['広がる','狭くなる','常に一定'],0,'時間・空間での伸縮は周波数領域で逆向きに起こります．'],
 add:['2信号 f と h の和の変換はどれですか？',['F+H','F×H','F÷H'],0,'線形性：フーリエ変換は加算を保存します．'],
 sub:['f−h の変換はどれですか？',['F−H','F×H','F+H'],0,'減算も線形性に従います．'],
 conv:['位置領域で畳み込んだ結果は，周波数領域で何に対応しますか？',['複素数の乗算','単純な加算','周波数の反転だけ'],0,'畳み込み定理により F×H となります．'],
 multiply:['位置領域で2信号を掛け合わせると，周波数領域では？',['周波数成分が畳み込まれる','周波数はすべて0になる','単純な減算になる'],0,'積は周波数領域の循環畳み込みに対応します（DFTでは規格化係数が付きます）．'],
 even:['実数の偶関数のフーリエ変換は？',['実数の偶関数','純虚数の奇関数','常に0'],0,'f(−x)=f(x)なら，sin由来の虚数項が相殺されます．'],
 odd:['実数の奇関数のフーリエ変換は？',['純虚数の奇関数','実数の偶関数','常に0'],0,'f(−x)=−f(x)なら，cos由来の実数項が相殺されます．'],
 flip:['f(−x) の変換は何になりますか？',['F(−k)','−F(k)','F(k)²'],0,'位置の反転は周波数の反転になります．'],
 modulate:['複素指数関数で信号を変調した場合，スペクトルは？',['周波数方向に移動する','常に変化しない','完全に消える'],0,'複素変調により周波数方向に巡回シフトします．'],
 window:['信号にHann窓を掛けると，周波数領域では？',['窓のスペクトルとの畳み込み','常に高周波のみ削除','位置方向へ平行移動'],0,'窓を掛けると周波数成分が広がり，漏れと主ローブ幅が変わります．'],
 sample:['高い周波数を粗く標本化すると，どのようなことが起こり得ますか？',['低い周波数に見える（エイリアシング）','信号が必ず0になる','必ず元の周波数が保存される'],0,'標本化周波数の半分を超えると，周波数の折返しが起こります．'],
};
const questionSets2={
 none:['点画像の2次元フーリエ変換の振幅は？',['全周波数で一定','中心だけに存在','必ず円形に減衰'],0,'理想的な離散インパルスは全周波数に同じ振幅を持ちます．'],
 shift:['循環シフトで画像を左右にずらしたとき，振幅スペクトルは？',['変化しない','必ず左へ移動する','0になる'],0,'位置変化は位相の変化に対応します．'],
 offset:['画像のすべての画素に一定値を加えると，直接変わるのは？',['直流成分','最高周波数だけ','位相だけ'],0,'一定値の画像は直流成分のみを持ちます．'],
 gain:['画像の画素値を定数倍すると，スペクトルは？',['同じ定数倍になる','位置が移動する','周波数が必ず半分になる'],0,'2次元フーリエ変換も線形です．'],
 rotate:['画像を回転させると，周波数領域の模様は？',['同じ角度で回転する','逆方向に回転する','必ず不変'],0,'連続2次元変換では画像とスペクトルは同じ角度で回転します．'],
 scale:['画像を拡大したとき，連続変換で周波数分布の幅は？',['狭くなる','広くなる','必ず不変'],0,'位置側の拡大と周波数側の幅は逆関係です．'],
 add:['画像同士を加算したときのスペクトルは？',['スペクトルの加算','スペクトルの積','必ずゼロ'],0,'線形性は2次元にも成立します．'],
 sub:['画像同士を減算したときのスペクトルは？',['スペクトルの減算','スペクトルの積','常に不変'],0,'線形性は2次元にも成立します．'],
 conv:['画像とフィルタを畳み込むと，周波数領域では？',['伝達関数を乗算','伝達関数を加算','必ず反転'],0,'空間フィルタと周波数フィルタの対応です．'],
 lowpass:['ローパスフィルタで減りやすい情報は？',['細かな模様や輪郭','全体的な明るさだけ','低周波だけ'],0,'高周波成分を除くことで画像がぼけます．'],
 highpass:['ハイパスフィルタで相対的に強調されるのは？',['輪郭・細部','一様な領域','直流成分'],0,'低周波を除くことでエッジなどの高周波が残ります．'],
 bandpass:['バンドパスフィルタはどの成分を残しますか？',['特定帯域の周波数','直流成分だけ','最高周波数だけ'],0,'内半径と外半径の間を残す周波数マスクです．'],
 even:['偶対称画像のDFTはどうなりますか？',['実数成分のみ','純虚数成分のみ','常に一定'],0,'実数の中心反転偶対称画像では虚数成分が相殺されます．'],
 odd:['奇対称画像のDFTはどうなりますか？',['純虚数成分のみ','実数成分のみ','全周波数でゼロ'],0,'実数の中心反転奇対称画像では実数成分が相殺されます．'],
 magonly:['位相をすべて0にして逆変換すると，何が失われますか？',['元画像の位置・構造に関する情報','すべての周波数振幅','画素数'],0,'振幅だけでは一般に元画像を復元できません．'],
 phaseonly:['周波数の位相だけを残して再構成すると？',['構造・輪郭の情報が残ることがある','必ず元画像と完全一致','画像が常に一定値になる'],0,'位相は画像の構造に強く関与します．振幅は一定値に置き換えています．'],
 kspace:['MRIのk空間で位相エンコード方向の取得範囲を減らすと？',['その方向の高周波情報が欠ける','画素値がすべて一定になる','フーリエ変換が不要になる'],0,'中心のk空間だけを保持する簡易モデルでは，その方向の解像感が低下します．'],
};
const theory1={
 none:['フーリエ変換と逆変換','F[k] = Σₙ f[n] e⁻ⁱ²πᵏⁿ/ᴺ','波形を周波数成分に分解します．逆変換では複素スペクトルの振幅と位相の両方を利用します．','表示は |F[k]|/N．DFTの指数と規格化はソースコードで統一しています．'],
 shift:['位置の平行移動','f[n−m]  ↔  F[k] · e⁻ⁱ²πᵏᵐ/ᴺ','循環シフトは位相だけを変更し，振幅スペクトルを保ちます．スペクトル表示を「位相」に切り替えてください．','有限長のDFTでは周期的な循環シフトとして計算します．'],
 offset:['上下移動（定数加算）','f[n] + c  ↔  F[k] + cN·δ[k]','信号の全点に一定値を足すと，直流成分 k=0 だけが変化します．','スペクトルの表示を「振幅」にし，中央のピークに注目してください．'],
 gain:['振幅の定数倍','a f[n]  ↔  a F[k]','振幅を変更すると周波数成分全体が同じ倍率で変化します．','負の倍率では位相がπ変化する成分があります．'],
 scale:['横方向の伸縮','f(ax)  ↔  (1/|a|) F(u/a)','波形を横方向に縮めると周波数方向には広がり，振幅には倍率が掛かります．','この式は連続変換の性質です．画面上は有限範囲を再標本化するため，端点・標本化の誤差が含まれます．'],
 add:['加算（線形性）','f + a h  ↔  F + a H','時間・空間領域の加算は，複素スペクトルの加算に対応します．','振幅だけを単純に足した値と |F+aH| は一般に一致しません．'],
 sub:['減算（線形性）','f − a h  ↔  F − a H','時間・空間領域の減算は，複素スペクトルの減算に対応します．','各周波数で位相が異なると，成分が打ち消し合う場合があります．'],
 conv:['畳み込み定理','f ⊛ h  ↔  F · H','位置領域の循環畳み込みは，周波数領域の複素乗算に対応します．','ガウス・矩形・インパルスの補助信号は総和1に規格化しています．DFTは循環畳み込みを計算します．'],
 multiply:['信号の積','f · h  ↔  (F ⊛ H)/N','位置領域の乗算は，周波数領域の循環畳み込みに対応します．','NはDFTのサンプル数です．連続変換とDFTでは規格化係数が異なります．'],
 even:['偶関数の性質','g[n] = {f[n] + f[−n]}/2','実数の偶関数は，フーリエ変換後に実数の偶対称スペクトルになります．','周波数スペクトルを「虚部」にすると，ほぼゼロになることが確認できます．'],
 odd:['奇関数の性質','g[n] = {f[n] − f[−n]}/2','実数の奇関数は，フーリエ変換後に純虚数の奇対称スペクトルになります．','周波数スペクトルを「実部」にすると，ほぼゼロになることが確認できます．'],
 flip:['左右反転','f[−n]  ↔  F[−k]','波形を原点に対して反転すると，周波数成分も反転します．','実数信号の場合，反転は共役複素数への変換と同じ関係になります．'],
 modulate:['周波数シフト','f[n] eⁱ²πᵖⁿ/ᴺ  ↔  F[k−p]','複素指数で変調すると，スペクトルが周波数方向に移動します．','操作後の波形は複素信号です．青が実部，橙が虚部です．移動先はDFTの周期で折り返します．'],
 window:['窓関数とスペクトル漏れ','g[n] = f[n] · wHann[n]','有限長信号に窓を掛けると端点を滑らかにつなげられる一方，周波数領域では成分が広がります．','Hann窓：w[n]=0.5−0.5cos(2πn/(N−1))．主ローブ・サイドローブを比較できます．'],
 sample:['標本化とエイリアシング','g[n] = f(M·n)   （M：標本間隔の倍率）','標本間隔を大きくすると，元の周波数が別の低い離散周波数に折り返して見える場合があります．','元と操作後では標本間隔が異なります．横軸はそれぞれの標本番号，周波数軸はそれぞれの離散周波数ビンです．物理周波数を同じ単位で比較しているわけではありません．'],
};
const theory2={
 none:['2次元FFT・逆FFT','F[u,v] = ΣₓΣᵧ f[x,y] e⁻ⁱ²π⁽ᵘˣ⁺ᵛʸ⁾/ᴺ','画像を2次元の空間周波数成分に分解します．再構成には複素スペクトルが必要です．','周波数領域の中心はDC（ゼロ周波数）です．'],
 shift:['画像の平行移動','f[x−a,y−b] ↔ F[u,v] e⁻ⁱ²π⁽ᵘᵃ⁺ᵛᵇ⁾/ᴺ','画像を周期的に移動させても振幅スペクトルは不変で，位相が変わります．','ゼロ埋め移動ではなく循環シフトなので，端から出た部分は反対側に現れます．'],
 offset:['画像の輝度加算','f[x,y] + c ↔ F[u,v] + cN²δ[u,v]','全画素に同じ明るさを加えると，DC成分だけが変化します．','画面の色は比較用の共通スケールで表示しています．数値データはクリップしません．'],
 gain:['画像の画素値を定数倍','a f[x,y]  ↔  a F[u,v]','画素値を定数倍すると，全ての複素スペクトルが同じ倍率になります．','負の値を含む場合，画像は符号付きの色で表示します．'],
 rotate:['画像とスペクトルの回転','f(R⁻¹[x,y])  ↔  F(R⁻¹[u,v])','2次元の回転は，周波数領域で同じ角度の回転に対応します．','離散画像の補間と画像外のゼロ埋めにより，厳密な回転関係からずれる場合があります．'],
 scale:['2次元の拡大・縮小','f(x/s,y/s) ↔ |s|² F(su,sv)','連続変換では，位置領域を広げるほど周波数の幅は狭くなります．','この画面は画像を補間・再標本化します．有限視野・境界・補間の影響があります．'],
 add:['画像の加算（線形性）','f + a h  ↔  F + a H','2枚の画像を足すと，複素スペクトルも足し合わされます．','振幅スペクトル同士の単純な加算にはなりません．'],
 sub:['画像の減算（線形性）','f − a h  ↔  F − a H','画像の引き算は，複素スペクトルの引き算に対応します．','負の画素値も保持して計算します．'],
 conv:['2次元畳み込み定理','f ⊛ h  ↔  F · H','ガウスカーネルとの循環畳み込みを周波数領域の乗算で計算します．','ガウスカーネルの総和は1です．幅を大きくすると高周波成分が減り，ぼかしが強くなります．'],
 lowpass:['ローパスフィルタ','G[u,v] = F[u,v] · LP(u,v)','中心（低周波）を残す理想的な円形マスクで，画像が滑らかになります．','急峻な周波数遮断ではリンギングが生じることがあります．'],
 highpass:['ハイパスフィルタ','G[u,v] = F[u,v] · HP(u,v)','低周波成分を除去し，輪郭や細かい構造を残します．','画像は負値を持つため，符号付きの色表示になります．'],
 bandpass:['バンドパスフィルタ','G[u,v] = F[u,v] · BP(u,v)','指定した2つの半径の間にある周波数成分だけを通します．','中心からの距離が空間周波数に対応します．'],
 even:['2次元偶対称','g[x,y] = {f[x,y]+f[−x,−y]}/2','画像を原点中心に180度回転させた像と足し合わせ，偶対称成分を取り出します．','実数の偶対称画像では，スペクトルの虚数部はほぼゼロになります．'],
 odd:['2次元奇対称','g[x,y] = {f[x,y]−f[−x,−y]}/2','画像と180度反転像の差から，奇対称成分を取り出します．','実数の奇対称画像では，スペクトルの実数部はほぼゼロになります．'],
 magonly:['振幅のみの逆変換','G[u,v] = |F[u,v]|','位相をすべて0に置き換え，振幅情報だけで画像を再構成します．','元の画像の位置や構造は一般に復元できません．'],
 phaseonly:['位相のみの逆変換','G[u,v] = A · eⁱ argF[u,v]','非ゼロ周波数成分の振幅を共通値 A に置き換え，位相情報から画像を再構成します．','A は元の非ゼロ成分の平均振幅です．位相の未定義なゼロ振幅成分は0にします．'],
 kspace:['MRI：k空間の一部を保持','G(kₓ,kᵧ) = M(kᵧ) · F(kₓ,kᵧ)','k空間の中心付近の位相エンコード線だけを保持し，2次元逆FFTで画像を再構成します．','教育用の簡易モデルです．実際のMRI信号収集，緩和，軌道，コイル感度等は再現していません．'],
};
function fill(el, items){el.replaceChildren();for(const [value,label] of items){const o=document.createElement('option');o.value=value;o.textContent=label;el.append(o);}}
function slider(parent,label,min,max,step,value,change,unit=''){
  const wrap=document.createElement('div');wrap.className='param-row';
  const head=document.createElement('div');head.className='range-top';
  const title=document.createElement('span');title.textContent=label;
  const val=document.createElement('output');val.className='range-output';
  const format=(v)=>`${Number(v).toFixed(step<1?1:0)}${unit}`;
  val.textContent=format(value);head.append(title,val);
  const input=document.createElement('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=value;input.setAttribute('aria-label',label);
  input.addEventListener('input',()=>{const v=Number(input.value);val.textContent=format(v);change(v);});
  const labels=document.createElement('div');labels.className='range-extents';
  const l=document.createElement('span'),r=document.createElement('span');l.textContent=`${min}${unit}`;r.textContent=`${max}${unit}`;labels.append(l,r);
  wrap.append(head,input,labels);parent.append(wrap);
}
function dropdown(parent,label,items,value,change){
  const wrap=document.createElement('div');wrap.className='param-row';
  const name=document.createElement('label');name.className='field-label';name.textContent=label;
  const sel=document.createElement('select');sel.className='select-field';sel.setAttribute('aria-label',label);
  fill(sel,items);sel.value=value;
  sel.addEventListener('change',()=>change(sel.value));wrap.append(name,sel);parent.append(wrap);
}
function makeTemplate1(){
  const slot=$('param1');slot.replaceChildren();
  const p=range1Param(s1.name);
  if(p.max>p.min)slider(slot,p.label,p.min,p.max,p.step,s1.p,(v)=>{s1.p=v;render1();});
}
function makeOp1(){
  const slot=$('opparams1');slot.replaceChildren();
  const defs={shift:['移動量',-60,60,1,''],offset:['加算する定数',-2,2,.1,''],gain:['倍率',-3,3,.1,'×'],scale:['位置方向の倍率 a',.4,2.5,.1,'×'],add:['補助信号の係数 a',-2,2,.1,'×'],sub:['補助信号の係数 a',-2,2,.1,'×'],modulate:['移動周波数（整数ビン）',-36,36,1,''],sample:['標本間隔の倍率 M',1,8,1,'×']};
  if(defs[s1.op]){const [label,min,max,step,unit]=defs[s1.op];slider(slot,label,min,max,step,s1.a,(v)=>{s1.a=v;render1();},unit);}
  if(['add','sub','multiply','conv'].includes(s1.op)){
    const options=s1.op==='conv'?secondary1.filter(([k])=>['gauss','rect','impulse'].includes(k)):secondary1;
    if(!options.some(([k])=>k===s1.second))s1.second='gauss';
    dropdown(slot,'補助信号 h(x)',options,s1.second,(v)=>{s1.second=v;render1();});
  }
  $('auxbox1').hidden=!['add','sub','multiply','conv'].includes(s1.op);
}
function makeTemplate2(){
  const slot=$('param2');slot.replaceChildren();const p=range2Param(s2.name);
  if(p.max>p.min)slider(slot,p.label,p.min,p.max,p.step,s2.p,(v)=>{s2.p=v;render2();});
  $('upload-box').hidden=s2.name!=='upload';
}
function makeOp2(){
  const slot=$('opparams2');slot.replaceChildren();
  const add=(label,min,max,step,k,unit='')=>slider(slot,label,min,max,step,s2[k],(v)=>{s2[k]=v;render2();},unit);
  switch(s2.op){
    case 'shift':add('横方向の移動（px）',-50,50,1,'a');add('縦方向の移動（px）',-50,50,1,'b');break;
    case 'offset':add('輝度加算',-.8,.8,.05,'a');break;
    case 'gain':add('画素値の倍率',-2,3,.1,'a','×');break;
    case 'rotate':add('回転角度',-180,180,15,'a','°');break;
    case 'scale':add('拡大率',.5,2,.1,'a','×');break;
    case 'add':case 'sub':
      add('補助画像の係数',-2,2,.1,'a','×');
      dropdown(slot,'補助画像 h(x,y)',[['circle','円'],['rect','矩形'],['gauss','ガウス'],['stripes','斜め縞']],s2.second,(v)=>{s2.second=v;render2();});break;
    case 'conv':add('ガウスフィルタ σ（px）',1,18,1,'a');break;
    case 'lowpass':case 'highpass':add('遮断周波数：半径（ビン）',1,65,1,'a');break;
    case 'bandpass':add('内半径（ビン）',1,48,1,'a');add('外半径（ビン）',2,80,1,'b');break;
    case 'kspace':add('保持する中央領域の半幅（ky）',1,64,1,'a');break;
  }
}
function newOp1(op){s1.op=op;if(op==='sample'){if(!['cos','sin','compound'].includes(s1.name)){s1.name='cos';$('template1').value='cos';}s1.p=40;makeTemplate1();}s1.a=({shift:24,offset:.6,gain:2,scale:1.5,add:1,sub:1,modulate:8,sample:4})[op]??0;makeOp1();setQuestion(1);render1();}
function newOp2(op){s2.op=op;s2.a=({shift:16,offset:.25,gain:1.6,rotate:90,scale:1.5,add:.8,sub:.8,conv:5,lowpass:15,highpass:15,bandpass:7,kspace:16})[op]??0;s2.b=({shift:12,bandpass:30})[op]??0;makeOp2();setQuestion(2);render2();}
function setQuestion(mode){
  const s=mode===1?s1:s2,q=(mode===1?questionSets1:questionSets2)[s.op];
  $(`question${mode}`).textContent=q[0];
  const area=$(`choices${mode}`);area.replaceChildren();
  q[1].forEach((v,i)=>{
    const label=document.createElement('label');label.className='choice';
    const input=document.createElement('input');input.type='radio';input.name=`choice${mode}`;input.value=String(i);
    const text=document.createElement('span');text.textContent=v;label.append(input,text);area.append(label);
  });
  $(`feedback${mode}`).textContent='';$(`feedback${mode}`).className='feedback';
}
function check(mode){
  const s=mode===1?s1:s2,q=(mode===1?questionSets1:questionSets2)[s.op];
  const answer=document.querySelector(`input[name="choice${mode}"]:checked`);
  const out=$(`feedback${mode}`);
  if(!answer){out.textContent='選択肢を選んでください．';out.className='feedback no';return;}
  const good=Number(answer.value)===q[2];
  out.textContent=(good?'正解です．':'不正解です．')+' '+q[3];
  out.className=`feedback ${good?'ok':'no'}`;
}
function theory(mode){
  const s=mode===1?s1:s2,p=(mode===1?theory1:theory2)[s.op];
  $(`theory-title${mode}`).textContent=p[0];
  $(`theory-formula${mode}`).textContent=p[1];
  $(`theory-desc${mode}`).textContent=p[2];
  $(`theory-extra${mode}`).textContent=p[3];
}
function render1(){
  last1=apply1(s1.name,s1.p,s1.op,s1.a,s1.second);
  const r=last1;
  const sr=signalRange(r.f.re,r.g.re,r.g.im);
  drawLine($('signal1a'),[{data:r.f.re,color:'#2686b8'}],sr);
  drawLine($('signal1b'),[{data:r.g.re,color:'#2686b8'},{data:r.g.im,color:'#e29459'}],sr);
  $('spec-hint1').hidden=s1.spec!=='phase';
  const F=specSeries(r.F,s1.spec,N1), G=specSeries(r.G,s1.spec,N1),range=spectrumRange(F,G,s1.spec);
  drawLine($('spec1a'),[{data:F,color:'#2686b8'}],range,true,s1.spec==='phase');
  drawLine($('spec1b'),[{data:G,color:'#2686b8'}],range,true,s1.spec==='phase');
  $('err1').textContent=`最大復元誤差 ${Math.max(maxError(r.g.re,r.restored.re),maxError(r.g.im,r.restored.im)).toExponential(2)}`;
  if($('reconwrap1').open)drawLine($('reconchart1'),[{data:r.restored.re,color:'#2686b8'},{data:r.restored.im,color:'#e29459'}],sr);
  if(r.aux)drawLine($('auxcanvas1'),[{data:r.aux,color:'#2686b8'}],null,false,false,true);
  theory(1);
  $('caution1').textContent=theory1[s1.op][3];
}
function render2(){
  last2=apply2(s2.name,s2.p,s2.op,{a:s2.a,b:s2.b,second:s2.second},s2.uploaded);
  const r=last2,range=imageRange(r.f,r.g);
  drawImage($('image2a'),r.f,range);drawImage($('image2b'),r.g,range);
  $('spec-hint2').hidden=s2.spec!=='phase';
  const max=spec2Range(r.F,r.G,s2.spec);
  drawSpectrum2($('spec2a'),r.F,s2.spec,max);drawSpectrum2($('spec2b'),r.G,s2.spec,max);
  drawImage($('reconimage2'),r.restored.re,range);
  const errRe=maxError(r.g,r.restored.re);
  let im=0;for(const v of r.restored.im)im=Math.max(im,Math.abs(v));
  $('err2').textContent=`実部誤差 ${errRe.toExponential(2)} / 虚部最大 ${im.toExponential(2)}`;
  $('image-scale-info').textContent=range.signed?'画像表示：青＝負／橙＝正（共通スケール）':'画像表示：黒＝低値／白＝高値（共通スケール）';
  theory(2);$('caution2').textContent=theory2[s2.op][3];
}
function init(){
  fill($('template1'),templates1);fill($('operation1'),operations1);fill($('template2'),templates2);fill($('operation2'),operations2);
  $('template1').value=s1.name;$('operation1').value=s1.op;$('template2').value=s2.name;$('operation2').value=s2.op;
  $('template1').addEventListener('change',(e)=>{s1.name=e.target.value;s1.p=default1Param(s1.name);makeTemplate1();render1();});
  $('operation1').addEventListener('change',(e)=>newOp1(e.target.value));
  $('specview1').addEventListener('change',(e)=>{s1.spec=e.target.value;render1();});
  $('reset1').addEventListener('click',()=>{s1=defaults1();$('template1').value=s1.name;$('operation1').value=s1.op;$('specview1').value=s1.spec;makeTemplate1();makeOp1();setQuestion(1);render1();});
  $('check1').addEventListener('click',()=>check(1));
  $('reconwrap1').addEventListener('toggle',()=>{if($('reconwrap1').open)render1();});
  $('template2').addEventListener('change',(e)=>{s2.name=e.target.value;s2.p=default2Param(s2.name);makeTemplate2();render2();});
  $('operation2').addEventListener('change',(e)=>newOp2(e.target.value));
  $('specview2').addEventListener('change',(e)=>{s2.spec=e.target.value;render2();});
  $('reset2').addEventListener('click',()=>{s2=defaults2();$('template2').value=s2.name;$('operation2').value=s2.op;$('specview2').value=s2.spec;$('upload2').value='';$('upload-info').textContent='未選択の場合は模擬画像を表示';makeTemplate2();makeOp2();setQuestion(2);render2();});
  $('check2').addEventListener('click',()=>check(2));
  $('upload2').addEventListener('change',onUpload);
  const tabs=[$('tab-1'),$('tab-2')];
  tabs.forEach((tab,i)=>tab.addEventListener('click',()=>switchTab(i+1)));
  tabs.forEach((tab,i)=>tab.addEventListener('keydown',(event)=>{
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
      event.preventDefault();const next=i===0?2:1;switchTab(next);tabs[next-1].focus();
    }
  }));
  const listener=()=>{if(!$('pane-1').hidden)render1();else render2();};
  let timer;window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(listener,130);});
  makeTemplate1();makeOp1();setQuestion(1);render1();
  makeTemplate2();makeOp2();setQuestion(2);
  requestAnimationFrame(()=>{if(!$('pane-2').hidden)render2();});
}
function switchTab(i){
  $('pane-1').hidden=i!==1;$('pane-2').hidden=i!==2;
  $('tab-1').classList.toggle('active',i===1);$('tab-2').classList.toggle('active',i===2);
  $('tab-1').setAttribute('aria-selected',String(i===1));$('tab-2').setAttribute('aria-selected',String(i===2));
  requestAnimationFrame(()=>{if(i===1)render1();else render2();});
}
async function onUpload(event){
  const file=event.target.files?.[0];if(!file)return;
  if(!file.type.startsWith('image/')||file.size>15*1024*1024){$('upload-info').textContent='画像ファイル（15MB以下）を選んでください．';return;}
  try{
    const bmp=await createImageBitmap(file);
    const off=document.createElement('canvas');off.width=N2;off.height=N2;
    const ctx=off.getContext('2d',{willReadFrequently:true});
    ctx.fillStyle='black';ctx.fillRect(0,0,N2,N2);
    const r=Math.min(N2/bmp.width,N2/bmp.height);
    const w=bmp.width*r,h=bmp.height*r;
    ctx.drawImage(bmp,(N2-w)/2,(N2-h)/2,w,h);
    if(typeof bmp.close==='function')bmp.close();
    const px=ctx.getImageData(0,0,N2,N2).data;
    const out=new Float64Array(N2*N2);
    for(let i=0;i<out.length;i++){
      const a=px[4*i+3]/255;
      out[i]=(0.2126*px[4*i]+0.7152*px[4*i+1]+0.0722*px[4*i+2])/255*a;
    }
    s2.uploaded=out;$('upload-info').textContent=`${file.name} を読み込みました（グレースケール・128×128に縮小）`;
    if(s2.name==='upload')render2();
  }catch(e){$('upload-info').textContent='読み込みに失敗しました．別の画像を選択してください．';}
}
init();
