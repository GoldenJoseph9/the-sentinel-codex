const fs=require('fs'),path=require('path'),vm=require('vm');
const root=path.resolve(__dirname,'..');
class CL{constructor(){this.s=new Set()} add(...x){x.forEach(v=>this.s.add(v))} remove(...x){x.forEach(v=>this.s.delete(v))} contains(x){return this.s.has(x)} toggle(x,f){if(f===undefined)f=!this.s.has(x);f?this.s.add(x):this.s.delete(x);return f}}
class El{constructor(id=''){this.id=id;this.classList=new CL();this.style={};this.dataset={};this.attributes={};this.children=[];this.value='';this.disabled=false;this.textContent='';this.innerHTML='';this.src='';this.alt='';this.onclick=null;this.parentNode=null;this.scrollTop=0;this.className=''} setAttribute(k,v){this.attributes[k]=String(v)} getAttribute(k){return this.attributes[k]} removeAttribute(k){delete this.attributes[k];if(k==='src')this.src=''} addEventListener(k,fn){(this.listeners??={})[k]=fn} appendChild(el){this.children.push(el);el.parentNode=this;return el} append(...els){els.forEach(el=>this.appendChild(el))} replaceChildren(...els){this.children=[];els.forEach(el=>this.appendChild(el))} add(el){this.appendChild(el)} querySelector(sel){if(sel==='button:not(:disabled)')return this.children.find(c=>c.tagName==='button'&&!c.disabled)||null;return null} querySelectorAll(){return []} focus(){this.focused=true} remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(x=>x!==this)} click(){if(this.onclick)this.onclick({target:this})}}
const ids=[...fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/\bid=["']([^"']+)["']/g)].map(m=>m[1]);
const els=Object.fromEntries([...new Set(ids)].map(id=>[id,new El(id)]));
for(const id of ['reader','chapterBreak','end','cover','chapterNavigator','codex-screen','modal','sceneVisual','modalVisualContainer','observerDecision'])els[id].classList.add('hidden');
els.chapterList.tagName='div';
const document={getElementById:id=>els[id]||(els[id]=new El(id)),querySelectorAll:()=>[],createElement:tag=>{const e=new El();e.tagName=tag;return e},createTextNode:text=>({textContent:text}),addEventListener(){},documentElement:new El('html'),body:new El('body'),activeElement:new El('active')};
const store=new Map();const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
const window={scrollTo(){}};
const context={window,document,localStorage,console,Option:function(text,value){this.text=text;this.value=value},requestAnimationFrame:fn=>fn(),setTimeout:fn=>{fn();return 1},clearTimeout(){},confirm:()=>true,Blob:function(){},URL:{createObjectURL:()=>'',revokeObjectURL(){}},Math,Set,Map,Array,Object,String,Number,JSON,Date,RegExp};
vm.createContext(context);
const run=f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});
run('js/manifest.js');run('js/data.js');for(let i=1;i<=16;i++)run(`js/chapter${i}.js`);
run('js/app.js');
const check=(name,ok)=>{console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)process.exitCode=1};
const evalIn=s=>vm.runInContext(s,context);
check('app boots on cover',evalIn('state.sceneIndex')===-1);
els.begin.click();check('begin enters first scene',evalIn('state.sceneIndex')===0);
check('chapter index is available from the reader controls',!!els.readerChaptersButton && typeof els.readerChaptersButton.onclick==='function');
// Chapter One must stop at its boundary and present the first Observer decision.
const chapterOneBreak=evalIn('chapterMap.findIndex((row,i)=>Number(row.chapterId)===1 && i+1<chapterMap.length && Number(row.chapterId)!==Number(chapterMap[i+1].chapterId))');
evalIn(`moveScene(${chapterOneBreak})`);
check('Chapter One boundary displays the Observer decision',!els.chapterBreak.classList.contains('hidden')&&!els.observerDecision.classList.contains('hidden'));
check('Chapter Two cannot be entered before the first decision',els.continueChapterTwo.disabled===true);
els.transmit.click();
check('first Observer decision records TRANSMIT and unlocks continuation',evalIn('state.observerDecision')==='transmit'&&els.continueChapterTwo.disabled===false);
check('first Observer decision persists to save data',JSON.parse(localStorage.getItem('sentinel_codex_save_v6')).observerDecision==='transmit');
check('first decision locks both options after selection',els.transmit.disabled===true&&els.withhold.disabled===true);
evalIn('state.observerDecision=null'); evalIn(`moveScene(${chapterOneBreak})`);
els.withhold.click();
check('WITHHOLD is also selectable and records the alternative route',evalIn('state.observerDecision')==='withhold'&&els.continueChapterTwo.disabled===false);
check('WITHHOLD route is persisted',JSON.parse(localStorage.getItem('sentinel_codex_save_v6')).observerDecision==='withhold');
els.continueChapterTwo.click();
check('continuation after decision enters Chapter Two',evalIn('Number(chapterMap[state.sceneIndex].chapterId)')===2);
// Simulate a saved position in a later chapter, then open replay navigation.
const laterIndex=35;evalIn(`moveScene(${laterIndex})`);const savedBefore=JSON.parse(localStorage.getItem('sentinel_codex_save_v6')).sceneIndex;
els.readerChaptersButton.click();
const availableReplay=els.chapterList.children.filter(b=>!b.disabled);
const reachedCount=Number(evalIn('chapterMap[35].chapterId'));
check('chapter index offers all reached chapters',availableReplay.length===reachedCount && availableReplay.some(b=>b.getAttribute('aria-label').startsWith('Replay chapter '+(reachedCount)+':')));
const chapterTwo=availableReplay.find(b=>b.getAttribute('aria-label').startsWith('Replay chapter 2:'));
check('a previously reached chapter can be selected directly',!!chapterTwo);
chapterTwo.onclick();
check('replay starts at the selected previous chapter',evalIn('replayMode')===true && evalIn('chapterMap[state.sceneIndex].chapterId')==='2');
check('saved reading position survives replay navigation',JSON.parse(localStorage.getItem('sentinel_codex_save_v6')).sceneIndex===savedBefore);
// Replay must not write evidence, comparison history, or automatic correlation.
evalIn('state.observerDecision="transmit"; state.foundEvidence=["iteration"]; state.comparedRecords=[]');
evalIn('checkConnections()');
check('replay does not auto-unlock evidence',!evalIn('state.foundEvidence.includes("observer_deduction")'));
evalIn('saveEvidence("case")');
check('replay cannot archive new evidence',!evalIn('state.foundEvidence.includes("case")'));
// Attempting reset while replay is active must be harmless.
evalIn('state.sceneIndex=allScenes.length; render()');
const beforeReset=JSON.stringify(evalIn('state'));
els.reset.click();
check('reset cannot clear progress during replay',JSON.stringify(evalIn('state'))===beforeReset);
// Verify positions at chapter breaks and the Arc One end screen are saved.
evalIn('exitReplay()');
const breakIndex=evalIn('chapterMap.findIndex((row,i)=>i+1<chapterMap.length && row.chapterId!==chapterMap[i+1].chapterId)');
evalIn(`moveScene(${breakIndex})`);
check('chapter-break position is saved',JSON.parse(localStorage.getItem('sentinel_codex_save_v6')).sceneIndex===breakIndex);
evalIn('moveScene(allScenes.length)');
check('Arc One end-screen position is saved',JSON.parse(localStorage.getItem('sentinel_codex_save_v6')).sceneIndex===evalIn('allScenes.length'));
// Corrupt save should be normalized rather than accepted as arbitrary state.
localStorage.setItem('sentinel_codex_save_v6',JSON.stringify({sceneIndex:999999,foundEvidence:['not-real','case','case'],observerDecision:'anything',finalObserverChoice:'bad',comparedRecords:'bad'}));
// A fresh context is required for init-time load; validate normalization logic directly with current app by reproducing boot in a second context.
const c2={...context,window:{},document,localStorage,console};vm.createContext(c2);vm.runInContext(fs.readFileSync(path.join(root,'js/manifest.js'),'utf8'),c2);vm.runInContext(fs.readFileSync(path.join(root,'js/data.js'),'utf8'),c2);for(let i=1;i<=16;i++)vm.runInContext(fs.readFileSync(path.join(root,`js/chapter${i}.js`),'utf8'),c2);vm.runInContext(fs.readFileSync(path.join(root,'js/app.js'),'utf8'),c2);
check('corrupt save scene index is clamped',vm.runInContext('state.sceneIndex===allScenes.length',c2));
check('corrupt evidence and choices are filtered',vm.runInContext('state.foundEvidence.length===1 && state.foundEvidence[0]==="case" && state.observerDecision===null && state.finalObserverChoice===null && state.comparedRecords.length===0',c2));
// Verify all four Observer routes remain distinct in the outcome summary.
const routes=[['withhold','protect'],['withhold','preserve'],['transmit','protect'],['transmit','preserve']];
const summaries=routes.map(([early,later])=>evalIn(`state.observerDecision=${JSON.stringify(early)}; state.finalObserverChoice=${JSON.stringify(later)}; getObserverOutcomeSummary()`));
check('four Observer route summaries are distinct',new Set(summaries).size===4);
const conditionChecks=routes.map(([early,later])=>evalIn(`state.observerDecision=${JSON.stringify(early)}; state.finalObserverChoice=${JSON.stringify(later)}; formatSceneText([{condition:'transmit+preserve',text:'ROUTE_MATCH'}]).includes('ROUTE_MATCH')`));

check('conditional story text only appears on matching route',conditionChecks.join(',')==='false,false,false,true');
// Exercise route conditions embedded in the actual Chapter 15 and 16 manuscript data.
const routeMatrix=evalIn(`(() => {
  const routes=[['transmit','preserve'],['withhold','preserve'],['transmit','protect'],['withhold','protect']];
  const output=[];
  for(const chapterId of [15,16]) {
    const indexes=chapterMap.map((row,index)=>({row,index})).filter(x=>Number(x.row.chapterId)===chapterId).map(x=>x.index);
    const sceneIndex=indexes.find(index=>allScenes[index].text.some(block=>block&&block.condition&&String(block.condition).includes('+')));
    const blocks=allScenes[sceneIndex].text.filter(block=>block&&block.condition&&String(block.condition).includes('+'));
    for(const [early,later] of routes) {
      state.observerDecision=early; state.finalObserverChoice=later;
      const matching=blocks.filter(block=>String(block.condition).split('+').every(c=>state.observerDecision===c||state.finalObserverChoice===c));
      const rendered=formatSceneText(allScenes[sceneIndex].text);
      const chosenText=matching.length===1?(Array.isArray(matching[0].text)?matching[0].text.join(' '):matching[0].text):'';
      const otherText=blocks.filter(block=>!matching.includes(block)).map(block=>Array.isArray(block.text)?block.text.join(' '):block.text);
      output.push({chapterId,early,later,matching:matching.map(block=>block.condition),renderedUnique:matching.length===1&&typeof chosenText==='string'&&rendered.includes(chosenText.slice(0,24))&&otherText.every(t=>typeof t!=='string'||!rendered.includes(t.slice(0,24)))});
    }
  }
  return output;
})()`);
check('all four Observer routes match and render only their own conditional block in Chapters 15 and 16',routeMatrix.length===8&&routeMatrix.every(row=>row.matching.length===1&&row.renderedUnique));
check('each Observer route has a distinct consequence in Chapters 15 and 16',[15,16].every(ch=>new Set(routeMatrix.filter(row=>row.chapterId===ch).map(row=>row.matching[0])).size===4));
// Ensure the four route-specific outcome summaries remain unique and explicit about the cumulative trade-offs.
const routeConsequences=routes.map(([early,later])=>evalIn(`state.observerDecision=${JSON.stringify(early)}; state.finalObserverChoice=${JSON.stringify(later)}; getObserverOutcomeSummary()`));
check('route summaries preserve four distinct cumulative outcomes',new Set(routeConsequences).size===4&&routeConsequences.every(s=>typeof s==='string'&&s.length>30));
