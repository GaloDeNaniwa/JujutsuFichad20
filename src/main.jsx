import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Save, Upload, Download, RotateCcw, Search, AlertTriangle, CheckCircle2, Lock, Plus, Trash2, Swords, HeartPulse, Zap, Shield, BookOpen, Eye, Coins, ChevronDown, ChevronUp } from 'lucide-react';
import rules from './data/rules.json';
import './styles.css';

const ATTRS = [
  ['strength','Força','FOR'], ['dexterity','Destreza','DES'], ['constitution','Constituição','CON'],
  ['intelligence','Inteligência','INT'], ['wisdom','Sabedoria','SAB'], ['presence','Presença','PRE']
];
const ATTR_LABEL = Object.fromEntries(ATTRS.map(([k,v])=>[k,v]));
const RESISTANCES = [['astucia','Astúcia','INT'], ['fortitude','Fortitude','CON'], ['integrity','Integridade','CON'], ['reflexes','Reflexos','DES'], ['will','Vontade','SAB']];
const TABS = ['Ficha/Combate','Criação Guiada','Valores','Registro e Inventário','Perfil Mundano','Perfil Amaldiçoado','Perfil Restrito','Bônus de Interlúdio','Invocações','Técnicas','Level Up','Compêndio','Admin'];
const STORAGE_KEY = 'fm_app_full_state_v1';
const CREDIT_STORAGE_KEY = 'fm_app_credit_guard_v1';
const ATTRIBUTE_HELP = {strength:'Força mede potência física: ataques e manobras corporais, Atletismo, dano/controle físico quando a habilidade usa FOR.',dexterity:'Destreza mede agilidade, reflexos e precisão: Defesa, Iniciativa, Acrobacia, Furtividade e ataques/ações ágeis quando aplicável.',constitution:'Constituição mede resistência corporal: PV, Fortitude, fôlego, tolerância a dano, venenos e esforço prolongado.',intelligence:'Inteligência mede estudo, técnica e raciocínio: investigação, ofícios, ocultismo, medicina e algumas CDs/recursos de especialização.',wisdom:'Sabedoria mede percepção, intuição e leitura do ambiente: Atenção, Percepção, Intuição e algumas CDs/recursos.',presence:'Presença mede força de personalidade e imposição: Persuasão, Intimidação, Enganação, Performance e técnicas sociais.'};
const RESISTANCE_HELP = {astucia:'Astúcia é usada contra efeitos que exigem raciocínio, leitura, truques mentais ou reação intelectual.',fortitude:'Fortitude é usada contra efeitos físicos, venenos, dor, exaustão e resistência corporal.',integrity:'Integridade protege a estabilidade interna, alma, corpo e efeitos que atacam sua essência.',reflexes:'Reflexos é usado para evitar explosões, armadilhas, ataques em área e ameaças que dependem de reação rápida.',will:'Vontade é usada contra medo, compulsão, domínio mental, pressão espiritual e efeitos que desafiam determinação.'};
const SKILL_HELP = {acrobacia:'Acrobacia cobre equilíbrio, cambalhotas, quedas, saltos precisos, escapar de posições ruins e movimentos corporais complexos.',atletismo:'Atletismo cobre correr, saltar, nadar, escalar, empurrar, puxar, agarrar e feitos de força física.',direcao:'Direção cobre conduzir veículos, montarias ou movimentação controlada em deslocamento arriscado.',enganacao:'Enganação cobre mentir, blefar, disfarçar intenções e manipular informações falsas.',feiticaria:'Feitiçaria cobre conhecimento e execução de energia amaldiçoada, feitiços, técnicas e fenômenos jujutsu.',furtividade:'Furtividade cobre se esconder, se mover sem ser notado e agir silenciosamente.',historia:'História cobre conhecimento histórico, eventos, linhagens, organizações e registros relevantes.',intimidacao:'Intimidação cobre ameaçar, pressionar e impor presença para obter reação social.',intuicao:'Intuição cobre perceber intenção, mentira, emoção e riscos sutis.',investigacao:'Investigação cobre buscar pistas, interpretar detalhes e conectar evidências.',medicina:'Medicina cobre estabilizar, tratar ferimentos, diagnosticar condições e lidar com cuidados físicos.',ocultismo:'Ocultismo cobre conhecimento de maldições, rituais, barreiras, entidades e fenômenos sobrenaturais.',oficio:'Ofício exige especificar uma profissão/ferramenta. Ex.: Ferreiro, Alfaiate, Alquimia, Canalizador.',percepcao:'Percepção cobre notar ameaças, sons, movimento, detalhes visuais e emboscadas. Também alimenta Atenção.',performance:'Performance cobre atuação, música, presença pública e apresentação artística/social.',persuasao:'Persuasão cobre convencer, negociar, pedir ajuda e influenciar sem ameaça direta.',prestidigitacao:'Prestidigitação cobre truques manuais, esconder objetos, saques rápidos e manipulação fina.',sobrevivencia:'Sobrevivência cobre rastrear, se orientar, resistir em ambientes hostis e lidar com natureza.',tecnologia:'Tecnologia cobre operar, entender e consertar dispositivos modernos.',teologia:'Teologia cobre religiões, doutrinas, símbolos espirituais e tradição sagrada.'};

function uid(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function mod(v){ if(v==null || Number.isNaN(Number(v))) return 0; return Math.floor((Number(v)-10)/2); }
function signed(n){ return n>=0?`+${n}`:`${n}`; }
function rollOne(){ const dice=Array.from({length:4},()=>Math.floor(Math.random()*6)+1); const dropped=Math.min(...dice); return {id:uid(), dice, dropped, total:dice.reduce((a,b)=>a+b,0)-dropped}; }
function newRollSet(free=false){ return {id:uid(), createdAt:new Date().toISOString(), free, cost:free?0:1, rolls:Array.from({length:6},rollOne), assigned:{}}; }
function emptyCharacter(){ return {
  id: uid(), name:'', playerName:'', campaign:'', level:1, grade:'Quarto', xp:0,
  originId:'', specializationId:'', cdAttribute:'', energyAttribute:'', isRestricted:false,
  attributes:{assigned:{}, originBonuses:{}, temp:{}}, rolls:[],
  choices:{originBonuses:{}, resistances:[], skills:[], masterSkills:[], masteries:[], talents:[], aptitudes:[], aptitudeLevels:{Aura:0,'Controle e Leitura':0,Barreira:0,'Domínio':0,'Energia Reversa':0}, mundaneFeatures:[], restrictedPassives:[], restrictedActives:[], heavenlyGifts:[], interlude:{}, interludeFocus:0, skillDetails:{}},
  identity:{age:'',height:'',weight:'',sex:'',imageUrl:'',personalityTraits:'',ideals:'',bonds:'',complications:'',innateDomain:''},
  inventory:{money:0, extraSpaces:0, items:[], notes:''},
  technique:{id:'', name:'', concept:'', imageUrl:'', baseFunction:'', baseImageUrl:'', passives:[], actives:[], vows:[], domain:{name:'', text:'', benefits:['','',''], harms:['','','']}},
  combat:{hpCurrent:null, hpTemp:0, peCurrent:null, peTemp:0, soulCurrent:null, conditions:[], log:[]},
  summons:[], mundaneProfile:{exhaustionLevel:0}, levelHistory:[]
};}
function deepMerge(base, incoming){
  if(Array.isArray(base)) return Array.isArray(incoming) ? incoming : base;
  if(base && typeof base === 'object'){
    const out = {...base};
    if(incoming && typeof incoming === 'object'){
      for(const key of Object.keys(incoming)) out[key] = deepMerge(base[key], incoming[key]);
    }
    return out;
  }
  return incoming ?? base;
}
function normalizeCharacter(raw){
  const base = emptyCharacter();
  const merged = deepMerge(base, raw || {});
  merged.choices = deepMerge(base.choices, merged.choices || {});
  merged.technique = deepMerge(base.technique, merged.technique || {});
  merged.technique.domain = deepMerge(base.technique.domain, merged.technique.domain || {});
  merged.inventory = deepMerge(base.inventory, merged.inventory || {});
  merged.combat = deepMerge(base.combat, merged.combat || {});
  merged.mundaneProfile = deepMerge(base.mundaneProfile, merged.mundaneProfile || {});
  if(!Array.isArray(merged.rolls)) merged.rolls = [];
  if(!Array.isArray(merged.inventory.items)) merged.inventory.items = [];
  if(!Array.isArray(merged.technique.passives)) merged.technique.passives = [];
  if(!Array.isArray(merged.technique.actives)) merged.technique.actives = [];
  if(!Array.isArray(merged.technique.vows)) merged.technique.vows = [];
  if(!Array.isArray(merged.combat.conditions)) merged.combat.conditions = [];
  if(!Array.isArray(merged.combat.log)) merged.combat.log = [];
  return merged;
}
function initialState(){
  const base={activeTab:'Criação Guiada', credits:5, firstFreeUsed:false, characters:[emptyCharacter()], activeCharacterId:null, ruleReview:{}, communityTechniques:[], adminLog:[]};
  base.activeCharacterId=base.characters[0].id;
  try {
    const creditRaw = localStorage.getItem(CREDIT_STORAGE_KEY);
    if(creditRaw){
      const creditState = JSON.parse(creditRaw);
      base.credits = Number.isFinite(Number(creditState.credits)) ? Number(creditState.credits) : 5;
      base.firstFreeUsed = !!creditState.firstFreeUsed;
    }
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return base;
    const parsed=JSON.parse(raw);
    if(!Array.isArray(parsed.characters) || !parsed.characters.length) return base;
    const characters = parsed.characters.map(normalizeCharacter);
    const activeCharacterId = characters.some(c=>c.id===parsed.activeCharacterId) ? parsed.activeCharacterId : characters[0].id;
    return {...base, ...parsed, credits:base.credits, firstFreeUsed:base.firstFreeUsed, characters, activeCharacterId};
  } catch(e){
    console.warn('Estado local inválido. Reiniciando ficha local.', e);
    try { localStorage.removeItem(STORAGE_KEY); } catch(_) {}
    return base;
  }
}
function reducer(state, action){
  const currentId = state.activeCharacterId;
  const withChar = (fn)=> ({...state, characters: state.characters.map(c=> c.id===currentId ? fn(c) : c)});
  switch(action.type){
    case 'tab': return {...state, activeTab:action.tab};
    case 'newCharacter': { const c=emptyCharacter(); return {...state, activeCharacterId:c.id, characters:[...state.characters,c], activeTab:'Criação Guiada'}; }
    case 'selectCharacter': return {...state, activeCharacterId:action.id};
    case 'update': return withChar(c=>{ const next={...c,[action.key]:action.value}; if(action.key==='originId'){ next.choices={...next.choices, originBonuses:{}, originBonusAlloc:{}, restringidoApexAttrs:[], [DERIVADO_LIMIT_ATTR_KEY]:''}; next.attributes={...next.attributes, originBonuses:{}}; next.isRestricted=action.value==='restringido'; if(action.value==='restringido') next.specializationId='restringido'; } if(action.key==='specializationId'){ const cfg=specTrainingConfig(next); next.choices={...next.choices, resistances:[...new Set([...(cfg.resFixed||[]), ...(next.choices.resistances||[])])].slice(0,cfg.resMax)}; } return next; });
    case 'patch': return withChar(c=>({...c, ...action.patch}));
    case 'identity': return withChar(c=>({...c, identity:{...c.identity, [action.key]:action.value}}));
    case 'choice': return withChar(c=>({...c, choices:{...c.choices, [action.key]:action.value}}));
    case 'choiceObject': return withChar(c=>({...c, choices:{...c.choices, [action.key]:{...(c.choices[action.key]||{}), [action.id]:action.value}}}));
    case 'skillDetail': return withChar(c=>({...c, choices:{...c.choices, skillDetails:{...(c.choices.skillDetails||{}), [action.skillId]:action.value}}}));
    case 'adminInterludeFocus': return withChar(c=>({...c, choices:{...c.choices, interludeFocus:Math.max(0,Number(action.value)||0)}}));
    case 'setAptitudeLevel': return withChar(c=>{ const current={Aura:0,'Controle e Leitura':0,Barreira:0,'Domínio':0,'Energia Reversa':0,...(c.choices.aptitudeLevels||{})}; const next={...current,[action.key]:Math.max(0,Math.min(5,Number(action.value)||0))}; return {...c, choices:{...c.choices, aptitudeLevels:next}}; });
    case 'inventory': return withChar(c=>({...c, inventory:{...c.inventory, [action.key]:action.value}}));
    case 'combat': return withChar(c=>({...c, combat:{...c.combat, [action.key]:action.value}}));
    case 'technique': return withChar(c=>({...c, technique:{...c.technique, [action.key]:action.value}}));
    case 'roll': {
      let cost = state.firstFreeUsed ? 1 : 0;
      if(cost && state.credits < 1) return {...state, adminLog:[...state.adminLog,{id:uid(), type:'erro', text:'Sem créditos para rolar novamente.', at:new Date().toISOString()}]};
      const rs = newRollSet(cost===0);
      return {...state, credits:state.credits-cost, firstFreeUsed:true, characters:state.characters.map(c=>c.id===currentId?{...c, rolls:[...c.rolls, rs], attributes:{...c.attributes, assigned:{}}}:c), adminLog:[...state.adminLog,{id:uid(),type:'roll',text:`Rolagem ${cost===0?'gratuita':'com crédito'} realizada.`,at:new Date().toISOString()}]};
    }
    case 'assignAttr': return withChar(c=>({ ...c, attributes:{...c.attributes, assigned:{...c.attributes.assigned, [action.attr]: action.rollId}}, }));
    case 'originBonus': return withChar(c=>({ ...c, attributes:{...c.attributes, originBonuses:{...c.attributes.originBonuses, [action.attr]:action.value}}, choices:{...c.choices, originBonuses:{...c.choices.originBonuses, [action.bonusKey]:action.attr}} }));
    case 'addItem': return {...withChar(c=>({...c, inventory:{...c.inventory, items:[...c.inventory.items,{...action.item, instanceId:uid(), qty:1, freeStarter:!!action.freeStarter, equipped: action.item.type==='uniform' && !c.inventory.items.some(i=>i.type==='uniform'&&i.equipped)}]}})), adminLog:[...state.adminLog,{id:uid(),type:'item',text:`${action.item.name} ${action.freeStarter?'adicionado como equipamento gratuito':'adicionado ao inventário'}.`,at:new Date().toISOString()}]};
    case 'applyStarterEquipment': return applyStarterEquipment(state, currentId, withChar);
    case 'removeItem': return withChar(c=>({...c, inventory:{...c.inventory, items:c.inventory.items.filter(i=>i.instanceId!==action.instanceId)}}));
    case 'equipItem': return withChar(c=>({...c, inventory:{...c.inventory, items:c.inventory.items.map(i=> i.instanceId===action.instanceId ? {...i, equipped:!i.equipped} : (action.singleType && i.type===action.singleType ? {...i,equipped:false}:i))}}));
    case 'toggleCondition': return withChar(c=>({ ...c, combat:{...c.combat, conditions:c.combat.conditions.includes(action.id)?c.combat.conditions.filter(x=>x!==action.id):[...c.combat.conditions,action.id]}}));
    case 'log': return withChar(c=>({...c, combat:{...c.combat, log:[{id:uid(),at:new Date().toISOString(),...action.entry},...c.combat.log].slice(0,80)}}));
    case 'applyDamage': return withChar(c=>{ const d=Number(action.value)||0; const s=calc(c); const curr=c.combat.hpCurrent ?? s.hpMax; return {...c, combat:{...c.combat, hpCurrent:Math.max(0,curr-d), log:[{id:uid(),type:'damage',label:`Dano ${d}`,at:new Date().toISOString()},...c.combat.log]}} });
    case 'applyHeal': return withChar(c=>{ const h=Number(action.value)||0; const s=calc(c); const curr=c.combat.hpCurrent ?? s.hpMax; return {...c, combat:{...c.combat, hpCurrent:Math.min(s.hpMax,curr+h), log:[{id:uid(),type:'heal',label:`Cura ${h}`,at:new Date().toISOString()},...c.combat.log]}} });
    case 'spendPE': return withChar(c=>{ const v=Number(action.value)||0; const s=calc(c); const curr=c.combat.peCurrent ?? s.peMax; return {...c, combat:{...c.combat, peCurrent:Math.max(0,curr-v), log:[{id:uid(),type:'energy',label:`Gasto de PE ${v}`,at:new Date().toISOString()},...c.combat.log]}} });
    case 'addSummon': return withChar(c=>({...c, summons:[...c.summons,{id:uid(),name:'Invocação',grade:'-',cost:0,hpMax:10,hpCurrent:10,defense:10,movement:9,attributes:{strength:8,dexterity:8,constitution:8,intelligence:8,wisdom:8,presence:8},actions:[],traits:[]}]}));
    case 'updateSummon': return withChar(c=>({...c, summons:c.summons.map(s=>s.id===action.id?{...s,[action.key]:action.value}:s)}));
    case 'removeSummon': return withChar(c=>({...c, summons:c.summons.filter(s=>s.id!==action.id)}));
    case 'levelUp': return withChar(c=>({...c, level:Number(action.toLevel), levelHistory:[{id:uid(),from:c.level,to:Number(action.toLevel),at:new Date().toISOString(),tasks:levelTasks(c, Number(action.toLevel))},...c.levelHistory]}));
    case 'addTechFeature': return withChar(c=>({...c, technique:{...c.technique, [action.key]:[...c.technique[action.key], {id:uid(),name:'',grade:'Primeiro',cost:'0',action:'Padrão',target:'',area:'',duration:'',imageUrl:'',text:''}]}}));
    case 'updateTechFeature': return withChar(c=>({...c, technique:{...c.technique, [action.key]:c.technique[action.key].map(f=>f.id===action.id?{...f,[action.field]:action.value}:f)}}));
    case 'removeTechFeature': return withChar(c=>({...c, technique:{...c.technique, [action.key]:c.technique[action.key].filter(f=>f.id!==action.id)}}));
    case 'exportImport': return action.state;
    case 'reset': localStorage.removeItem(STORAGE_KEY); return {...initialState(), credits:state.credits, firstFreeUsed:state.firstFreeUsed};
    default: return state;
  }
}
function latestRollSet(c){ return c.rolls[c.rolls.length-1]; }
function rollValue(c, rollId){ return latestRollSet(c)?.rolls.find(r=>r.id===rollId)?.total; }

function originBonusConfig(c){
  const id=c.originId;
  if(id==='restringido') return {mode:'pool', title:'Restringido', fixed:{strength:1,dexterity:1,constitution:1}, pool:2, allowed:['strength','dexterity','constitution'], maxPer:2, text:'Força, Destreza e Constituição +1. Depois distribua +2 apenas entre atributos físicos.'};
  if(id==='sem_técnica') return {mode:'pool', title:'Sem Técnica', fixed:{}, pool:4, allowed:ATTRS.map(a=>a[0]), maxPer:3, text:'Distribua 4 pontos entre atributos, máximo 3 no mesmo atributo.'};
  if(id==='corpo_amaldiçoado_mutante') return {mode:'pool', title:'Corpo Amaldiçoado Mutante', fixed:{}, pool:2, allowed:ATTRS.map(a=>a[0]), maxPer:2, text:'Distribua 2 pontos entre atributos.'};
  if(!id) return {mode:'none', fixed:{}, pool:0, allowed:[], maxPer:0, text:'Escolha uma origem.'};
  return {mode:'split', title:'Bônus padrão', fixed:{}, plus2:true, plus1:true, text:'Escolha um atributo para +2 e outro atributo diferente para +1.'};
}
function originBonusAllocation(c){ return c.choices?.originBonusAlloc || {}; }
function originBonusValue(c,k){
  const cfg=originBonusConfig(c); let v=Number(cfg.fixed?.[k]||0);
  if(cfg.mode==='split'){
    if(c.choices?.originBonuses?.b2===k) v+=2;
    if(c.choices?.originBonuses?.b1===k) v+=1;
  } else if(cfg.mode==='pool') v += Number(originBonusAllocation(c)[k]||0);
  return v;
}
function originBonusSpent(c){ return Object.values(originBonusAllocation(c)).reduce((a,b)=>a+Number(b||0),0); }
function originBonusResolved(c){
  const cfg=originBonusConfig(c);
  if(cfg.mode==='none') return false;
  if(cfg.mode==='split') return !!c.choices?.originBonuses?.b2 && !!c.choices?.originBonuses?.b1 && c.choices.originBonuses.b2!==c.choices.originBonuses.b1;
  if(cfg.mode==='pool') return originBonusSpent(c)===cfg.pool && Object.entries(originBonusAllocation(c)).every(([k,v])=>cfg.allowed.includes(k) && Number(v)<=cfg.maxPer);
  return false;
}
function OriginBonusPanel({c,dispatch}){
  const cfg=originBonusConfig(c);
  if(cfg.mode==='none') return <div className="notice">Escolha uma origem para liberar os bônus corretos.</div>;
  if(cfg.mode==='split') return <div className="choiceBlock"><h3>Bônus de Origem</h3><p className="muted">{cfg.text}</p><div className="grid2"><Field label="+2 em atributo"><Select value={c.choices.originBonuses?.b2||''} onChange={v=>dispatch({type:'choiceObject',key:'originBonuses',id:'b2',value:v})}><option value="">—</option>{ATTRS.map(([k,l])=><option key={k} value={k} disabled={c.choices.originBonuses?.b1===k}>{l}</option>)}</Select></Field><Field label="+1 em atributo"><Select value={c.choices.originBonuses?.b1||''} onChange={v=>dispatch({type:'choiceObject',key:'originBonuses',id:'b1',value:v})}><option value="">—</option>{ATTRS.map(([k,l])=><option key={k} value={k} disabled={c.choices.originBonuses?.b2===k}>{l}</option>)}</Select></Field></div></div>;
  const alloc=originBonusAllocation(c), spent=originBonusSpent(c), remaining=Math.max(0,cfg.pool-spent);
  return <div className="choiceBlock"><h3>Bônus de Origem — {cfg.title}</h3><p className="muted">{cfg.text}</p>{Object.keys(cfg.fixed||{}).length>0&&<div className="notice">Bônus fixos: {Object.entries(cfg.fixed).map(([k,v])=>`${ATTR_LABEL[k]} +${v}`).join(', ')}</div>}<div className={remaining>0?'notice warnNotice':'notice'}><b>Distribuição:</b> {spent}/{cfg.pool}. Restantes: {remaining}.</div><div className="attrIncreaseGrid">{ATTRS.filter(([k])=>cfg.allowed.includes(k)).map(([k,l])=>{ const current=Number(alloc[k]||0); const canAdd=spent<cfg.pool && current<cfg.maxPer; return <div key={k} className="attrIncCard"><b>{l}</b><strong>+{current}</strong><div className="row"><button disabled={current<=0} onClick={()=>dispatch({type:'choiceObject',key:'originBonusAlloc',id:k,value:Math.max(0,current-1)})}>−</button><button disabled={!canAdd} onClick={()=>dispatch({type:'choiceObject',key:'originBonusAlloc',id:k,value:current+1})}>+</button></div></div>})}</div></div>;
}


// v5.0 — limite oficial de atributos
const ATTRIBUTE_CAP_BASE = 20;
const ATTRIBUTE_CAP_ITEM = 30;
const DERIVADO_LIMIT_ATTR_KEY = 'derivadoLimitAttribute';
const RESTRINGIDO_PHYSICAL_ATTRS = ['strength','dexterity','constitution'];
const ATTRIBUTE_SPECIAL_ITEM_MAP = {
  strength: ['bracelete da força'],
  dexterity: ['faixas céleres','faixas celeres'],
  constitution: ['cinturão do inabalável','cinturao do inabalavel'],
  intelligence: ['pingente do intelecto'],
  wisdom: ['anéis do conhecimento','aneis do conhecimento'],
  presence: ['ornamento fascinante']
};
function normText(v){ return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
function selectedTalentNames(c){ return (c.choices?.talents||[]).map(id=>rules.talents.find(t=>t.id===id)?.name || id); }
function hasTalentByName(c,name){ const n=normText(name); return selectedTalentNames(c).some(x=>normText(x)===n || normText(x).includes(n)); }
function getSelectedArrayChoice(c,key){ const v=c.choices?.[key]; return Array.isArray(v)?v:[]; }
function equippedAttrItem(c,k){ const targets=ATTRIBUTE_SPECIAL_ITEM_MAP[k]||[]; return (c.inventory?.items||[]).find(i=>i.equipped && targets.some(t=>normText(i.name).includes(normText(t)) || normText(i.originalText).includes(normText(t)))); }
function attributeItemBonus(c,k){ return equippedAttrItem(c,k) ? 2 : 0; }
function extraAttributeValueFromMechanics(c,k){ let total=0; if(hasTalentByName(c,'Incremento De Atributo') && c.choices?.talentIncrementAttr===k) total+=2; if(hasTalentByName(c,'Quebra De Limites') && getSelectedArrayChoice(c,'quebraLimitesAttrs').includes(k)) total+=2; if(hasTalentByName(c,'Resiliência Melhorada') && c.choices?.resilienciaMelhoradaAttr===k) total+=1; if(hasTalentByName(c,'Tempestade De Ideias') && c.choices?.tempestadeAttr===k) total+=1; if(hasTalentByName(c,'Mestre Das Armas') && c.choices?.mestreArmasAttr===k) total+=2; if(hasTalentByName(c,'Especialista Em Concussão') && c.choices?.especialistaConcussaoAttr===k) total+=1; if(hasTalentByName(c,'Especialista Em Cortes') && c.choices?.especialistaCortesAttr===k) total+=1; if(hasTalentByName(c,'Especialista Em Perfuração') && c.choices?.especialistaPerfuracaoAttr===k) total+=1; if(c.originId==='restringido' && getSelectedArrayChoice(c,'restringidoApexAttrs').includes(k)) total+=2; return total; }
function baseAttributeValue(c,k){ const base=rollValue(c,c.attributes.assigned[k]); if(base==null) return null; const inc=Number(attributeIncreaseMap(c)[k]||0); return base + originBonusValue(c,k) + Number(c.attributes.temp[k]||0) + inc + extraAttributeValueFromMechanics(c,k); }
function attributeCap(c,k){ let cap=ATTRIBUTE_CAP_BASE; if(c.originId==='restringido' && RESTRINGIDO_PHYSICAL_ATTRS.includes(k)) cap=ATTRIBUTE_CAP_ITEM; if(c.originId==='derivado' && c.choices?.[DERIVADO_LIMIT_ATTR_KEY]===k) cap += Math.floor(Number(c.level||1)/4); if(hasTalentByName(c,'Incremento De Atributo') && c.choices?.talentIncrementAttr===k) cap += 2; if(hasTalentByName(c,'Quebra De Limites') && getSelectedArrayChoice(c,'quebraLimitesAttrs').includes(k)) cap += 2; if(equippedAttrItem(c,k)) cap=ATTRIBUTE_CAP_ITEM; return Math.min(ATTRIBUTE_CAP_ITEM, cap); }
function rawFinalAttr(c,k){ const v=baseAttributeValue(c,k); if(v==null) return null; return v + attributeItemBonus(c,k); }
function attributeCapReason(c,k){ const reasons=[]; if(c.originId==='derivado' && c.choices?.[DERIVADO_LIMIT_ATTR_KEY]===k) reasons.push(`Derivado: limite +${Math.floor(Number(c.level||1)/4)} nesse atributo.`); if(c.originId==='restringido' && RESTRINGIDO_PHYSICAL_ATTRS.includes(k)) reasons.push('Restringido: Força, Destreza e Constituição têm limite 30.'); if(hasTalentByName(c,'Incremento De Atributo') && c.choices?.talentIncrementAttr===k) reasons.push('Incremento de Atributo: valor e limite +2.'); if(hasTalentByName(c,'Quebra De Limites') && getSelectedArrayChoice(c,'quebraLimitesAttrs').includes(k)) reasons.push('Quebra de Limites: valor e limite +2.'); const item=equippedAttrItem(c,k); if(item) reasons.push(`${item.name}: +2 e pode superar o limite até 30.`); return reasons.length?reasons.join(' '):'Limite padrão 20. Valores excedentes são travados até existir uma mecânica oficial que aumente o limite.'; }
function attributeOvercapProblems(c){ return ATTRS.map(([k,label])=>({k,label,raw:rawFinalAttr(c,k),final:finalAttr(c,k),cap:attributeCap(c,k)})).filter(x=>x.raw!=null && x.raw>x.cap); }
function canAddAttributeIncrease(c,k){ const projectedRaw=(rawFinalAttr(c,k)??0)+1; return projectedRaw <= attributeCap(c,k); }
function AttributeCapNotice({c}){ const problems=attributeOvercapProblems(c); return <div className={problems.length?'notice warnNotice':'notice'}><b>Limite de atributo:</b> padrão 20. Só mecânicas específicas do livro permitem passar disso. {problems.length?`Travado: ${problems.map(p=>`${p.label} ${p.raw}→${p.final} (limite ${p.cap})`).join('; ')}.`:'Nenhum atributo acima do limite atual.'}</div>; }
function AttributeLimitControls({c,dispatch}){ const selectedTalents=selectedTalentNames(c).map(normText); const hasIncrement=selectedTalents.some(n=>n.includes('incremento de atributo')); const hasBreak=selectedTalents.some(n=>n.includes('quebra de limites')); const hasResilience=selectedTalents.some(n=>n.includes('resiliencia melhorada')); const showDerived=c.originId==='derivado'; const showRestricted=c.originId==='restringido'; if(!showDerived && !showRestricted && !hasIncrement && !hasBreak && !hasResilience) return null; return <Panel title="Mecânicas que podem alterar limite de atributo"><AttributeCapNotice c={c}/><div className="grid3">{showDerived&&<Field label="Derivado — atributo de Desenvolvimento Inesperado"><Select value={c.choices?.[DERIVADO_LIMIT_ATTR_KEY]||''} onChange={v=>dispatch({type:'choice',key:DERIVADO_LIMIT_ATTR_KEY,value:v})}><option value="">Escolha</option>{ATTRS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select><small className="muted">A cada 4 níveis: +1 ponto e +1 no limite deste atributo.</small></Field>}{showRestricted&&<Field label="Restringido — Ápice Corporal"><div className="chipGrid">{RESTRINGIDO_PHYSICAL_ATTRS.map(k=>{ const arr=getSelectedArrayChoice(c,'restringidoApexAttrs'); const max=Math.floor(Number(c.level||1)/6); const active=arr.includes(k); const blocked=!active && arr.length>=max; return <label key={k} className={blocked?'chipCheck blocked':active?'chipCheck active':'chipCheck'}><input type="checkbox" checked={active} disabled={blocked} onChange={()=>dispatch({type:'choice',key:'restringidoApexAttrs',value:toggleArrayValue(arr,k).slice(0,max)})}/>{ATTR_LABEL[k]}</label>})}</div><small className="muted">+2 em um atributo físico a cada 6 níveis. Limite físico 30.</small></Field>}{hasIncrement&&<Field label="Talento: Incremento de Atributo"><Select value={c.choices?.talentIncrementAttr||''} onChange={v=>dispatch({type:'choice',key:'talentIncrementAttr',value:v})}><option value="">Escolha</option>{ATTRS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select><small className="muted">Aumenta valor e limite em +2.</small></Field>}{hasBreak&&<Field label="Talento: Quebra de Limites"><div className="chipGrid">{ATTRS.map(([k,l])=>{ const arr=getSelectedArrayChoice(c,'quebraLimitesAttrs'); const active=arr.includes(k); const blocked=!active && arr.length>=2; return <label key={k} className={blocked?'chipCheck blocked':active?'chipCheck active':'chipCheck'}><input type="checkbox" checked={active} disabled={blocked} onChange={()=>dispatch({type:'choice',key:'quebraLimitesAttrs',value:toggleArrayValue(arr,k).slice(0,2)})}/>{l}</label>})}</div><small className="muted">Escolha 2 atributos: valor +2 e limite +2.</small></Field>}{hasResilience&&<Field label="Talento: Resiliência Melhorada"><Select value={c.choices?.resilienciaMelhoradaAttr||''} onChange={v=>dispatch({type:'choice',key:'resilienciaMelhoradaAttr',value:v})}><option value="">Escolha atributo do TR</option>{ATTRS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select><small className="muted">Aumenta em +1 o atributo usado no TR escolhido.</small></Field>}</div></Panel>; }

function TalentMechanicsPanel({c,dispatch}){
  const names=selectedTalentNames(c).map(normText); const has=n=>names.some(x=>x.includes(normText(n)));
  const any = has('Tempestade De Ideias') || has('Artesão Amaldiçoado') || has('Mestre Das Armas') || has('Especialista Em Concussão') || has('Especialista Em Cortes') || has('Especialista Em Perfuração');
  if(!any) return null;
  const trainedPool=trainableSkills();
  return <Panel title="Configuração mecânica dos talentos"><p className="muted">Somente talentos que alteram ficha/core aparecem aqui. Talentos puramente de combate ficam como marcação e texto.</p><div className="grid2">
    {has('Tempestade De Ideias')&&<div className="choiceBlock"><h3>Tempestade de Ideias</h3><Field label="Atributo +1"><Select value={c.choices?.tempestadeAttr||''} onChange={v=>dispatch({type:'choice',key:'tempestadeAttr',value:v})}><option value="">Escolha</option>{ATTRS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select></Field><Field label="Perícia treinada concedida"><Select value={c.choices?.tempestadeSkill||''} onChange={v=>dispatch({type:'choice',key:'tempestadeSkill',value:v})}><option value="">Escolha</option>{trainedPool.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field><Field label="Ferramenta/Ofício concedido"><Select value={c.choices?.tempestadeOffice||''} onChange={v=>dispatch({type:'choice',key:'tempestadeOffice',value:v})}><option value="">Escolha</option>{OFFICE_OPTIONS.map(o=><option key={o} value={o}>{o}</option>)}</Select></Field><Field label="Perícia que recebe maestria do talento"><Select value={c.choices?.tempestadeMasterSkill||''} onChange={v=>{ const next=[...new Set([...(c.choices.masterSkills||[]).filter(x=>x!==c.choices?.tempestadeMasterSkill), v].filter(Boolean))].slice(0,masterSkillLimit(c)); dispatch({type:'choice',key:'tempestadeMasterSkill',value:v}); dispatch({type:'choice',key:'masterSkills',value:next}); }}><option value="">Escolha</option>{selectedTrainedSkills(c).map(id=><option key={id} value={id}>{skillName(id)}</option>)}</Select></Field></div>}
    {has('Artesão Amaldiçoado')&&<div className="choiceBlock"><h3>Artesão Amaldiçoado</h3><Field label="Ofício concedido"><Select value={c.choices?.artesaoOficio||''} onChange={v=>dispatch({type:'choice',key:'artesaoOficio',value:v})}><option value="">Escolha</option><option value="Ferreiro">Ferreiro</option><option value="Canalizador">Canalizador</option></Select></Field><p className="muted">Concede Ofício conforme texto do talento e habilita criação de ferramentas amaldiçoadas.</p></div>}
    {has('Mestre Das Armas')&&<div className="choiceBlock"><h3>Mestre das Armas</h3><Field label="Atributo +2"><Select value={c.choices?.mestreArmasAttr||''} onChange={v=>dispatch({type:'choice',key:'mestreArmasAttr',value:v})}><option value="">Escolha</option><option value="strength">Força</option><option value="dexterity">Destreza</option></Select></Field><Field label="Benefício de armas"><Select value={c.choices?.mestreArmasMode||''} onChange={v=>dispatch({type:'choice',key:'mestreArmasMode',value:v})}><option value="">Escolha</option><option value="quatro_armas">Treinado em quatro armas</option><option value="critico_grupo">Efeito crítico de um grupo</option></Select></Field></div>}
    {has('Especialista Em Concussão')&&<AttributeChoiceBlock title="Especialista em Concussão" field="especialistaConcussaoAttr" allowed={[['strength','Força'],['constitution','Constituição']]} c={c} dispatch={dispatch}/>} 
    {has('Especialista Em Cortes')&&<AttributeChoiceBlock title="Especialista em Cortes" field="especialistaCortesAttr" allowed={[['strength','Força'],['dexterity','Destreza']]} c={c} dispatch={dispatch}/>} 
    {has('Especialista Em Perfuração')&&<AttributeChoiceBlock title="Especialista em Perfuração" field="especialistaPerfuracaoAttr" allowed={[['strength','Força'],['dexterity','Destreza']]} c={c} dispatch={dispatch}/>} 
  </div></Panel>;
}
function AttributeChoiceBlock({title,field,allowed,c,dispatch}){ return <div className="choiceBlock"><h3>{title}</h3><Field label="Atributo +1"><Select value={c.choices?.[field]||''} onChange={v=>dispatch({type:'choice',key:field,value:v})}><option value="">Escolha</option>{allowed.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select></Field></div> }
function finalAttr(c,k){ const raw=rawFinalAttr(c,k); if(raw==null) return null; return Math.min(raw, attributeCap(c,k)); }
function trainingBonus(level){ return level>=17?6:level>=13?5:level>=9?4:level>=5?3:2; }
function specialization(c){ return rules.specializations.find(s=>s.id===c.specializationId); }
function origin(c){ return rules.origins.find(o=>o.id===c.originId); }

function selectedManualSkills(c){ return c.choices?.skills || []; }
function talentGrantedSkills(c){ const out=[]; if(hasTalentByName(c,'Tempestade De Ideias') && c.choices?.tempestadeSkill) out.push(c.choices.tempestadeSkill); if(hasTalentByName(c,'Artesão Amaldiçoado') && c.choices?.artesaoOficio) out.push('oficio'); return [...new Set(out)]; }
function selectedTrainedSkills(c){ return [...new Set([...selectedManualSkills(c), ...talentGrantedSkills(c)])]; }
function masterSkillLimit(c){ let n=Number(c.level||1)>=10?1:0; if(hasTalentByName(c,'Tempestade De Ideias')) n+=1; return n; }
function selectedMasterSkills(c){ return c.choices?.masterSkills || []; }
function calc(c){
  const lvl=Number(c.level)||1, tb=trainingBonus(lvl), con=mod(finalAttr(c,'constitution')), dex=mod(finalAttr(c,'dexterity')), wis=mod(finalAttr(c,'wisdom'));
  const sp=specialization(c); const uniform=c.inventory.items.find(i=>i.type==='uniform'&&i.equipped); const shield=c.inventory.items.find(i=>i.type==='shield'&&i.equipped);
  const uniformDef=uniform?.defenseBonus||0; const shieldRd=shield?.rd||0;
  const hpBase=sp?.hpBase||10, hpPer=sp?.hpPerLevel||5, pePer=sp?.energyPerLevel||0;
  const hpMax=Math.max(1,hpBase+con+(lvl-1)*(hpPer+Math.max(0,con)) + accessoryBonus(c,'hp'));
  const peMax=c.isRestricted?0:Math.max(0,pePer*lvl + accessoryBonus(c,'pe'));
  const movement=9 + accessoryBonus(c,'movement');
  const defense=10+dex+Math.floor(lvl/2)+uniformDef+accessoryBonus(c,'defense');
  const skillMap=Object.fromEntries(rules.skills.map(s=>[s.id, skillBonus(c,s)]));
  const attention=10+(skillMap.percepcao||0)+accessoryBonus(c,'attention');
  return {level:lvl,tb,hpMax,peMax,soulMax:hpMax,movement,defense,attention,initiative:dex+accessoryBonus(c,'initiative'),rd:shieldRd, skillMap};
}
function accessoryBonus(c,type){
  let bonus=0; for(const i of c.inventory.items.filter(x=>x.equipped)){ const t=(i.originalText||'').toLowerCase(); if(type==='hp' && t.includes('pontos de vida máximos aumentam em 10')) bonus+=10; if(type==='hp' && t.includes('pontos de vida máximos aumentam em 20')) bonus+=20; if(type==='defense' && t.includes('+2 na defesa')) bonus+=2; if(type==='attention' && t.includes('percepção')) bonus+=2; }
  return bonus;
}
function skillBonus(c,s){ const av=finalAttr(c,s.attribute); const trained=selectedTrainedSkills(c).includes(s.id); const master=selectedMasterSkills(c).includes(s.id); const tb=trainingBonus(c.level); return mod(av)+(master?tb*2:(trained?tb:0)); }
function inventorySpaces(c){ return c.inventory.items.reduce((sum,i)=>sum+(Number(i.spaces)||0)*(Number(i.qty)||1),0); }
function inventoryMax(c){ const f=mod(finalAttr(c,'strength')); return 8 + (f>=0? f*2 : f*2) + Number(c.inventory.extraSpaces||0); }

function trainableSkills(){ return rules.skills.filter(s=>s.id!=='iniciativa' && s.name!=='Iniciativa'); }
function resistanceName(id){ return RESISTANCES.find(r=>r[0]===id)?.[1] || id; }
function skillName(id){ return rules.skills.find(s=>s.id===id)?.name || id; }
function specTrainingConfig(c){
  const id=c.specializationId;
  const cfg={resAllowed:['astucia','fortitude','integrity','reflexes','will'],resMax:1,resFixed:[], skillAllowed:trainableSkills().map(s=>s.id), skillBaseAllowed:[], skillBaseNeed:0, skillAnyNeed:3, skillForbidden:[], masterMax:c.level>=10?1:0, notes:'Siga as escolhas de treinamento da especialização.'};
  if(id==='lutador') return {...cfg,resAllowed:['fortitude','reflexes'], skillBaseAllowed:['oficio','atletismo','acrobacia'], skillBaseNeed:1, skillAnyNeed:3, notes:'Lutador: 1 entre Ofício/Atletismo/Acrobacia + 3 perícias quaisquer. Resistência: Fortitude ou Reflexos.'};
  if(id==='especialista_combate') return {...cfg,resAllowed:['fortitude','reflexes'], skillBaseAllowed:['oficio','atletismo','acrobacia'], skillBaseNeed:2, skillAnyNeed:3, notes:'Especialista em Combate: 2 entre Ofício/Atletismo/Acrobacia + 3 perícias quaisquer. Resistência: Fortitude ou Reflexos.'};
  if(id==='especialista_tecnica') return {...cfg,resAllowed:['astucia','will'], skillBaseAllowed:['oficio','feiticaria','ocultismo'], skillBaseNeed:2, skillAnyNeed:2, notes:'Especialista em Técnica: 2 entre Ofício/Feitiçaria/Ocultismo + 2 perícias quaisquer. Resistência: Astúcia ou Vontade.'};
  if(id==='controlador') return {...cfg,resAllowed:['astucia','will'], skillBaseAllowed:['oficio','percepcao','persuasao'], skillBaseNeed:1, skillAnyNeed:2, notes:'Controlador: 1 entre Ofício/Percepção/Persuasão + 2 perícias quaisquer. Resistência: Astúcia ou Vontade.'};
  if(id==='suporte') return {...cfg,resAllowed:['astucia','will'], skillBaseAllowed:['oficio','medicina','prestigitacao'], skillBaseNeed:2, skillAnyNeed:3, notes:'Suporte: 2 entre Ofício/Medicina/Prestidigitação + 3 perícias quaisquer. Resistência: Astúcia ou Vontade.'};
  if(id==='restringido') return {...cfg,resAllowed:['fortitude','reflexes'], resMax:2, resFixed:['fortitude','reflexes'], skillBaseAllowed:['oficio'], skillBaseNeed:1, skillAnyNeed:4, skillForbidden:['feiticaria'], notes:'Restringido: Fortitude e Reflexos fixos. 1 perícia de Ofício + 4 perícias quaisquer, exceto Feitiçaria.'};
  return cfg;
}
function extraSkillSlots(c){ return Math.max(0, Math.max(mod(finalAttr(c,'intelligence')), mod(finalAttr(c,'wisdom')))); }
function skillLimit(c){ const cfg=specTrainingConfig(c); return cfg.skillBaseNeed + cfg.skillAnyNeed + extraSkillSlots(c); }
function resistanceLimit(c){ return specTrainingConfig(c).resMax; }
function talentLimit(c){ const org=origin(c); return (org?.id==='inato'?1:0) + Math.floor(Math.max(0,c.level-1)/4); }
function aptitudeLimit(c){ return c.isRestricted ? 0 : Math.max(0, Number(c.level||1)-1); }
function aptitudeLevelPointLimit(c){ const lvl=Number(c.level||1); return Math.floor(lvl/2) + (lvl>=10?1:0) + (lvl>=20?1:0); }
function getAptitudeLevels(c){ return {Aura:0,'Controle e Leitura':0,Barreira:0,'Domínio':0,'Energia Reversa':0,...(c.choices.aptitudeLevels||{})}; }
function aptitudeLevelTotal(c){ return Object.values(getAptitudeLevels(c)).reduce((a,b)=>a+Number(b||0),0); }
function aptitudeLevelFor(c, group){ return Number(getAptitudeLevels(c)[group]||0); }
function getPrereqText(item){ const m=String(item.originalText||'').match(/\[Pré-Requisito:([^\]]+)\]/i); return m ? m[1].trim() : ''; }
function attrFromName(n){ const x=String(n||'').toLowerCase(); if(x.includes('força')) return 'strength'; if(x.includes('destreza')) return 'dexterity'; if(x.includes('constituição')) return 'constitution'; if(x.includes('inteligência')) return 'intelligence'; if(x.includes('sabedoria')) return 'wisdom'; if(x.includes('presença')) return 'presence'; return null; }
function aptitudeCategory(item){ const n=(item.name||'').toLowerCase(), t=((item.originalText||'')+' '+n).toLowerCase(); if(n.startsWith('aura')||n.includes('aura')||n.includes('afinidade ampliada')||n.includes('absorção elemental')) return 'Aura'; if(t.includes('barreira')) return 'Barreira'; if(t.includes('domínio')||t.includes('dominio')) return 'Domínio'; if(t.includes('energia reversa')||t.includes('reversa')) return 'Energia Reversa'; if(t.includes('controle')||t.includes('leitura')||t.includes('fluxo')||t.includes('detectar')) return 'Controle e Leitura'; return 'Outras'; }
function aptitudeRequirementStatus(c,item){ const req=getPrereqText(item); if(!req) return {ok:true, req:''}; const problems=[]; const lvl=(String(req).match(/Nível\s*(\d+)/i)||[])[1]; if(lvl && Number(c.level)<Number(lvl)) problems.push(`Nível ${lvl}`); const apt=(String(req).match(/Nível de Aptidão em ([^0-9]+)\s*(\d+)/i)||[]); if(apt.length){ let group=apt[1].trim(); if(/aura/i.test(group)) group='Aura'; else if(/barreira/i.test(group)) group='Barreira'; else if(/domínio|dominio/i.test(group)) group='Domínio'; else if(/reversa/i.test(group)) group='Energia Reversa'; else if(/controle|leitura/i.test(group)) group='Controle e Leitura'; if(aptitudeLevelFor(c,group)<Number(apt[2])) problems.push(`${group} ${apt[2]}`); } const trained=(String(req).match(/Treinado em ([^,\]]+)/i)||[])[1]; if(trained){ const wanted=trained.trim().toLowerCase(); const ok=(c.choices.skills||[]).some(id=>skillName(id).toLowerCase().includes(wanted)); if(!ok) problems.push(`Treinado em ${trained.trim()}`); } const attrReqs=[...String(req).matchAll(/(Força|Destreza|Constituição|Inteligência|Sabedoria|Presença)\s*(\d+)/gi)]; for(const m of attrReqs){ const k=attrFromName(m[1]); if(k && (finalAttr(c,k)||0)<Number(m[2])) problems.push(`${m[1]} ${m[2]}`); } const names=(c.choices.aptitudes||[]).map(id=>rules.aptitudes.find(a=>a.id===id)?.name?.toLowerCase()).filter(Boolean); for(const a of rules.aptitudes){ if(req.toLowerCase().includes(a.name.toLowerCase()) && !names.includes(a.name.toLowerCase())) problems.push(a.name); } return {ok:problems.length===0, req, problems}; }
function interludeLimit(c){ return Math.max(0, Number(c.choices?.interludeFocus||0)); }
function clampSelection(arr, allowed, max){ const clean=[...new Set(arr)].filter(x=>!allowed || allowed.includes(x)); return clean.slice(0, Math.max(0,max)); }
function groupAptitudes(){
  const groups={Aura:[], 'Controle e Leitura':[], Barreira:[], Domínio:[], 'Energia Reversa':[], Outras:[]};
  for(const a of rules.aptitudes){ groups[aptitudeCategory(a)].push(a); }
  return groups;
}
function formatRuleText(text=''){
  return String(text||'').replace(/(CARACTERÍSTICAS|HABILIDADES|TABELA|TREINAMENTOS|Pontos de Vida|Pontos de Energia|Atributos Chave|Requisitos|No \d+º nível|No primeiro nível)/g,'\n$1').replace(/•/g,'\n•').trim();
}

function allCatalog(){ return [...rules.weapons,...rules.uniforms,...rules.shields,...rules.kits,...rules.specialItems]; }
function validation(c){
  const tasks=[];
  const add=(id,label,ok,tab,reason)=>tasks.push({id,label,ok,tab,reason});
  const cfg=specTrainingConfig(c);
  const skillAllowed=trainableSkills().map(s=>s.id).filter(id=>!cfg.skillForbidden.includes(id));
  const invalidSkills=(c.choices.skills||[]).filter(id=>!skillAllowed.includes(id));
  const invalidRes=(c.choices.resistances||[]).filter(id=>!cfg.resAllowed.includes(id));
  const skillMax=skillLimit(c), resMax=resistanceLimit(c), talentMax=talentLimit(c), aptMax=aptitudeLimit(c), aptLvlMax=aptitudeLevelPointLimit(c);
  const baseChosen=(c.choices.skills||[]).filter(id=>cfg.skillBaseAllowed.includes(id)).length;
  const masterMax=masterSkillLimit(c);
  const invalidMasters=(c.choices.masterSkills||[]).filter(id=>!selectedTrainedSkills(c).includes(id));
  const invalidAptitudes=(c.choices.aptitudes||[]).map(id=>rules.aptitudes.find(a=>a.id===id)).filter(Boolean).filter(a=>!aptitudeRequirementStatus(c,a).ok);
  add('rolls','Rolar atributos 4d6 descartando o menor',!!latestRollSet(c),'Criação Guiada','Atributos começam vazios.');
  add('assign','Distribuir os 6 resultados rolados',ATTRS.every(([k])=>c.attributes.assigned[k]),'Criação Guiada','Cada atributo deve receber um resultado.');
  add('origin','Escolher Origem',!!c.originId,'Criação Guiada');
  add('originBonus','Resolver bônus da Origem',originBonusResolved(c),'Criação Guiada','Cada Origem tem sua própria regra de bônus; distribua conforme o texto da Origem.');
  add('spec','Escolher Especialização',!!c.specializationId,'Criação Guiada');
  add('cd','Escolher atributo de CD',!!c.cdAttribute,'Criação Guiada');
  add('res',`Escolher resistências permitidas (${(c.choices.resistances||[]).length}/${resMax})`,(c.choices.resistances||[]).length===resMax && invalidRes.length===0,'Criação Guiada', invalidRes.length?`Inválidas: ${invalidRes.map(resistanceName).join(', ')}`:cfg.notes);
  add('skills',`Escolher perícias treinadas (${(c.choices.skills||[]).length}/${skillMax})`,(c.choices.skills||[]).length===skillMax && invalidSkills.length===0 && baseChosen>=cfg.skillBaseNeed,'Criação Guiada', invalidSkills.length?`Inválidas: ${invalidSkills.map(skillName).join(', ')}`:`Precisa ${cfg.skillBaseNeed} do grupo da especialização; escolhidas ${baseChosen}. Bônus por Inteligência ou Sabedoria: +${extraSkillSlots(c)}.`);
  add('masterSkill',`Perícia mestre (${(c.choices.masterSkills||[]).length}/${masterMax})`,masterMax===0 || ((c.choices.masterSkills||[]).length===masterMax && invalidMasters.length===0),'Criação Guiada','Escolha perícias treinadas para se tornarem Mestre quando o nível/talento liberar.');
  add('talents',`Talentos dentro do limite (${(c.choices.talents||[]).length}/${talentMax})`,(c.choices.talents||[]).length<=talentMax,'Perfil Mundano','Talentos ficam bloqueados quando o limite é atingido.');
  add('equip1','Escolher 2 equipamentos iniciais de custo 1',c.inventory.items.filter(i=>Number(i.cost)===1).length>=2,'Registro e Inventário');
  add('uniform','Equipar uniforme comum/inicial',c.inventory.items.some(i=>i.type==='uniform'),'Registro e Inventário');
  add('kit','Escolher 1 kit de ferramentas',c.inventory.items.some(i=>i.type==='kit'),'Registro e Inventário');
  add('tech','Escolher/cadastrar Técnica ou ativar Perfil Restrito',c.isRestricted || c.technique.name || c.technique.id,'Perfil Amaldiçoado');
  add('apt',`Aptidões escolhidas (${(c.choices.aptitudes||[]).length}/${aptMax})`,c.isRestricted || ((c.choices.aptitudes||[]).length<=aptMax && invalidAptitudes.length===0),'Perfil Amaldiçoado', invalidAptitudes.length?`Aptidões sem pré-requisito: ${invalidAptitudes.map(a=>a.name).join(', ')}`:'No nível 1 o limite padrão fica 0; uma nova aptidão é recebida sempre que subir de nível.');
  add('aptLevels',`Níveis de Aptidão distribuídos (${aptitudeLevelTotal(c)}/${aptLvlMax})`,c.isRestricted || aptitudeLevelTotal(c)<=aptLvlMax,'Perfil Amaldiçoado','Em todo nível par, aumenta 1 nível de aptidão; nos níveis 10 e 20 aumenta 1 nível adicional. Máximo 5 por aptidão.');
  if((c.choices.skills||[]).includes('oficio')) add('oficio-detail','Informar qual Ofício foi treinado.',!!(c.choices.skillDetails||{}).oficio,'Criação Guiada','Ex.: Ferreiro, Alfaiate, Canalizador, Alquimia.');
  return tasks;
}
function parseSpecLevelGains(text=''){ const gains={}; String(text||'').split(/\n/).map(x=>x.trim()).forEach(line=>{ const m=line.match(/^(\d+)[º°]?\s+(.+)$/i); if(m){ const lvl=Number(m[1]); if(lvl>=1&&lvl<=20) gains[lvl]=m[2].trim(); }}); return gains; }
function levelTasks(c,to){ const tasks=[]; const sp=specialization(c); const gains=parseSpecLevelGains(sp?.originalText||''); for(let lvl=c.level+1; lvl<=to; lvl++){ tasks.push(`Nível ${lvl}: adicionar +1 dado de vida da especialização e recalcular PV máximo; recalcular PE/Estamina, Defesa, Atenção e limites.`); if(!c.isRestricted) tasks.push(`Nível ${lvl}: receber 1 Aptidão Amaldiçoada, respeitando pré-requisitos do capítulo de Aptidões.`); const gain=gains[lvl]||''; if(gain) tasks.push(`${sp?.name||'Especialização'}, nível ${lvl}: ${gain}.`); if(/Habilidade/i.test(gain)) tasks.push(`Nível ${lvl}: escolher a habilidade de ${sp?.name||'especialização'} liberada pela tabela. Se a tabela permitir substituição, pode escolher um Talento no lugar.`); if(lvl%4===0) tasks.push(`Nível ${lvl}: distribuir +2 pontos de atributo.`); if([5,9,13,17].includes(lvl)) tasks.push(`Nível ${lvl}: bônus de treinamento aumenta para ${trainingBonus(lvl)}.`); if(lvl===10) tasks.push('Nível 10: escolher 1 perícia treinada para se tornar Mestre.'); const detected=extractSpecUnlocks(sp?.originalText||'',lvl); detected.forEach(x=>tasks.push(`Texto da especialização no nível ${lvl}: ${x}`)); } tasks.push('Bônus de Interlúdio NÃO é ganho automaticamente por nível: deve ser concedido pelo mestre/admin.'); return [...new Set(tasks)]; }
function extractSpecUnlocks(text,lvl){ const out=[]; const patterns=[`No nível ${lvl}`,`No ${lvl}º nível`,`Nos níveis ${lvl}`]; for(const p of patterns){ const idx=String(text).indexOf(p); if(idx>=0) out.push(String(text).slice(idx,idx+180).replace(/\s+/g,' ').trim()); } return out.slice(0,3); }
function usePersist(state){ useEffect(()=>{ const persist={...state}; delete persist.credits; delete persist.firstFreeUsed; localStorage.setItem(STORAGE_KEY, JSON.stringify(persist)); localStorage.setItem(CREDIT_STORAGE_KEY, JSON.stringify({credits:state.credits, firstFreeUsed:state.firstFreeUsed})); },[state]); }
function Tooltip({text}){ const [open,setOpen]=useState(false); return <span className="tip"><button onClick={()=>setOpen(!open)} className="q">?</button>{open&&<span className="tipbox">{text}</span>}</span>; }
function ModalText({title,text,onClose}){ return <div className="modalOverlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modalHead"><h2>{title}</h2><button onClick={onClose}>Fechar</button></div><div className="modalText">{String(text||'').split(/\n{2,}|(?=•)/).filter(Boolean).map((p,i)=><p key={i}>{p.trim()}</p>)}</div></div></div>; }
function App(){ const [state,dispatch]=useReducer(reducer,undefined,initialState); usePersist(state); const c=state.characters.find(x=>x.id===state.activeCharacterId)||state.characters[0]; const stats=calc(c); const tasks=validation(c); const pending=tasks.filter(t=>!t.ok); const [showMobile,setShowMobile]=useState(false);
  return <div className="app"><header className="top"><div><h1>Feiticeiros & Maldições</h1><p>Ficha automatizada · criação guiada · compêndio interno · banco comunitário de técnicas</p></div><div className="topActions"><span className="pill"><Coins size={16}/> {state.credits} créditos</span><select value={c.id} onChange={e=>dispatch({type:'selectCharacter',id:e.target.value})}>{state.characters.map(ch=><option key={ch.id} value={ch.id}>{ch.name||'Personagem sem nome'}</option>)}</select><button onClick={()=>dispatch({type:'newCharacter'})}>Novo</button><button onClick={()=>downloadState(state)}>Exportar</button><label className="button">Importar<input type="file" hidden accept=".json" onChange={e=>importFile(e,dispatch)}/></label><button className="danger" onClick={()=>confirm('Resetar dados locais?')&&dispatch({type:'reset'})}>Reset local</button></div></header>
  <nav className="tabs"><button className="hamb" onClick={()=>setShowMobile(!showMobile)}>{showMobile?'Ocultar abas':'Mostrar abas'}</button><div className={showMobile?'tabsInner open':'tabsInner'}>{TABS.map(t=><button key={t} className={state.activeTab===t?'active':''} onClick={()=>dispatch({type:'tab',tab:t})}>{t}{t==='Criação Guiada'&&pending.length?<b>{pending.length}</b>:null}</button>)}</div></nav>
  {pending.length>0 && <div className="pendingBar"><AlertTriangle size={18}/><b>Ficha com {pending.length} pendências.</b>{pending.slice(0,5).map(p=><span key={p.id}>{p.label}</span>)}</div>}
  <main>{state.activeTab==='Criação Guiada'&&<Creation c={c} state={state} dispatch={dispatch} tasks={tasks}/>} {state.activeTab==='Ficha/Combate'&&<CombatSheet c={c} dispatch={dispatch} stats={stats}/>} {state.activeTab==='Valores'&&<Values c={c} dispatch={dispatch} stats={stats}/>} {state.activeTab==='Registro e Inventário'&&<Inventory c={c} dispatch={dispatch}/>} {state.activeTab==='Perfil Mundano'&&<Mundane c={c} dispatch={dispatch}/>} {state.activeTab==='Perfil Amaldiçoado'&&<Cursed c={c} dispatch={dispatch}/>} {state.activeTab==='Perfil Restrito'&&<Restricted c={c} dispatch={dispatch}/>} {state.activeTab==='Bônus de Interlúdio'&&<Interlude c={c} dispatch={dispatch}/>} {state.activeTab==='Invocações'&&<Summons c={c} dispatch={dispatch}/>} {state.activeTab==='Técnicas'&&<TechniqueBank c={c} state={state} dispatch={dispatch}/>} {state.activeTab==='Level Up'&&<LevelUp c={c} dispatch={dispatch}/>} {state.activeTab==='Compêndio'&&<Compendium/>} {state.activeTab==='Admin'&&<Admin state={state}/>}</main></div> }
function Field({label,children}){ return <label className="field"><span>{label}</span>{children}</label> }
function Select({value,onChange,children}){ return <select value={value||''} onChange={e=>onChange(e.target.value)}>{children}</select> }
function Creation({c,state,dispatch,tasks}){ const rs=latestRollSet(c); const sp=specialization(c); const org=origin(c); const cfg=specTrainingConfig(c); const usedRollIds=Object.values(c.attributes.assigned).filter(Boolean); const allowedRes=RESISTANCES.filter(([id])=>cfg.resAllowed.includes(id)); const skillPool=trainableSkills().filter(s=>!cfg.skillForbidden.includes(s.id)); const skillMax=skillLimit(c), resMax=resistanceLimit(c); const cleanRes=clampSelection(c.choices.resistances||[],cfg.resAllowed,resMax); const cleanSkills=clampSelection(c.choices.skills||[],skillPool.map(s=>s.id),skillMax); return <section className="grid gap"><Panel title="1. Dados básicos"><div className="grid3"><Field label="Nome"><input value={c.name} onChange={e=>dispatch({type:'update',key:'name',value:e.target.value})}/></Field><Field label="Jogador"><input value={c.playerName} onChange={e=>dispatch({type:'update',key:'playerName',value:e.target.value})}/></Field><Field label="Campanha"><input value={c.campaign} onChange={e=>dispatch({type:'update',key:'campaign',value:e.target.value})}/></Field><Field label="Nível"><input type="number" min="1" max="20" value={c.level} onChange={e=>dispatch({type:'update',key:'level',value:Number(e.target.value)})}/></Field><Field label="Grau"><Select value={c.grade} onChange={v=>dispatch({type:'update',key:'grade',value:v})}>{['Quarto','Terceiro','Segundo','Primeiro','Especial'].map(x=><option key={x}>{x}</option>)}</Select></Field></div></Panel>
  <Panel title="2. Atributos por rolagem" help="Role seis resultados. Depois distribua livremente cada resultado entre Força, Destreza, Constituição, Inteligência, Sabedoria e Presença."><button className="gold" onClick={()=>dispatch({type:'roll'})}>{rs?'Rerolar atributos':'Rolar atributos'}</button>{rs&&<><div className="rolls">{rs.rolls.map(r=><span key={r.id} className={usedRollIds.includes(r.id)?'used':''}>{r.total}<small>{r.dice.join(', ')} − {r.dropped}</small></span>)}</div><div className="attrGrid">{ATTRS.map(([k,label])=><div className="attrCard" key={k}><h3>{label}<Tooltip text={ATTRIBUTE_HELP[k]}/></h3><select value={c.attributes.assigned[k]||''} onChange={e=>dispatch({type:'assignAttr',attr:k,rollId:e.target.value})}><option value="">—</option>{rs.rolls.map(r=><option key={r.id} value={r.id} disabled={usedRollIds.includes(r.id)&&c.attributes.assigned[k]!==r.id}>{r.total}</option>)}</select><b>{finalAttr(c,k)??'—'}</b><strong>{signed(mod(finalAttr(c,k)))}</strong></div>)}</div></>}</Panel>
  <Panel title="3. Origem e bônus"><div className="grid2"><Field label="Origem"><Select value={c.originId} onChange={v=>{ const o=rules.origins.find(x=>x.id===v); dispatch({type:'patch',patch:{originId:v,isRestricted:!!o?.isRestricted, choices:{...c.choices,resistances:[],skills:[],aptitudes:[]}}})}}><option value="">Escolha</option>{rules.origins.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field><Field label="Caminho"><label className="check"><input type="checkbox" checked={c.isRestricted} onChange={e=>dispatch({type:'update',key:'isRestricted',value:e.target.checked})}/> Perfil Restrito</label></Field></div>{org&&<RuleBox title={org.name} text={org.originalText}/>}<div className="grid2"><Field label="Bônus +2"><Select value={c.choices.originBonuses.plus2} onChange={v=>dispatch({type:'originBonus',bonusKey:'plus2',attr:v,value:2})}><option value="">Escolha</option>{ATTRS.map(([k,l])=><option key={k} value={k} disabled={c.choices.originBonuses.plus1===k}>{l}</option>)}</Select></Field><Field label="Bônus +1"><Select value={c.choices.originBonuses.plus1} onChange={v=>dispatch({type:'originBonus',bonusKey:'plus1',attr:v,value:1})}><option value="">Escolha</option>{ATTRS.map(([k,l])=><option key={k} value={k} disabled={c.choices.originBonuses.plus2===k}>{l}</option>)}</Select></Field></div></Panel>
  <Panel title="4. Especialização e escolhas principais"><div className="grid3"><Field label="Especialização"><Select value={c.specializationId} onChange={v=>dispatch({type:'patch',patch:{specializationId:v, choices:{...c.choices,resistances:[],skills:[],masterSkills:[]}}})}><option value="">Escolha</option>{rules.specializations.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field><Field label="Atributo de CD"><Select value={c.cdAttribute} onChange={v=>dispatch({type:'update',key:'cdAttribute',value:v})}><option value="">Escolha</option>{(sp?.cdAttributes||ATTRS.map(a=>a[0])).map(k=><option key={k} value={k}>{ATTR_LABEL[k]}</option>)}</Select></Field><Field label="Atributo de Energia"><Select value={c.energyAttribute} onChange={v=>dispatch({type:'update',key:'energyAttribute',value:v})}><option value="">Escolha</option>{ATTRS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select></Field></div>{sp&&<RuleBox title={sp.name} text={sp.originalText}/>}<div className="limitNote"><b>Resistências: {(c.choices.resistances||[]).length}/{resMax}</b><span>{cfg.notes}</span></div><LimitedChoiceGrid title="Resistências permitidas" items={allowedRes.map(([id,n])=>({id,name:n,originalText:RESISTANCE_HELP[id]}))} selected={cleanRes} limit={resMax} onChange={arr=>dispatch({type:'choice',key:'resistances',value:clampSelection(arr,cfg.resAllowed,resMax)})}/><div className="limitNote"><b>Perícias treinadas: {(c.choices.skills||[]).length}/{skillMax}</b><span>Não inclui Iniciativa. Escolha INT ou SAB para perícias extras; usa o maior modificador: +{extraSkillSlots(c)}. Perícias mestre liberadas no nível 10.</span></div><LimitedChoiceGrid title="Perícias que podem ser treinadas" items={skillPool.map(s=>({...s,name:s.name,originalText:(SKILL_HELP[s.id]||'Perícia treinável.')+(cfg.skillBaseAllowed.includes(s.id)?'\n\nEsta perícia conta para o grupo obrigatório da sua especialização.':'')}))} selected={cleanSkills} limit={skillMax} onChange={arr=>dispatch({type:'choice',key:'skills',value:clampSelection(arr,skillPool.map(s=>s.id),skillMax)})}/>{(cleanSkills.includes('oficio'))&&<Field label="Especialização de Ofício"><input placeholder="Ex.: Ferreiro, Alfaiate, Canalizador, Alquimia..." value={(c.choices.skillDetails||{}).oficio||''} onChange={e=>dispatch({type:'skillDetail',skillId:'oficio',value:e.target.value})}/></Field>}{c.level>=10&&<LimitedChoiceGrid title={`Perícias Mestre: ${(c.choices.masterSkills||[]).length}/${cfg.masterMax}`} items={skillPool.filter(s=>(c.choices.skills||[]).includes(s.id))} selected={c.choices.masterSkills||[]} limit={cfg.masterMax} onChange={arr=>dispatch({type:'choice',key:'masterSkills',value:clampSelection(arr,c.choices.skills||[],cfg.masterMax)})}/>}</Panel>
  <Panel title="5. Equipamento inicial"><p>Escolha pelo menos dois equipamentos de custo 1, um uniforme e um kit. Clique em “?” para ver o texto e use o catálogo completo em Registro e Inventário.</p><CatalogQuick dispatch={dispatch}/></Panel>
  <Panel title="6. Pendências"><div className="taskList">{tasks.map(t=><div key={t.id} className={t.ok?'ok':'bad'}>{t.ok?<CheckCircle2/>:<AlertTriangle/>}<span>{t.label}</span><small>{t.reason}</small><button onClick={()=>dispatch({type:'tab',tab:t.tab})}>Ir</button></div>)}</div></Panel></section> }
function LimitedChoiceGrid({title,items,selected,onChange,limit=999}){ return <div><h3>{title}</h3><div className="choiceGrid">{items.map(i=>{ const checked=selected.includes(i.id); const blocked=!checked && selected.length>=limit; const info=i.originalText||i.tooltip||SKILL_HELP[i.id]||RESISTANCE_HELP[i.id]||'Esta opção é válida para esta escolha.'; return <label key={i.id} className={blocked?'check blocked':'check'} title={blocked?'Limite atingido':''}><input type="checkbox" checked={checked} disabled={blocked} onChange={e=>onChange(e.target.checked?[...selected,i.id]:selected.filter(x=>x!==i.id))}/>{i.name}<Tooltip text={info}/>{blocked&&<small className="warn">Limite atingido</small>}</label>})}</div></div> }
function ChoiceGrid({title,items,selected,onChange,limit=999}){ return <LimitedChoiceGrid title={title} items={items} selected={selected} onChange={onChange} limit={limit}/> }
function RuleBox({title,text}){ const [open,setOpen]=useState(false); const formatted=formatRuleText(text||''); return <div className="ruleBox readable"><h3>{title}</h3><p>{formatted.slice(0,900)}{formatted.length>900?'...':''}</p>{formatted.length>900&&<button onClick={()=>setOpen(true)}>Ver texto completo</button>}{open&&<ModalText title={title} text={formatted} onClose={()=>setOpen(false)}/>}</div> }
function Panel({title,children,help}){ return <section className="panel"><h2>{title}{help&&<Tooltip text={help}/>}</h2>{children}</section> }
function Stat({label,value,icon}){ return <div className="stat">{icon}<span>{label}</span><b>{value}</b></div> }
function CombatSheet({c,dispatch,stats}){ const [dmg,setDmg]=useState(''); const [heal,setHeal]=useState(''); const [pe,setPe]=useState(''); const equipped=c.inventory.items.filter(i=>i.equipped); return <section className="grid gap"><Panel title="Ficha / Combate"><div className="heroGrid"><div><h2>{c.name||'Personagem sem nome'}</h2><p>{origin(c)?.name||'Origem não escolhida'} · {specialization(c)?.name||'Especialização não escolhida'} · Nível {c.level}</p></div><Stat label="Defesa" value={stats.defense} icon={<Shield/>}/><Stat label="Atenção" value={stats.attention} icon={<Eye/>}/><Stat label="Movimento" value={`${stats.movement}m`} icon={<Swords/>}/></div><div className="resources"><Resource label="PV" current={c.combat.hpCurrent??stats.hpMax} max={stats.hpMax} temp={c.combat.hpTemp}/><Resource label="PE/Estamina" current={c.combat.peCurrent??stats.peMax} max={stats.peMax} temp={c.combat.peTemp}/><Resource label="Alma" current={c.combat.soulCurrent??stats.soulMax} max={stats.soulMax} temp={0}/></div><div className="grid3"><Field label="Dano recebido"><input value={dmg} onChange={e=>setDmg(e.target.value)} /><button onClick={()=>{dispatch({type:'applyDamage',value:dmg});setDmg('')}}>Aplicar dano</button></Field><Field label="Cura recebida"><input value={heal} onChange={e=>setHeal(e.target.value)} /><button onClick={()=>{dispatch({type:'applyHeal',value:heal});setHeal('')}}>Aplicar cura</button></Field><Field label="Gasto de PE"><input value={pe} onChange={e=>setPe(e.target.value)} /><button onClick={()=>{dispatch({type:'spendPE',value:pe});setPe('')}}>Gastar</button></Field></div></Panel><Panel title="Ações rápidas e ataques"><div className="cards">{equipped.filter(i=>i.type==='weapon'||i.type==='shield').map(i=><WeaponCard key={i.instanceId} item={i} compact/>)}{equipped.length===0&&<p>Nenhum equipamento equipado.</p>}</div><div className="actionList">{rules.combatActions.map(a=><details key={a.id}><summary>{a.name}</summary><p>{a.originalText}</p></details>)}</div></Panel><Panel title="Condições"><div className="conditionGrid">{rules.conditions.map(cond=><label key={cond.id} className={c.combat.conditions.includes(cond.id)?'condition active':'condition'}><input type="checkbox" checked={c.combat.conditions.includes(cond.id)} onChange={()=>dispatch({type:'toggleCondition',id:cond.id})}/><b>{cond.name}</b><Tooltip text={cond.originalText}/></label>)}</div></Panel><Panel title="Log de sessão"><div className="log">{c.combat.log.map(l=><div key={l.id}><span>{new Date(l.at).toLocaleTimeString()}</span>{l.label}</div>)}</div></Panel></section> }
function Resource({label,current,max,temp}){ return <div className="resource"><h3>{label}</h3><b>{current}/{max}</b><small>Temp. {temp||0}</small><div className="bar"><i style={{width:`${Math.max(0,Math.min(100,(max?current/max:0)*100))}%`}}/></div></div> }
function Values({c,dispatch,stats}){ return <section className="sheetLike"><Panel title="Valores"><div className="valuesLayout"><div><h3>Testes e Perícias</h3><table><tbody>{rules.skills.map(s=><tr key={s.id}><td>{s.name}</td><td>{ATTR_LABEL[s.attribute]}</td><td>{c.choices.skills.includes(s.id)?'Treinado':'-'}</td><td><b>{signed(stats.skillMap[s.id]||0)}</b></td></tr>)}</tbody></table></div><div><h3>Atributos</h3><div className="attrOrbit">{ATTRS.map(([k,l,abbr])=><div key={k} className="orb"><span>{abbr}</span><b>{finalAttr(c,k)??0}</b><small>{signed(mod(finalAttr(c,k)))}</small></div>)}</div></div><div><h3>Defesas</h3><Stat label="Defesa" value={stats.defense}/><Stat label="RD" value={stats.rd}/><Stat label="Atenção" value={stats.attention}/><Stat label="Movimento" value={`${stats.movement}m`}/></div></div></Panel><Panel title="Registro Rápido">{c.inventory.items.filter(i=>i.equipped&&(i.type==='weapon'||i.type==='shield')).map(i=><WeaponCard key={i.instanceId} item={i} compact/> )}</Panel></section> }
function CatalogQuick({dispatch}){ const items=[...rules.weapons.filter(x=>x.cost===1).slice(0,8), rules.uniforms[0], ...rules.kits.slice(0,3)]; return <div className="catalogButtons">{items.map(i=><button key={i.id} onClick={()=>dispatch({type:'addItem',item:i})}>{i.name}</button>)}</div> }
function Inventory({c,dispatch}){ const [filter,setFilter]=useState(''); const catalog=allCatalog().filter(i=>(i.name+' '+i.type+' '+(i.category||'')).toLowerCase().includes(filter.toLowerCase())); return <section className="grid gap"><Panel title={`Inventário — ${inventorySpaces(c)} / ${inventoryMax(c)} espaços`}><div className="grid2"><Field label="Dinheiro atual"><input type="number" value={c.inventory.money} onChange={e=>dispatch({type:'inventory',key:'money',value:Number(e.target.value)})}/></Field><Field label="Espaços extras"><input type="number" value={c.inventory.extraSpaces} onChange={e=>dispatch({type:'inventory',key:'extraSpaces',value:Number(e.target.value)})}/></Field></div><Field label="Buscar no catálogo completo"><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="arma, uniforme, escudo, kit, acessório..."/></Field><div className="catalogGroups"><CatalogGroup title="Armas" items={catalog.filter(i=>i.type==='weapon')} dispatch={dispatch}/><CatalogGroup title="Uniformes" items={catalog.filter(i=>i.type==='uniform')} dispatch={dispatch}/><CatalogGroup title="Escudos" items={catalog.filter(i=>i.type==='shield')} dispatch={dispatch}/><CatalogGroup title="Kits" items={catalog.filter(i=>i.type==='kit')} dispatch={dispatch}/><CatalogGroup title="Itens Especiais / Acessórios" items={catalog.filter(i=>i.type==='special')} dispatch={dispatch}/></div></Panel><Panel title="Itens carregados e cards de equipamento"><div className="cards equipmentCards">{c.inventory.items.map(i=><WeaponCard key={i.instanceId} item={i} dispatch={dispatch}/>)}</div></Panel><Panel title="Anotações"><textarea value={c.inventory.notes} onChange={e=>dispatch({type:'inventory',key:'notes',value:e.target.value})}/></Panel></section> }
function CatalogGroup({title,items,dispatch}){ const [open,setOpen]=useState(title==='Armas'); const [modal,setModal]=useState(null); return <div className="catalogGroup"><h3 onClick={()=>setOpen(!open)}>{open?<ChevronUp/>:<ChevronDown/>}{title} <small>{items.length}</small></h3>{open&&<div className="catalogButtons">{items.map(i=><span key={i.id} className="catalogPick"><button onClick={()=>dispatch({type:'addItem',item:i})}>{i.name}<small>C{i.cost??0} · E{i.spaces??0}</small></button><button className="q mini" onClick={()=>setModal(i)}>?</button></span>)}</div>}{modal&&<ModalText title={modal.name} text={formatRuleText(modal.originalText||'Sem descrição cadastrada.')} onClose={()=>setModal(null)}/>}</div> }
function WeaponCard({item,dispatch,compact}){ const [open,setOpen]=useState(false); const isShield=item.type==='shield'; const isUniform=item.type==='uniform'; return <div className="equipCard sheetCard"><div className="equipTitle"><b>{item.name}</b><span>{item.type}</span></div><div className="equipGrid"><span>Grau Am.</span><b>{item.grade||'-'}</b><span>{isUniform?'Defesa':isShield?'Dano/RD':'Dano'}</span><b>{isUniform?item.defenseBonus:isShield?`${item.damage||'-'} / RD ${item.rd||0}`:item.damage}</b><span>Grupo/Tipo</span><b>{item.group||item.category||item.kind||'-'}</b><span>Crítico/Ônus</span><b>{item.critical||item.penalty||'-'}</b><span>Alcance</span><b>{item.range||item.kind||'-'}</b><span>Custo/Espaço</span><b>C{item.cost??0} / E{item.spaces??0}</b></div>{!compact&&<><h4>Características / Propriedades</h4><p>{Array.isArray(item.properties)?item.properties.join(', '):(item.properties||item.originalText?.slice(0,220)||'—')}</p><h4>Habilidade Especial</h4><p>{item.specialText||'—'}</p><h4>Característica Especial / Encantamentos</h4><p>{item.customNotes||'—'}</p><div className="row"><button onClick={()=>dispatch({type:'equipItem',instanceId:item.instanceId,singleType:isUniform?'uniform':null})}>{item.equipped?'Desequipar':'Equipar'}</button><button className="danger" onClick={()=>dispatch({type:'removeItem',instanceId:item.instanceId})}><Trash2 size={16}/>Remover</button><button onClick={()=>setOpen(true)}>Ver descrição</button></div></>}{open&&<ModalText title={item.name} text={formatRuleText(item.originalText||'Sem descrição cadastrada.')} onClose={()=>setOpen(false)}/>}</div> }
function Mundane({c,dispatch}){ const sp=specialization(c), org=origin(c); const tMax=talentLimit(c); const selected=c.choices.talents||[]; return <section className="grid gap"><Panel title="Perfil Mundano"><div className="grid3"><Stat label="Especialização" value={sp?.name||'—'}/><Stat label="Origem" value={org?.name||'—'}/><Stat label="Exaustão" value={c.mundaneProfile?.exhaustionLevel||0}/></div></Panel><Panel title="Habilidades automáticas de Origem e Especialização"><div className="cards">{org&&<FeatureCard title={org.name} text={org.originalText}/>} {sp&&<FeatureCard title={`Habilidades Base de ${sp.name}`} text={sp.originalText}/>}</div>{sp&&<details open><summary>Desbloqueios detectados da especialização</summary><ul>{detectSpecMilestones(sp.originalText).map((x,i)=><li key={i}>{x}</li>)}</ul></details>}</Panel><TalentMechanicsPanel c={c} dispatch={dispatch}/><Panel title={`Talentos e escolhas de level up: ${selected.length}/${tMax}`}><p className="muted">Todo level up exige escolher 1 habilidade de Especialização OU 1 talento. Talentos só ficam marcáveis dentro do limite atual; use “?” para ler o texto completo e requisitos.</p><LimitedChoiceGrid title="Talentos disponíveis" items={rules.talents} selected={selected} limit={tMax} onChange={arr=>dispatch({type:'choice',key:'talents',value:clampSelection(arr,rules.talents.map(t=>t.id),tMax)})}/></Panel></section> }
function detectSpecMilestones(text=''){ const out=[]; String(text).split(/\n/).forEach(line=>{ if(/No (primeiro|\d|\d+º)|Nos níveis|No nível/.test(line) && line.length<240) out.push(line.trim()); }); return out.slice(0,20); }
function FeatureCard({title,text}){ const [open,setOpen]=useState(false); return <div className="feature readable"><h3>{title}</h3><p>{formatRuleText(text||'').slice(0,900)}</p><button onClick={()=>setOpen(true)}>Consultar texto completo</button>{open&&<ModalText title={title} text={formatRuleText(text||'')} onClose={()=>setOpen(false)}/>}</div> }
function Cursed({c,dispatch}){ const groups=groupAptitudes(); const max=aptitudeLimit(c); const lvlMax=aptitudeLevelPointLimit(c); const lvlUsed=aptitudeLevelTotal(c); const levels=getAptitudeLevels(c); return <section className="grid gap"><Panel title="Aspectos de Técnica e Aptidões"><div className="grid2"><div className="miniPanel"><h3>Aspectos de Técnica</h3><Stat label="Nível de Habilidades" value="1º"/><Stat label="Habilidades Conhecidas" value={(c.technique.passives.length+c.technique.actives.length)}/><Field label="Atributo de Técnica"><Select value={c.cdAttribute} onChange={v=>dispatch({type:'update',key:'cdAttribute',value:v})}>{ATTRS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select></Field></div><div className="miniPanel"><h3>Níveis de Aptidão</h3><p className="muted">Distribuídos: {lvlUsed}/{lvlMax}. Cada aptidão vai de 0 a 5. Nível 1 começa com tudo 0.</p>{['Aura','Controle e Leitura','Barreira','Domínio','Energia Reversa'].map(g=><div key={g} className="aptLevelRow"><span>{g}</span><div><button disabled={levels[g]<=0} onClick={()=>dispatch({type:'setAptitudeLevel',key:g,value:levels[g]-1})}>−</button><b>{levels[g]}</b><button disabled={levels[g]>=5||lvlUsed>=lvlMax} onClick={()=>dispatch({type:'setAptitudeLevel',key:g,value:levels[g]+1})}>+</button></div><Tooltip text={aptitudeHelp(g)}/></div>)}</div></div></Panel><Panel title={`Aptidões Amaldiçoadas: ${(c.choices.aptitudes||[]).length} / ${max}`}><p className="muted">Você recebe uma aptidão amaldiçoada sempre que sobe de nível, exceto Restringido. O app bloqueia excesso e sinaliza pré-requisitos detectados no texto.</p>{Object.entries(groups).map(([group,items])=><details key={group} open={group==='Aura'}><summary>{group} · {items.length}</summary><ChoiceCards items={items} selected={c.choices.aptitudes||[]} limit={max} character={c} onChange={arr=>dispatch({type:'choice',key:'aptitudes',value:clampSelection(arr,rules.aptitudes.map(a=>a.id),max)})}/></details>)}</Panel><Panel title="Técnica"><TechniqueEditor c={c} dispatch={dispatch}/></Panel></section> }
function aptitudeHelp(g){ return ({Aura:'Conhecimento e compreensão sobre a própria energia amaldiçoada.', 'Controle e Leitura':'Liberar, controlar e ler fluxos/aura de energia.', Barreira:'Uso e refinamento de técnicas de barreira.', Domínio:'Aptidão em técnicas de domínio e expansão.', 'Energia Reversa':'Proficiência no uso da energia reversa para regeneração e cura.'})[g]||''; }
function ChoiceCards({items,selected,onChange,limit=999,character=null}){ const [q,setQ]=useState(''); const [modal,setModal]=useState(null); const filtered=items.filter(i=>(i.name+' '+(i.originalText||'')).toLowerCase().includes(q.toLowerCase())); return <><Field label="Buscar"><input value={q} onChange={e=>setQ(e.target.value)}/></Field><div className="cards">{filtered.map(i=>{ const checked=selected.includes(i.id); const req=character?aptitudeRequirementStatus(character,i):{ok:true}; const blocked=(!checked && selected.length>=limit)||(!checked&&!req.ok); return <div key={i.id} className={checked?'feature selected':'feature'}><div className="row"><h3>{i.name}</h3><input type="checkbox" checked={checked} disabled={blocked} onChange={e=>onChange(e.target.checked?[...selected,i.id]:selected.filter(x=>x!==i.id))}/><button className="q" onClick={()=>setModal(i)}>?</button></div>{getPrereqText(i)&&<small className={req.ok?'okText':'warn'}>Pré-requisito: {getPrereqText(i)}</small>}<p>{formatRuleText(i.originalText||'').slice(0,420)}</p>{!req.ok&&<small className="warn">Bloqueado: falta {req.problems?.join(', ')}</small>}{!checked&&selected.length>=limit&&<small className="warn">Limite atingido.</small>}</div>})}</div>{modal&&<ModalText title={modal.name} text={formatRuleText(modal.originalText||'')} onClose={()=>setModal(null)}/>}</> }
function TechniqueEditor({c,dispatch}){ return <div className="grid gap"><div className="grid2"><Field label="Nome da Técnica"><input value={c.technique.name} onChange={e=>dispatch({type:'technique',key:'name',value:e.target.value})}/></Field><Field label="Link de imagem/print da técnica"><input placeholder="https://..." value={c.technique.imageUrl||''} onChange={e=>dispatch({type:'technique',key:'imageUrl',value:e.target.value})}/></Field></div>{c.technique.imageUrl&&<img className="techPreview" src={c.technique.imageUrl} alt="Print da técnica"/>}<Field label="Funcionamento Base"><textarea value={c.technique.baseFunction} onChange={e=>dispatch({type:'technique',key:'baseFunction',value:e.target.value})}/></Field><Field label="Link de imagem/print do funcionamento base"><input placeholder="https://..." value={c.technique.baseImageUrl||''} onChange={e=>dispatch({type:'technique',key:'baseImageUrl',value:e.target.value})}/></Field>{c.technique.baseImageUrl&&<img className="techPreview" src={c.technique.baseImageUrl} alt="Print do funcionamento base"/>}<TechList title="Passivas" keyName="passives" list={c.technique.passives} dispatch={dispatch}/><TechList title="Ativas" keyName="actives" list={c.technique.actives} dispatch={dispatch}/><Panel title="Votos e Expansão"><Field label="Expansão de Domínio"><textarea value={c.technique.domain.text} onChange={e=>dispatch({type:'technique',key:'domain',value:{...c.technique.domain,text:e.target.value}})}/></Field></Panel></div> }
function TechList({title,keyName,list,dispatch}){ return <div><h3>{title}: {list.length}</h3><button onClick={()=>dispatch({type:'addTechFeature',key:keyName})}>Adicionar {title}</button><div className="cards">{list.map(f=><div className="feature" key={f.id}><div className="grid3"><Field label="Nome"><input value={f.name} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'name',value:e.target.value})}/></Field><Field label="Grau"><input value={f.grade} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'grade',value:e.target.value})}/></Field><Field label="Custo"><input value={f.cost} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'cost',value:e.target.value})}/></Field></div><div className="grid3"><Field label="Alvo"><input value={f.target||''} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'target',value:e.target.value})}/></Field><Field label="Área"><input value={f.area||''} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'area',value:e.target.value})}/></Field><Field label="Duração"><input value={f.duration||''} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'duration',value:e.target.value})}/></Field></div><textarea value={f.text} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'text',value:e.target.value})}/><button className="danger" onClick={()=>dispatch({type:'removeTechFeature',key:keyName,id:f.id})}>Remover</button></div>)}</div></div> }
function Restricted({c,dispatch}){ if(!c.isRestricted) return <Panel title="Perfil Restrito bloqueado"><p>Esta aba é usada por personagens com origem/caminho restrito. Ative em Criação Guiada para liberar.</p></Panel>; return <section className="grid gap"><Panel title="Aspectos Marciais"><p>Fundamento marcial, passivas, ativas e dádivas são selecionadas aqui. Use o compêndio para consultar o texto completo do capítulo restrito.</p><RuleBox title="Restringido" text={rules.specializations.find(s=>s.id==='restringido')?.originalText}/></Panel><Panel title="Dádivas do Céu"><ChoiceCards items={rules.compendium.filter(e=>e.pageStart>=114&&e.pageEnd<=126).slice(0,20).map(e=>({...e,id:'gift_'+e.id,name:e.name,originalText:e.originalText}))} selected={c.choices.heavenlyGifts} onChange={arr=>dispatch({type:'choice',key:'heavenlyGifts',value:arr})}/></Panel></section> }
function Interlude({c,dispatch}){ const tracks=c.choices.interlude||{}; const max=interludeLimit(c); const spent=Object.values(tracks).reduce((a,b)=>a+Number(b||0),0); const set=(name,val)=>{ const current=tracks[name]||0; const next=val; const delta=next-current; if(delta>0 && spent+delta>max) return; dispatch({type:'choice',key:'interlude',value:{...tracks,[name]:next}}); }; return <Panel title={`Focos de Interlúdio: ${spent} / ${max}`}><div className="notice"><b>Importante:</b> focos de interlúdio não são ganho automático de level up. Eles devem ser concedidos pelo mestre/admin após interlúdios, descanso, treino ou recompensa narrativa.</div><Field label="Focos concedidos pelo mestre/admin (modo local)"><input type="number" min="0" value={c.choices.interludeFocus||0} onChange={e=>dispatch({type:'adminInterludeFocus',value:e.target.value})}/></Field><div className="trackGrid">{rules.interludeTracks.map(t=><div key={t} className="track"><h3>{t}<Tooltip text={`Trilha de ${t}. Compre em ordem: 1ª, 2ª, 3ª, 4ª e Completo. O efeito deve ser consultado no texto completo do interlúdio ou cadastrado pelo admin.`}/></h3>{[1,2,3,4,5].map(n=>{ const checked=(tracks[t]||0)>=n; const blocked=!checked && spent>=max; return <label key={n} className={blocked?'blocked':''}><input type="checkbox" checked={checked} disabled={blocked} onChange={()=>set(t,checked?n-1:n)}/>{n<5?`${n}ª Etapa`:'Completo'}</label>})}</div>)}</div><RuleBox title="Treinamento e Interlúdio" text={rules.compendium.find(e=>e.id==='chapter_dia_a_dia')?.originalText}/></Panel> }
function Summons({c,dispatch}){ return <Panel title="Invocações"><button onClick={()=>dispatch({type:'addSummon'})}>Adicionar invocação</button><div className="summonGrid">{c.summons.map(s=><div className="summon" key={s.id}><Field label="Nome"><input value={s.name} onChange={e=>dispatch({type:'updateSummon',id:s.id,key:'name',value:e.target.value})}/></Field><div className="grid4"><Field label="Grau"><input value={s.grade} onChange={e=>dispatch({type:'updateSummon',id:s.id,key:'grade',value:e.target.value})}/></Field><Field label="Custo"><input type="number" value={s.cost} onChange={e=>dispatch({type:'updateSummon',id:s.id,key:'cost',value:Number(e.target.value)})}/></Field><Field label="PV"><input type="number" value={s.hpCurrent} onChange={e=>dispatch({type:'updateSummon',id:s.id,key:'hpCurrent',value:Number(e.target.value)})}/></Field><Field label="Defesa"><input type="number" value={s.defense} onChange={e=>dispatch({type:'updateSummon',id:s.id,key:'defense',value:Number(e.target.value)})}/></Field></div><button className="danger" onClick={()=>dispatch({type:'removeSummon',id:s.id})}>Remover</button></div>)}</div><RuleBox title="Capítulo de Invocações" text={rules.compendium.find(e=>e.id==='chapter_invocacoes')?.originalText}/></Panel> }
function TechniqueBank({c,state,dispatch}){ return <section className="grid gap"><Panel title="Banco de Técnicas"><p>As técnicas são a parte comunitária/customizável. Cadastre textos, passivas, ativas e expansão. Em produção, o Supabase salva como pendente até aprovação.</p><TechniqueEditor c={c} dispatch={dispatch}/></Panel></section> }
function LevelUp({c,dispatch}){ const [to,setTo]=useState(Math.min(20,c.level+1)); const tasks=levelTasks(c,Number(to)); return <Panel title="Level Up Guiado"><div className="grid3"><Stat label="Nível atual" value={c.level}/><Field label="Novo nível"><input type="number" min={c.level+1} max="20" value={to} onChange={e=>setTo(e.target.value)}/></Field><button className="gold" onClick={()=>dispatch({type:'levelUp',toLevel:to})}>Aplicar Level Up</button></div><div className="taskList">{tasks.map((t,i)=><div key={i} className="bad"><AlertTriangle/><span>{t}</span></div>)}</div><h3>Histórico</h3>{c.levelHistory.map(h=><details key={h.id}><summary>Nível {h.from} → {h.to}</summary>{h.tasks.map(t=><p key={t}>{t}</p>)}</details>)}</Panel> }
function Compendium(){ const [q,setQ]=useState(''); const [type,setType]=useState('all'); const entries=[...rules.compendium,...rules.weapons,...rules.uniforms,...rules.shields,...rules.kits,...rules.specialItems,...rules.aptitudes,...rules.talents,...rules.conditions]; const filtered=entries.filter(e=>(type==='all'||e.type===type)&&((e.name||'')+' '+(e.category||'')+' '+(e.originalText||'')).toLowerCase().includes(q.toLowerCase())).slice(0,200); const [modal,setModal]=useState(null); return <Panel title="Compêndio"><div className="grid2"><Field label="Busca"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="aptidão, arma, condição, regra..."/></Field><Field label="Tipo"><Select value={type} onChange={setType}><option value="all">Todos</option>{[...new Set(entries.map(e=>e.type))].map(t=><option key={t} value={t}>{t}</option>)}</Select></Field></div><div className="compendiumList">{filtered.map(e=><button key={e.id} onClick={()=>setModal(e)}><b>{e.name}</b><span>{e.type} · p. {e.pageStart||'?'}</span><p>{(e.originalText||'').slice(0,220)}</p></button>)}</div>{modal&&<ModalText title={modal.name} text={modal.originalText||''} onClose={()=>setModal(null)}/>}</Panel> }
function Admin({state}){ return <section className="grid gap"><Panel title="Admin / Revisão"><p>Estrutura preparada para Supabase: créditos, aprovação de técnicas comunitárias, revisão de regras extraídas e logs.</p><h3>Logs locais</h3>{state.adminLog.map(l=><div key={l.id} className="logline"><b>{l.type}</b> {l.text}</div>)}</Panel><Panel title="Resumo do banco extraído"><div className="grid4"><Stat label="Armas" value={rules.weapons.length}/><Stat label="Itens especiais" value={rules.specialItems.length}/><Stat label="Aptidões extraídas" value={rules.aptitudes.length}/><Stat label="Entradas no compêndio" value={rules.compendium.length}/></div></Panel></section> }
function downloadState(state){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})); a.download='fm-ficha-backup.json'; a.click(); }
function importFile(e,dispatch){ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ dispatch({type:'exportImport',state:JSON.parse(r.result)});}catch(err){ alert('Arquivo inválido'); } }; r.readAsText(f); }


// =========================
// Overrides v4: anti-burla, classe, equipamentos e leitura
// =========================
function oficioLines(c){
  const raw=(c.choices.skillDetails?.oficios ?? c.choices.skillDetails?.oficio ?? '').toString();
  return raw.split(/\n|,/).map(x=>x.trim()).filter(Boolean);
}
function selectedSkillCount(c){
  const base=(c.choices.skills||[]).filter(id=>id!=='oficio').length;
  return base + ((c.choices.skills||[]).includes('oficio') ? Math.max(1, oficioLines(c).length) : 0);
}
function baseSkillChosenCount(c,cfg){
  let n=(c.choices.skills||[]).filter(id=>id!=='oficio' && cfg.skillBaseAllowed.includes(id)).length;
  if((c.choices.skills||[]).includes('oficio') && cfg.skillBaseAllowed.includes('oficio')) n += Math.max(1, oficioLines(c).length);
  return n;
}
specTrainingConfig = function specTrainingConfig(c){
  const id=c.specializationId;
  const cfg={resAllowed:['astucia','fortitude','integrity','reflexes','will'],resMax:1,resFixed:[], skillAllowed:trainableSkills().map(s=>s.id), skillBaseAllowed:[], skillBaseNeed:0, skillAnyNeed:3, skillForbidden:[], masterMax:c.level>=10?1:0, masteryText:'Treinamentos ainda não definidos.', notes:'Siga as escolhas de treinamento da especialização.'};
  if(id==='lutador') return {...cfg,resAllowed:['fortitude','reflexes'], skillBaseAllowed:['oficio','atletismo','acrobacia'], skillBaseNeed:1, skillAnyNeed:3, masteryText:'Armas Simples, Armas Marciais e Escudo Leve.', notes:'Lutador: 1 entre Ofício/Atletismo/Acrobacia + 3 perícias quaisquer. Resistência: Fortitude ou Reflexos.'};
  if(id==='especialista_combate') return {...cfg,resAllowed:['fortitude','reflexes'], skillBaseAllowed:['oficio','atletismo','acrobacia'], skillBaseNeed:2, skillAnyNeed:3, masteryText:'Todas as armas e escudos.', notes:'Especialista em Combate: 2 entre Ofício/Atletismo/Acrobacia + 3 perícias quaisquer. Resistência: Fortitude ou Reflexos.'};
  if(id==='especialista_tecnica') return {...cfg,resAllowed:['astucia','will'], skillBaseAllowed:['oficio','feiticaria','ocultismo'], skillBaseNeed:2, skillAnyNeed:2, masteryText:'Armas Simples e Armas a Distância.', notes:'Especialista em Técnica: 2 entre Ofício/Feitiçaria/Ocultismo + 2 perícias quaisquer. Resistência: Astúcia ou Vontade.'};
  if(id==='controlador') return {...cfg,resAllowed:['astucia','will'], skillBaseAllowed:['oficio','percepcao','persuasao'], skillBaseNeed:1, skillAnyNeed:2, masteryText:'Armas Simples e Armas a Distância.', notes:'Controlador: 1 entre Ofício/Percepção/Persuasão + 2 perícias quaisquer. Resistência: Astúcia ou Vontade.'};
  if(id==='suporte') return {...cfg,resAllowed:['astucia','will'], skillBaseAllowed:['oficio','medicina','prestigitacao'], skillBaseNeed:2, skillAnyNeed:3, masteryText:'Armas Simples e Escudos.', notes:'Suporte: 2 entre Ofício/Medicina/Prestidigitação + 3 perícias quaisquer. Resistência: Astúcia ou Vontade.'};
  if(id==='restringido') return {...cfg,resAllowed:['fortitude','reflexes'], resMax:2, resFixed:['fortitude','reflexes'], skillBaseAllowed:['oficio'], skillBaseNeed:1, skillAnyNeed:4, skillForbidden:['feiticaria'], masteryText:'Todas as armas e escudos. Fortitude e Reflexos fixos.', notes:'Restringido: Fortitude e Reflexos fixos. 1 perícia de Ofício + 4 perícias quaisquer, exceto Feitiçaria.'};
  return cfg;
}
skillLimit = function skillLimit(c){ const cfg=specTrainingConfig(c); return cfg.skillBaseNeed + cfg.skillAnyNeed + extraSkillSlots(c); }
function hasWeaponMastery(c,item){
  if(!item || item.type!=='weapon') return true;
  const cfg=specTrainingConfig(c), t=(cfg.masteryText||'').toLowerCase();
  if(t.includes('todas as armas')) return true;
  if(t.includes('armas simples') && String(item.category||'').toLowerCase().includes('simples')) return true;
  if(t.includes('armas marciais') && /marcial/i.test(item.properties||'')) return true;
  if(t.includes('armas a distância') && /distância|distancia|ranged|disparo/i.test((item.kind||'')+' '+(item.name||''))) return true;
  return false;
}
function hasShieldMastery(c,item){ if(!item || item.type!=='shield') return true; const t=(specTrainingConfig(c).masteryText||'').toLowerCase(); return t.includes('escudos') || (t.includes('escudo leve') && /leve/i.test(item.name)); }
function freeStarterCount(c){ return c.inventory.items.filter(i=>i.freeStarter).length; }
function applyStarterEquipment(state,currentId,withChar){
  const char=state.characters.find(c=>c.id===currentId); if(!char) return state;
  const existing=new Set(char.inventory.items.filter(i=>i.freeStarter).map(i=>i.id));
  const toAdd=[];
  const uniform=rules.uniforms.find(i=>i.id==='uniform_comum')||rules.uniforms[0]; if(uniform&&!existing.has(uniform.id)) toAdd.push(uniform);
  // Itens gratuitos práticos; as escolhas pagas continuam separadas e NÃO contam estes itens.
  const kit=rules.kits[0]; if(kit&&!existing.has(kit.id)) toAdd.push(kit);
  return {...withChar(c=>({...c, inventory:{...c.inventory, items:[...c.inventory.items,...toAdd.map(i=>({...i,instanceId:uid(),qty:1,freeStarter:true,equipped:i.type==='uniform'}))]}})), adminLog:[...state.adminLog,{id:uid(),type:'sistema',text:`Equipamento gratuito inicial aplicado: ${toAdd.map(i=>i.name).join(', ')||'nenhum novo item'}.`,at:new Date().toISOString()}]};
}
validation = function validation(c){
  const tasks=[]; const add=(id,label,ok,tab,reason)=>tasks.push({id,label,ok,tab,reason});
  const cfg=specTrainingConfig(c);
  const skillAllowed=trainableSkills().map(s=>s.id).filter(id=>!cfg.skillForbidden.includes(id));
  const invalidSkills=(c.choices.skills||[]).filter(id=>!skillAllowed.includes(id));
  const invalidRes=(c.choices.resistances||[]).filter(id=>!cfg.resAllowed.includes(id));
  const skillMax=skillLimit(c), resMax=resistanceLimit(c), talentMax=talentLimit(c), aptMax=aptitudeLimit(c), aptLvlMax=aptitudeLevelPointLimit(c);
  const sCount=selectedSkillCount(c); const baseChosen=baseSkillChosenCount(c,cfg);
  const masterMax=masterSkillLimit(c);
  const invalidMasters=(c.choices.masterSkills||[]).filter(id=>!selectedTrainedSkills(c).includes(id));
  const invalidAptitudes=(c.choices.aptitudes||[]).map(id=>rules.aptitudes.find(a=>a.id===id)).filter(Boolean).filter(a=>!aptitudeRequirementStatus(c,a).ok);
  const unmastered=c.inventory.items.filter(i=>i.equipped && ((i.type==='weapon'&&!hasWeaponMastery(c,i))||(i.type==='shield'&&!hasShieldMastery(c,i))));
  const over=attributeOvercapProblems(c);
  add('rolls','Rolar atributos 4d6 descartando o menor',!!latestRollSet(c),'Criação Guiada','Atributos começam vazios.');
  add('assign','Distribuir os 6 resultados rolados',ATTRS.every(([k])=>c.attributes.assigned[k]),'Criação Guiada','Cada atributo deve receber um resultado.');
  add('attrCap','Respeitar limite de atributo 20',over.length===0,'Criação Guiada',over.length?`Sem mecânica suficiente para: ${over.map(x=>`${x.label} bruto ${x.raw}, limite ${x.cap}`).join('; ')}.`:'Mecânicas reconhecidas: Derivado, Restringido, Incremento de Atributo, Quebra de Limites e acessórios oficiais.');
  if(c.originId==='derivado') add('derivedLimitAttr','Derivado: escolher atributo de Desenvolvimento Inesperado',!!c.choices?.[DERIVADO_LIMIT_ATTR_KEY],'Criação Guiada','Este atributo recebe o aumento de limite da origem.');
  if(c.originId==='restringido') add('restrictedApex','Restringido: Ápice Corporal conforme nível',getSelectedArrayChoice(c,'restringidoApexAttrs').length<=Math.floor(Number(c.level||1)/6),'Criação Guiada','Escolha até 1 atributo físico a cada 6 níveis.');
  add('origin','Escolher Origem',!!c.originId,'Criação Guiada');
  add('originBonus','Resolver bônus da Origem',originBonusResolved(c),'Criação Guiada','Cada Origem tem sua própria regra de bônus; distribua conforme o texto da Origem.');
  add('spec','Escolher Especialização',!!c.specializationId,'Criação Guiada');
  add('cd','Escolher atributo de CD',!!c.cdAttribute,'Criação Guiada');
  add('res',`Escolher resistências permitidas (${(c.choices.resistances||[]).length}/${resMax})`,(c.choices.resistances||[]).length===resMax && invalidRes.length===0,'Criação Guiada', invalidRes.length?`Inválidas: ${invalidRes.map(resistanceName).join(', ')}`:cfg.notes);
  add('skills',`Escolher perícias treinadas (${sCount}/${skillMax})`,sCount===skillMax && invalidSkills.length===0 && baseChosen>=cfg.skillBaseNeed,'Criação Guiada', invalidSkills.length?`Inválidas: ${invalidSkills.map(skillName).join(', ')}`:`Grupo obrigatório: ${baseChosen}/${cfg.skillBaseNeed}. Bônus por INT ou SAB: +${extraSkillSlots(c)}. Ofício pode ter mais de uma especialização.`);
  add('masterSkill',`Perícia mestre (${(c.choices.masterSkills||[]).length}/${masterMax})`,masterMax===0 || ((c.choices.masterSkills||[]).length===masterMax && invalidMasters.length===0),'Criação Guiada','Escolha perícias treinadas para se tornarem Mestre quando o nível/talento liberar.');
  if((c.choices.skills||[]).includes('oficio')) add('oficio-detail','Informar os Ofícios treinados.',selectedOffices(c).length>=1,'Criação Guiada','Selecione os ofícios disponíveis.');
  add('talents',`Talentos dentro do limite (${(c.choices.talents||[]).length}/${talentMax})`,(c.choices.talents||[]).length<=talentMax,'Perfil Mundano','Talentos ficam bloqueados quando o limite é atingido.');
  if(hasTalentByName(c,'Incremento De Atributo')) add('talentIncAttr','Incremento de Atributo: escolher atributo',!!c.choices?.talentIncrementAttr,'Perfil Mundano','O app precisa saber qual atributo recebe +2 e limite +2.');
  if(hasTalentByName(c,'Quebra De Limites')) add('talentBreakAttr','Quebra de Limites: escolher 2 atributos',getSelectedArrayChoice(c,'quebraLimitesAttrs').length===2,'Perfil Mundano','Escolha dois atributos diferentes.');
  if(hasTalentByName(c,'Resiliência Melhorada')) add('talentResAttr','Resiliência Melhorada: escolher atributo do TR',!!c.choices?.resilienciaMelhoradaAttr,'Perfil Mundano','O atributo escolhido recebe +1.');
  add('equip1','Escolher 2 equipamentos iniciais de custo 1 pagos/gratuitos de escolha',(c.inventory.items.filter(i=>Number(i.cost)===1&&!i.freeStarter).length)>=2,'Registro e Inventário','Itens gratuitos da especialização/uniforme inicial não contam neste limite.');
  add('uniform','Equipar uniforme comum/inicial',c.inventory.items.some(i=>i.type==='uniform'),'Registro e Inventário');
  add('kit','Escolher 1 kit de ferramentas',c.inventory.items.some(i=>i.type==='kit'),'Registro e Inventário');
  add('masteryWarn','Usar apenas equipamentos com maestria',unmastered.length===0,'Registro e Inventário',unmastered.length?`Sem maestria: ${unmastered.map(i=>i.name).join(', ')}`:cfg.masteryText);
  add('tech','Escolher/cadastrar Técnica ou ativar Perfil Restrito',c.isRestricted || c.technique.name || c.technique.id,'Perfil Amaldiçoado');
  add('apt',`Aptidões escolhidas (${(c.choices.aptitudes||[]).length}/${aptMax})`,c.isRestricted || ((c.choices.aptitudes||[]).length<=aptMax && invalidAptitudes.length===0),'Perfil Amaldiçoado', invalidAptitudes.length?`Aptidões sem pré-requisito: ${invalidAptitudes.map(a=>a.name).join(', ')}`:'No nível 1 o limite padrão fica 0; uma nova aptidão é recebida sempre que subir de nível.');
  add('aptLevels',`Níveis de Aptidão distribuídos (${aptitudeLevelTotal(c)}/${aptLvlMax})`,c.isRestricted || aptitudeLevelTotal(c)<=aptLvlMax,'Perfil Amaldiçoado','Em todo nível par, aumenta 1 nível de aptidão; nos níveis 10 e 20 aumenta 1 nível adicional. Máximo 5 por aptidão.');
  return tasks;
}
function parseLevelTableFromText(text=''){
  const gains={};
  const lines=String(text).split(/\n/).map(x=>x.trim()).filter(Boolean);
  for(const line of lines){ const m=line.match(/^(\d+)[º°]?\s+(.+)$/); if(m && Number(m[1])>=1 && Number(m[1])<=20){ gains[Number(m[1])]=m[2].trim(); }}
  return gains;
}
levelTasks = function levelTasks(c,to){
  const tasks=[]; const sp=specialization(c); const gains=parseLevelTableFromText(sp?.originalText||'');
  for(let lvl=c.level+1; lvl<=to; lvl++){
    tasks.push(`Nível ${lvl}: adicionar 1 dado de vida da especialização e recalcular PV máximo.`);
    tasks.push(`Nível ${lvl}: recalcular PE/Estamina, Defesa, Atenção, limites de perícia, talentos e aptidões.`);
    if(!c.isRestricted) tasks.push(`Nível ${lvl}: receber 1 Aptidão Amaldiçoada, respeitando pré-requisitos.`);
    if(lvl%4===0) tasks.push(`Nível ${lvl}: distribuir +2 pontos de atributo.`);
    if([5,9,13,17].includes(lvl)) tasks.push(`Nível ${lvl}: bônus de treinamento aumenta para ${trainingBonus(lvl)}.`);
    if(lvl===10) tasks.push('Nível 10: escolher 1 perícia treinada para se tornar Mestre.');
    if(gains[lvl]) tasks.push(`${sp?.name||'Especialização'}, tabela de nível ${lvl}: ${gains[lvl]}.`);
    extractSpecUnlocks(sp?.originalText||'',lvl).forEach(x=>tasks.push(`Texto da especialização: ${x}`));
  }
  tasks.push('Focos/Bônus de Interlúdio não são ganho automático de nível; o mestre/admin deve conceder manualmente.');
  return [...new Set(tasks)];
}
CatalogQuick = function CatalogQuick({dispatch}){ return <div className="notice"><b>Equipamento inicial:</b> use o Registro e Inventário para escolher no catálogo completo. Aqui só aplicamos os itens gratuitos e mostramos as maestrias da Especialização. <button onClick={()=>dispatch({type:'applyStarterEquipment'})}>Aplicar gratuitos iniciais</button><button onClick={()=>dispatch({type:'tab',tab:'Registro e Inventário'})}>Abrir Registro e Inventário</button></div> }
Creation = function Creation({c,state,dispatch,tasks}){ const rs=latestRollSet(c); const sp=specialization(c); const org=origin(c); const cfg=specTrainingConfig(c); const usedRollIds=Object.values(c.attributes.assigned).filter(Boolean); const allowedRes=RESISTANCES.filter(([id])=>cfg.resAllowed.includes(id)); const skillPool=trainableSkills().filter(s=>!cfg.skillForbidden.includes(s.id)); const skillMax=skillLimit(c), resMax=resistanceLimit(c); const sCount=selectedSkillCount(c); const baseChosen=baseSkillChosenCount(c,cfg); return <section className="grid gap"><Panel title="1. Dados básicos"><div className="grid3"><Field label="Nome"><input value={c.name} onChange={e=>dispatch({type:'update',key:'name',value:e.target.value})}/></Field><Field label="Jogador"><input value={c.playerName} onChange={e=>dispatch({type:'update',key:'playerName',value:e.target.value})}/></Field><Field label="Campanha"><input value={c.campaign} onChange={e=>dispatch({type:'update',key:'campaign',value:e.target.value})}/></Field><Field label="Nível"><input type="number" min="1" max="20" value={c.level} onChange={e=>dispatch({type:'update',key:'level',value:Number(e.target.value)})}/></Field><Field label="Grau"><Select value={c.grade} onChange={v=>dispatch({type:'update',key:'grade',value:v})}>{['Quarto','Terceiro','Segundo','Primeiro','Especial'].map(x=><option key={x}>{x}</option>)}</Select></Field></div></Panel>
  <Panel title="2. Atributos por rolagem" help="Role seis resultados. Depois distribua livremente cada resultado entre Força, Destreza, Constituição, Inteligência, Sabedoria e Presença."><button className="gold" onClick={()=>dispatch({type:'roll'})}>{rs?'Rerolar atributos':'Rolar atributos'}</button>{rs&&<><div className="rolls">{rs.rolls.map(r=><span key={r.id}>{r.total}<small>{r.dice.join(', ')} − {r.dropped}</small></span>)}</div><div className="attrAssign">{ATTRS.map(([k,l])=><Field key={k} label={l}><Select value={c.attributes.assigned[k]||''} onChange={v=>dispatch({type:'assignAttr',attr:k,rollId:v})}><option value="">—</option>{rs.rolls.map(r=><option key={r.id} value={r.id} disabled={usedRollIds.includes(r.id)&&c.attributes.assigned[k]!==r.id}>{r.total}</option>)}</Select><b>{finalAttr(c,k)??'—'} / {signed(mod(finalAttr(c,k)))}</b><Tooltip text={ATTRIBUTE_HELP[k]}/></Field>)}</div></>}</Panel>
  <Panel title="3. Origem"><div className="grid2"><Field label="Origem"><Select value={c.originId} onChange={v=>dispatch({type:'patch',patch:{originId:v,isRestricted:v==='restringido'||v==='sem_energia'}})}><option value="">Escolha</option>{rules.origins.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>{org&&<RuleBox title={org.name} text={org.originalText}/>}</div><h3>Bônus de Origem</h3>{[2,1].map((b,i)=><Field key={i} label={`+${b} em atributo`}><Select value={c.choices.originBonuses?.[`b${b}`]||''} onChange={v=>dispatch({type:'originBonus',bonusKey:`b${b}`,attr:v,value:b})}><option value="">—</option>{ATTRS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select></Field>)}</Panel>
  <Panel title="4. Especialização e escolhas principais"><div className="grid3"><Field label="Especialização"><Select value={c.specializationId} onChange={v=>dispatch({type:'update',key:'specializationId',value:v})}><option value="">Escolha</option>{rules.specializations.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field><Field label="Atributo de CD"><Select value={c.cdAttribute} onChange={v=>dispatch({type:'update',key:'cdAttribute',value:v})}><option value="">—</option>{ATTRS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select></Field><Field label="Atributo de Energia"><Select value={c.energyAttribute} onChange={v=>dispatch({type:'update',key:'energyAttribute',value:v})}><option value="">—</option>{ATTRS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select></Field></div>{sp&&<RuleBox title={sp.name} text={sp.originalText}/>}<div className="notice"><b>Treinamentos/Maestrias:</b> {cfg.masteryText}</div><LimitedChoiceGrid title={`Resistências (${(c.choices.resistances||[]).length}/${resMax})`} items={allowedRes.map(([id,name])=>({id,name,originalText:RESISTANCE_HELP[id]}))} selected={c.choices.resistances||[]} limit={resMax} onChange={arr=>dispatch({type:'choice',key:'resistances',value:clampSelection(arr,cfg.resAllowed,resMax)})}/><div className="notice"><b>Perícias treinadas:</b> {sCount}/{skillMax}. Grupo obrigatório da especialização: {baseChosen}/{cfg.skillBaseNeed}. Extras por INT ou SAB: +{extraSkillSlots(c)}. Ofício pode ter mais de uma especialização.</div><LimitedChoiceGrid title="Perícias que podem ser treinadas" items={skillPool.map(s=>({...s, originalText:SKILL_HELP[s.id]}))} selected={c.choices.skills||[]} limit={999} onChange={arr=>dispatch({type:'choice',key:'skills',value:arr.filter(id=>skillPool.map(s=>s.id).includes(id))})}/>{(c.choices.skills||[]).includes('oficio')&&<Field label="Especializações de Ofício treinadas — uma por linha"><textarea value={c.choices.skillDetails?.oficios || c.choices.skillDetails?.oficio || ''} onChange={e=>dispatch({type:'skillDetail',skillId:'oficios',value:e.target.value})} placeholder={'Ferreiro\nAlfaiate\nCanalizador'}/></Field>}{masterSkillLimit(c)>0&&<LimitedChoiceGrid title={`Perícias Mestre (${(c.choices.masterSkills||[]).length}/${masterSkillLimit(c)})`} items={trainableSkills().filter(s=>selectedTrainedSkills(c).includes(s.id))} selected={c.choices.masterSkills||[]} limit={masterSkillLimit(c)} onChange={arr=>dispatch({type:'choice',key:'masterSkills',value:arr.slice(0,masterSkillLimit(c))})}/>}</Panel>
  <Panel title="5. Equipamento inicial"><CatalogQuick dispatch={dispatch}/><p className="muted">Itens gratuitos aplicados pela especialização/uniforme inicial ficam marcados como “Grátis” e não contam nos 2 equipamentos de custo 1 escolhidos.</p></Panel>
  <Panel title="Pendências"><TaskList tasks={tasks}/></Panel></section> }
function featureCardsFromSpec(sp){
  if(!sp?.originalText) return [];
  const t=sp.originalText.replace(/\r/g,'');
  const start=t.search(/HABILIDADES DO|HABILIDADES DE|No primeiro nível|No 1º nível/i);
  const chunk=(start>=0?t.slice(start):t).split(/(?=\n[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s\-]{5,}\n)/g);
  return chunk.map(x=>x.trim()).filter(x=>x.length>80).slice(0,30).map((x,i)=>{ const lines=x.split('\n').map(y=>y.trim()).filter(Boolean); const title=(lines[0]||`Habilidade ${i+1}`).slice(0,80); return {id:`${sp.id}_feature_${i}`, name:title, originalText:x}; });
}
FeatureCard = function FeatureCard({title,text}){ const [open,setOpen]=useState(false); const formatted=formatRuleText(text||''); return <div className="feature readable"><h3>{title}</h3><div className="textPreview">{formatted.slice(0,700)}{formatted.length>700?'...':''}</div><button onClick={()=>setOpen(true)}>Consultar texto completo</button>{open&&<ModalText title={title} text={formatted} onClose={()=>setOpen(false)}/>}</div> }
Mundane = function Mundane({c,dispatch}){ const sp=specialization(c), org=origin(c); const tMax=talentLimit(c); const selected=c.choices.talents||[]; const cfg=specTrainingConfig(c); const features=featureCardsFromSpec(sp); return <section className="grid gap"><Panel title="Perfil Mundano"><div className="grid3"><Stat label="Especialização" value={sp?.name||'—'}/><Stat label="Origem" value={org?.name||'—'}/><Stat label="Exaustão" value={c.mundaneProfile?.exhaustionLevel||0}/></div><div className="notice"><b>Maestrias/Treinamentos:</b> {cfg.masteryText}</div></Panel><Panel title="Habilidades automáticas de Origem"><div className="cards">{org&&<FeatureCard title={org.name} text={org.originalText}/>}</div></Panel><Panel title={`Habilidades de Classe — ${sp?.name||'Especialização não escolhida'}`}><p className="muted">Aqui ficam as habilidades reais da especialização extraídas do capítulo. Use o texto completo para consultar pré-requisitos e efeitos.</p><div className="cards classFeatures">{features.length?features.map(f=><FeatureCard key={f.id} title={f.name} text={f.originalText}/>):<p>Escolha uma especialização para carregar as habilidades.</p>}</div>{sp&&<details open><summary>Tabela/desbloqueios detectados da especialização</summary><ul>{detectSpecMilestones(sp.originalText).map((x,i)=><li key={i}>{x}</li>)}</ul></details>}</Panel><TalentMechanicsPanel c={c} dispatch={dispatch}/><Panel title={`Talentos e escolhas de level up: ${selected.length}/${tMax}`}><p className="muted">Todo level up exige escolher 1 habilidade de Especialização OU 1 talento. Talentos só ficam marcáveis dentro do limite atual; use “?” para ler o texto completo e requisitos.</p><LimitedChoiceGrid title="Talentos disponíveis" items={rules.talents} selected={selected} limit={tMax} onChange={arr=>dispatch({type:'choice',key:'talents',value:clampSelection(arr,rules.talents.map(t=>t.id),tMax)})}/></Panel></section> }
WeaponCard = function WeaponCard({item,dispatch,compact,character}){ const [open,setOpen]=useState(false); const isShield=item.type==='shield'; const isUniform=item.type==='uniform'; const warn=character && item.equipped && ((item.type==='weapon'&&!hasWeaponMastery(character,item))||(item.type==='shield'&&!hasShieldMastery(character,item))); return <div className={`equipCard sheetCard ${warn?'invalid':''}`}><div className="equipTitle"><b>{item.name}</b><span>{item.freeStarter?'Grátis':item.type}</span></div>{warn&&<div className="bad small"><AlertTriangle size={14}/> Sem maestria pela especialização atual.</div>}<div className="equipGrid"><span>Grau Am.</span><b>{item.grade||'-'}</b><span>{isUniform?'Defesa':isShield?'Dano/RD':'Dano'}</span><b>{isUniform?item.defenseBonus:isShield?`${item.damage||'-'} / RD ${item.rd||0}`:item.damage}</b><span>Grupo/Tipo</span><b>{item.group||item.category||item.kind||'-'}</b><span>Crítico/Ônus</span><b>{item.critical||item.penalty||'-'}</b><span>Alcance</span><b>{item.range||item.kind||'-'}</b><span>Custo/Espaço</span><b>C{item.cost??0} / E{item.spaces??0}</b></div>{!compact&&<><h4>Características / Propriedades</h4><p>{Array.isArray(item.properties)?item.properties.join(', '):(item.properties||item.originalText?.slice(0,220)||'—')}</p><h4>Habilidade Especial</h4><p>{item.specialText||'—'}</p><h4>Característica Especial / Encantamentos</h4><p>{item.customNotes||'—'}</p><div className="row"><button onClick={()=>dispatch({type:'equipItem',instanceId:item.instanceId,singleType:isUniform?'uniform':null})}>{item.equipped?'Desequipar':'Equipar'}</button><button className="danger" onClick={()=>dispatch({type:'removeItem',instanceId:item.instanceId})}><Trash2 size={16}/>Remover</button><button onClick={()=>setOpen(true)}>Ver descrição</button></div></>}{open&&<ModalText title={item.name} text={formatRuleText(item.originalText||'Sem descrição cadastrada.')} onClose={()=>setOpen(false)}/>}</div> }
Inventory = function Inventory({c,dispatch}){ const [filter,setFilter]=useState(''); const catalog=allCatalog().filter(i=>(i.name+' '+i.type+' '+(i.category||'')).toLowerCase().includes(filter.toLowerCase())); return <section className="grid gap"><Panel title={`Inventário — ${inventorySpaces(c)} / ${inventoryMax(c)} espaços`}><div className="notice"><b>Maestrias atuais:</b> {specTrainingConfig(c).masteryText}</div><div className="grid2"><Field label="Dinheiro atual"><input type="number" value={c.inventory.money} onChange={e=>dispatch({type:'inventory',key:'money',value:Number(e.target.value)})}/></Field><Field label="Espaços extras"><input type="number" value={c.inventory.extraSpaces} onChange={e=>dispatch({type:'inventory',key:'extraSpaces',value:Number(e.target.value)})}/></Field></div><Field label="Buscar no catálogo completo"><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="arma, uniforme, escudo, kit, acessório..."/></Field><div className="catalogGroups"><CatalogGroup title="Armas" items={catalog.filter(i=>i.type==='weapon')} dispatch={dispatch}/><CatalogGroup title="Uniformes" items={catalog.filter(i=>i.type==='uniform')} dispatch={dispatch}/><CatalogGroup title="Escudos" items={catalog.filter(i=>i.type==='shield')} dispatch={dispatch}/><CatalogGroup title="Kits" items={catalog.filter(i=>i.type==='kit')} dispatch={dispatch}/><CatalogGroup title="Itens Especiais / Acessórios" items={catalog.filter(i=>i.type==='special')} dispatch={dispatch}/></div></Panel><Panel title="Itens carregados e cards de equipamento"><p className="muted">Itens marcados como Grátis não contam no limite de 2 equipamentos iniciais de custo 1.</p><div className="cards equipmentCards">{c.inventory.items.map(i=><WeaponCard key={i.instanceId} item={i} dispatch={dispatch} character={c}/>)}</div></Panel><Panel title="Anotações"><textarea value={c.inventory.notes} onChange={e=>dispatch({type:'inventory',key:'notes',value:e.target.value})}/></Panel></section> }
function actionTextFor(a){ const raw=a.originalText||''; const names=rules.combatActions.map(x=>String(x.name).toUpperCase()); const target=String(a.name).toUpperCase(); const idx=raw.toUpperCase().indexOf(target); if(idx<0) return raw; let end=raw.length; for(const n of names){ if(n===target) continue; const j=raw.toUpperCase().indexOf(n, idx+target.length); if(j>idx && j<end) end=j; } return raw.slice(idx, Math.min(end, idx+1800)).trim(); }
function ActionCard({a}){ const [open,setOpen]=useState(false); const txt=formatRuleText(actionTextFor(a)); return <div className="actionCard"><h3>{a.name}</h3><div className="textPreview actionText">{txt.slice(0,450)}{txt.length>450?'...':''}</div><button onClick={()=>setOpen(true)}>Ver ação completa</button>{open&&<ModalText title={a.name} text={txt} onClose={()=>setOpen(false)}/>}</div> }
CombatSheet = function CombatSheet({c,dispatch,stats}){ const [dmg,setDmg]=useState(''); const [heal,setHeal]=useState(''); const [pe,setPe]=useState(''); const equipped=c.inventory.items.filter(i=>i.equipped); return <section className="grid gap"><Panel title="Ficha / Combate"><div className="heroGrid"><div><h2>{c.name||'Personagem sem nome'}</h2><p>{origin(c)?.name||'Origem não escolhida'} · {specialization(c)?.name||'Especialização não escolhida'} · Nível {c.level}</p></div><Stat label="Defesa" value={stats.defense} icon={<Shield/>}/><Stat label="Atenção" value={stats.attention} icon={<Eye/>}/><Stat label="Movimento" value={`${stats.movement}m`} icon={<Swords/>}/></div><div className="resources"><Resource label="PV" current={c.combat.hpCurrent??stats.hpMax} max={stats.hpMax} temp={c.combat.hpTemp}/><Resource label="PE/Estamina" current={c.combat.peCurrent??stats.peMax} max={stats.peMax} temp={c.combat.peTemp}/><Resource label="Alma" current={c.combat.soulCurrent??stats.soulMax} max={stats.soulMax} temp={0}/></div><div className="grid3"><Field label="Dano recebido"><input value={dmg} onChange={e=>setDmg(e.target.value)} /><button onClick={()=>{dispatch({type:'applyDamage',value:dmg});setDmg('')}}>Aplicar dano</button></Field><Field label="Cura recebida"><input value={heal} onChange={e=>setHeal(e.target.value)} /><button onClick={()=>{dispatch({type:'applyHeal',value:heal});setHeal('')}}>Aplicar cura</button></Field><Field label="Gasto de PE"><input value={pe} onChange={e=>setPe(e.target.value)} /><button onClick={()=>{dispatch({type:'spendPE',value:pe});setPe('')}}>Gastar</button></Field></div></Panel><Panel title="Ações rápidas e ataques"><div className="cards">{equipped.filter(i=>i.type==='weapon'||i.type==='shield').map(i=><WeaponCard key={i.instanceId} item={i} compact character={c}/>)}{equipped.length===0&&<p>Nenhum equipamento equipado.</p>}</div><div className="actionList improved">{rules.combatActions.map(a=><ActionCard key={a.id} a={a}/>)}</div></Panel><Panel title="Condições"><div className="conditionGrid">{rules.conditions.map(cond=><label key={cond.id} className={c.combat.conditions.includes(cond.id)?'condition active':'condition'}><input type="checkbox" checked={c.combat.conditions.includes(cond.id)} onChange={()=>dispatch({type:'toggleCondition',id:cond.id})}/><b>{cond.name}</b><Tooltip text={cond.originalText}/></label>)}</div></Panel><Panel title="Log de sessão"><div className="log">{c.combat.log.map(l=><div key={l.id}><span>{new Date(l.at).toLocaleTimeString()}</span>{l.label}</div>)}</div></Panel></section> }
TechList = function TechList({title,keyName,list,dispatch}){ return <div><h3>{title}: {list.length}</h3><button onClick={()=>dispatch({type:'addTechFeature',key:keyName})}>Adicionar {title}</button><div className="cards">{list.map(f=><div className="feature" key={f.id}><div className="grid3"><Field label="Nome"><input value={f.name} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'name',value:e.target.value})}/></Field><Field label="Grau"><input value={f.grade} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'grade',value:e.target.value})}/></Field><Field label="Custo"><input value={f.cost} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'cost',value:e.target.value})}/></Field></div><div className="grid3"><Field label="Alvo"><input value={f.target||''} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'target',value:e.target.value})}/></Field><Field label="Área"><input value={f.area||''} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'area',value:e.target.value})}/></Field><Field label="Duração"><input value={f.duration||''} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'duration',value:e.target.value})}/></Field></div><Field label="Link de imagem/print da habilidade"><input placeholder="https://..." value={f.imageUrl||''} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'imageUrl',value:e.target.value})}/></Field>{f.imageUrl&&<img className="techPreview" src={f.imageUrl} alt="Print da habilidade"/>}<textarea value={f.text} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'text',value:e.target.value})}/><button className="danger" onClick={()=>dispatch({type:'removeTechFeature',key:keyName,id:f.id})}>Remover</button></div>)}</div></div> }



// =====================================================
// UX rebuild v4.3 — atributos compactos e habilidades de classe selecionáveis
// =====================================================
function getSpecChapterBlocks(sp){
  const raw=String(sp?.originalText||'').replace(/\r/g,'');
  if(!raw.trim()) return [];
  const lines=raw.split('\n').map(x=>x.trim()).filter(Boolean);
  const blocks=[];
  let current=null;
  const titleRx=/^(HABILIDADES|HABILIDADE|NÍVEL|NIVEL|No\s+\d|No\s+primeiro|No\s+1|Corpo|Empolgação|Reflexo|Implemento|Gosto|Teste|Lutador|Domínio|Conhecimento|Conjuração|Arrastado|Feitiço|Fluxo|Poder|Técnica|Treinamento|Especialista|Controlador|Suporte|Restringido)/i;
  for(const line of lines){
    const isTitle = (line.length<95 && titleRx.test(line)) || /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s\-–:º°]{6,}$/.test(line);
    if(isTitle){
      if(current) blocks.push(current);
      current={title:line.replace(/[:.]+$/,''), body:[]};
    } else if(current){
      current.body.push(line);
    }
  }
  if(current) blocks.push(current);
  return blocks.filter(b=>(b.body.join(' ').length>30 || /HABILIDADES|NÍVEL|GANHOS/i.test(b.title)));
}

function cleanRuleTextForDisplay(text=''){
  return String(text||'')
    .replace(/\r/g,'')
    .replace(/[ \t]+\n/g,'\n')
    .replace(/\n{4,}/g,'\n\n\n')
    .trim();
}
function isLikelyAbilityTitle(line){
  const t=String(line||'').trim();
  if(!t || t.length<3 || t.length>70) return false;
  if(/^\d+$/.test(t)) return false;
  if(/^HABILIDADES|^TABELA|^NÍVEL|^GANHOS|^CARACTERÍSTICAS|^PONTOS|^TREINAMENTOS|^ATRIBUTOS|^REQUISITOS|^No \d|^Nos níveis|^Ao invés/i.test(t)) return false;
  const letters=t.replace(/[^A-Za-zÀ-ÿ]/g,'');
  if(letters.length<3) return false;
  const upper=letters.replace(/[a-zà-ÿ]/g,'').length;
  return upper/letters.length>.78;
}
function splitAbilityBlocks(sectionText, fallbackLevel, spId){
  const lines=String(sectionText||'').split('\n').map(x=>x.trim()).filter(Boolean);
  const blocks=[]; let current=null;
  for(const line of lines){
    if(isLikelyAbilityTitle(line)){
      if(current && current.text.length>20) blocks.push(current);
      current={title:line, text:line+'\n'};
    } else if(current){
      current.text += line+'\n';
    }
  }
  if(current && current.text.length>20) blocks.push(current);
  return blocks.map((b,i)=>({
    id:`${spId||'sp'}_lvl_${fallbackLevel}_${i}_${slugify(b.title)}`,
    title:toTitleCaseSmart(b.title),
    level:fallbackLevel,
    text:cleanRuleTextForDisplay(b.text)
  }));
}
function slugify(x){return String(x||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40)}
function toTitleCaseSmart(x){
  return String(x||'').toLowerCase().replace(/(^|\s|[-–—])([a-zà-ÿ])/g,(m,p,c)=>p+c.toUpperCase());
}
function parseClassFeaturesByLevel(sp){
  const text=cleanRuleTextForDisplay(sp?.originalText||'');
  if(!text) return {base:[], choicesByLevel:[], tables:[]};
  const baseStart=text.search(/HABILIDADES BASE DE/i);
  const choicesStart=text.search(/HABILIDADES DO/i);
  const baseText=baseStart>=0 ? text.slice(baseStart, choicesStart>baseStart?choicesStart:undefined) : '';
  const base=[];
  if(baseText){
    const firstLine=(baseText.match(/HABILIDADES BASE DE[^\n]*/i)||[`Base de ${sp.name}`])[0];
    base.push({id:`${sp.id}_base_all`, title:toTitleCaseSmart(firstLine), level:1, text:baseText});
  }
  const choicesText=choicesStart>=0 ? text.slice(choicesStart) : '';
  const re=/HABILIDADES DE\s+(\d+)[°º]?\s*N[ÍI]VEL/gi;
  const matches=[...choicesText.matchAll(re)];
  const choicesByLevel=[];
  for(let i=0;i<matches.length;i++){
    const level=Number(matches[i][1]);
    const sectionStart=matches[i].index+matches[i][0].length;
    const sectionEnd=i+1<matches.length?matches[i+1].index:choicesText.length;
    const raw=choicesText.slice(sectionStart, sectionEnd);
    const abilities=splitAbilityBlocks(raw, level, sp.id);
    if(abilities.length){
      choicesByLevel.push({level, title:`Habilidades de ${level}º nível`, abilities});
    }
  }
  const tables=[];
  const tableMatches=[...text.matchAll(/TABELA[^\n]+|NÍVEL\s+GANHOS DO NÍVEL/gi)];
  if(tableMatches.length){
    tables.push({id:`${sp.id}_table_0`,title:'Tabela de ganhos por nível',text:text.slice(Math.max(0,tableMatches[0].index-80), Math.min(text.length, tableMatches[0].index+2600))});
  }
  return {base, choicesByLevel, tables};
}
function splitClassFeatures(sp){
  const parsed=parseClassFeaturesByLevel(sp);
  const choice=parsed.choicesByLevel.flatMap(g=>g.abilities);
  return {base:parsed.base, choice, choicesByLevel:parsed.choicesByLevel, tables:parsed.tables};
}
function levelAllowedForClassFeature(c, feature){ return Number(c?.level||1) >= Number(feature?.level||99); }
function classFeatureChoiceLimit(c){ return Math.max(0, Number(c.level||1)-1); }
function classFeatureLimit(c){ return Math.max(0, Number(c.level||1)-1); }
function ClassFeatureChoiceCard({feature,selected,blocked,lockedReason,onToggle}){
  const [open,setOpen]=useState(false);
  const txt=formatRuleText(feature.text||'');
  return <div className={`selectCard classAbilityCard ${selected?'selected':''} ${blocked?'blocked':''}`}>
    <div className="selectCardHead"><h3>{feature.title}</h3>{feature.level&&<span className="pill">Nível {feature.level}</span>}</div>
    <label className="choiceLine"><input type="checkbox" checked={selected} disabled={blocked && !selected} onChange={onToggle}/><b>{selected?'Selecionado':'Selecionar'}</b></label>
    <div className="selectPreview readableText">{txt.slice(0,620)}{txt.length>620?'...':''}</div>
    <button onClick={()=>setOpen(true)}>Ler texto completo</button>
    {blocked&&!selected&&<small className="warn">{lockedReason||'Limite atingido'}</small>}
    {open&&<ModalText title={feature.title} text={txt} onClose={()=>setOpen(false)}/>} 
  </div>
}


function ClassLevelGroup({group,c,selected,limit,dispatch}){
  const [open,setOpen]=useState(Number(c?.level||1) >= Number(group?.level||99));
  const selectedList = Array.isArray(selected) ? selected : [];
  const currentLevel = Number(c?.level||1);
  const level = Number(group?.level||99);
  const available = currentLevel >= level;
  const abilities = Array.isArray(group?.abilities) ? group.abilities : [];
  const toggleFeature = (id)=>{
    const next = toggleArrayValue(selectedList, id);
    dispatch({type:'choice', key:'mundaneFeatures', value: next.slice(0, limit)});
  };
  return <details className="collapseBox classLevelGroup" open={open} onToggle={e=>setOpen(e.currentTarget.open)}>
    <summary>
      <span>{group?.title || `Habilidades de ${level}º nível`}</span>
      <span className={available?'pill':'pill mutedPill'}>{available?'Liberado':`Bloqueado até nível ${level}`}</span>
    </summary>
    <div className="choiceCardGrid classChoiceGrid">
      {abilities.map(feature=>{
        const isSelected = selectedList.includes(feature.id);
        const overLimit = selectedList.length >= limit && !isSelected;
        const blocked = !available || overLimit;
        const lockedReason = !available ? `Disponível a partir do nível ${level}.` : 'Limite de escolhas atingido.';
        return <ClassFeatureChoiceCard
          key={feature.id}
          feature={feature}
          selected={isSelected}
          blocked={blocked}
          lockedReason={lockedReason}
          onToggle={()=>toggleFeature(feature.id)}
        />;
      })}
    </div>
  </details>;
}

function ClassFeatureReadOnly({feature}){
  const [open,setOpen]=useState(false);
  const txt=formatRuleText(feature.text||'');
  return <div className="selectCard readonly"><div className="selectCardHead"><h3>{feature.title}</h3><span className="pill">Automática</span></div><div className="selectPreview">{txt.slice(0,520)}{txt.length>520?'...':''}</div><button onClick={()=>setOpen(true)}>Ler texto completo</button>{open&&<ModalText title={feature.title} text={txt} onClose={()=>setOpen(false)}/>}</div>
}

function TaskList({tasks=[]}){
  const list = Array.isArray(tasks) ? tasks : [];
  if(!list.length){
    return <div className="taskList"><div className="good"><CheckCircle2 size={16}/><span>Nenhuma pendência encontrada.</span></div></div>;
  }
  return <div className="taskList">{list.map((t,i)=>{
    const ok = t?.ok === true || t?.status === 'complete' || t?.complete === true;
    const label = t?.label || t?.title || String(t || 'Pendência');
    const detail = t?.reason || t?.detail || t?.message || '';
    return <div key={t?.id || i} className={ok ? 'good' : 'bad'}>
      {ok ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>}
      <span><b>{label}</b>{detail ? <small>{detail}</small> : null}</span>
    </div>;
  })}</div>;
}


// =====================================================
// v4.5 — escolhas sem digitação, menus retráteis e pontos de atributo por nível
// =====================================================
const OFFICE_OPTIONS = (()=>{
  const fromKits = (rules.kits||[]).map(k=>String(k.name||'').replace(/^Ferramentas de\s+/i,'').trim()).filter(Boolean);
  return [...new Set([...fromKits,'Investigador','Médico','Artesão','Outro aprovado pelo mestre'])];
})();
function selectedOffices(c){
  const raw = c.choices?.skillDetails?.oficios ?? c.choices?.skillDetails?.oficio ?? [];
  if(Array.isArray(raw)) return raw;
  return String(raw||'').split(/\n|,|;/).map(x=>x.trim()).filter(Boolean);
}
function toggleArrayValue(arr,value){
  const set=new Set(Array.isArray(arr)?arr:[]);
  set.has(value)?set.delete(value):set.add(value);
  return [...set];
}
function OfficeSelector({c,dispatch}){
  const selected=selectedOffices(c);
  return <div className="choiceBlock officeSelector"><h3>Ofícios treinados</h3><p className="muted">Selecione os Ofícios concedidos pela classe, origem, talento ou escolha livre. Não digite manualmente.</p><div className="chipGrid">{OFFICE_OPTIONS.map(opt=><label key={opt} className={selected.includes(opt)?'chipCheck active':'chipCheck'}><input type="checkbox" checked={selected.includes(opt)} onChange={()=>dispatch({type:'skillDetail',skillId:'oficios',value:toggleArrayValue(selected,opt)})}/>{opt}</label>)}</div></div>
}
function attributeIncreaseMap(c){ return c.choices?.attributeIncreases || {}; }
function spentAttributeIncreasePoints(c){ return Object.values(attributeIncreaseMap(c)).reduce((a,b)=>a+Number(b||0),0); }
function totalAttributeIncreaseEntitlement(c){ return Math.floor(Number(c.level||1)/4)*2; }
function pendingAttributeIncreasePoints(c){ return Math.max(0,totalAttributeIncreaseEntitlement(c)-spentAttributeIncreasePoints(c)); }
function AttributeIncreaseManager({c,dispatch}){
  const total=totalAttributeIncreaseEntitlement(c), spent=spentAttributeIncreasePoints(c), pending=pendingAttributeIncreasePoints(c);
  return <Panel title={`Pontos de atributo por nível: ${spent}/${total}`}><p className="muted">A cada 4 níveis, o personagem recebe +2 pontos de atributo. O app não permite investir em atributo que já passaria do limite atual.</p><AttributeCapNotice c={c}/>{total===0?<div className="notice">Nenhum ponto de atributo por nível liberado ainda. O primeiro ganho ocorre no nível 4.</div>:<><div className={pending>0?'notice warnNotice':'notice'}><b>{pending>0?`Faltam distribuir ${pending} ponto(s).`:'Todos os pontos de atributo por nível foram distribuídos.'}</b></div><div className="attrIncreaseGrid">{ATTRS.map(([k,label])=>{ const current=Number(attributeIncreaseMap(c)[k]||0); const canAdd=pending>0 && canAddAttributeIncrease(c,k); const raw=rawFinalAttr(c,k); const cap=attributeCap(c,k); return <div key={k} className={raw>cap?'attrIncCard warnCard':'attrIncCard'}><b>{label}</b><strong>+{current}</strong><small>{raw??'—'} / limite {cap}</small><div className="row"><button disabled={current<=0} onClick={()=>dispatch({type:'choiceObject',key:'attributeIncreases',id:k,value:Math.max(0,current-1)})}>−</button><button disabled={!canAdd} onClick={()=>dispatch({type:'choiceObject',key:'attributeIncreases',id:k,value:current+1})}>+</button></div><small className="muted">{attributeCapReason(c,k)}</small></div>})}</div></>}</Panel>
}
function optionNamesFromFeatureText(text=''){
  const lines=String(text||'').split('\n').map(x=>x.trim()).filter(Boolean);
  const opts=[];
  for(const line of lines){
    let m=line.match(/^[-•]\s*([^:.]{3,60})[:.]/);
    if(!m) m=line.match(/^([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-Za-zÀ-ÿ\s]{3,60})[:.]/);
    if(m){
      const v=m[1].replace(/\s+/g,' ').trim();
      if(!/^HABILIDADES|^CARACTER|^PONTOS|^NÍVEL|^No\s/i.test(v) && !opts.includes(v)) opts.push(v);
    }
  }
  return opts.slice(0,12);
}
function ClassBaseCard({feature,c,dispatch}){
  const [open,setOpen]=useState(false);
  const txt=formatRuleText(feature.text||'');
  const needsChoice=/escolh|escolha|escolher|opção/i.test(txt);
  const options=optionNamesFromFeatureText(feature.text||'');
  const value=c.choices?.baseFeatureChoices?.[feature.id]||[];
  const selected=Array.isArray(value)?value:(value?[value]:[]);
  return <div className="selectCard readonly baseChoiceCard">
    <div className="selectCardHead"><h3>{feature.title}</h3><span className="pill">Automática</span></div>
    <div className="selectPreview readableText">{txt.slice(0,780)}{txt.length>780?'...':''}</div>
    {needsChoice&&<div className="choiceBlock"><h4>Escolha exigida por esta habilidade</h4>{options.length?<div className="chipGrid">{options.map(opt=><label key={opt} className={selected.includes(opt)?'chipCheck active':'chipCheck'}><input type="checkbox" checked={selected.includes(opt)} onChange={()=>dispatch({type:'choiceObject',key:'baseFeatureChoices',id:feature.id,value:toggleArrayValue(selected,opt)})}/>{opt}</label>)}</div>:<div className="notice">Não foi possível detectar uma lista fechada de opções no texto extraído. Revise no texto completo e selecione a opção no compêndio/admin quando o banco for revisado.</div>}</div>}
    <button onClick={()=>setOpen(true)}>Ler texto completo</button>
    {open&&<ModalText title={feature.title} text={txt} onClose={()=>setOpen(false)}/>} 
  </div>
}
function AttributeRollPanel({c,dispatch}){
  const rs=latestRollSet(c); const usedRollIds=Object.values(c.attributes.assigned).filter(Boolean);
  return <Panel title="2. Atributos por rolagem" help="Role seis resultados e distribua. Limite padrão: 20; Derivado, Restringido, talentos e acessórios podem aumentar esse limite."><button className="gold" onClick={()=>dispatch({type:'roll'})}>{rs?'Rerolar atributos':'Rolar atributos'}</button>{rs&&<><div className="rolls compactRolls">{rs.rolls.map(r=><span key={r.id} className={usedRollIds.includes(r.id)?'used':''}>{r.total}<small>{r.dice.join(', ')} − {r.dropped}</small></span>)}</div><AttributeCapNotice c={c}/><div className="attrGrid improvedAttrs compactAttrs">{ATTRS.map(([k,label,abbr])=>{ const val=finalAttr(c,k); const raw=rawFinalAttr(c,k); const cap=attributeCap(c,k); return <div className={raw>cap?'attrCard warnCard':'attrCard'} key={k}><h3>{label}<Tooltip text={ATTRIBUTE_HELP[k]}/></h3><select value={c.attributes.assigned[k]||''} onChange={e=>dispatch({type:'assignAttr',attr:k,rollId:e.target.value})}><option value="">—</option>{rs.rolls.map(r=><option key={r.id} value={r.id} disabled={usedRollIds.includes(r.id)&&c.attributes.assigned[k]!==r.id}>{r.total}</option>)}</select><div className="attrResult"><b>{val??'—'}</b><strong>{signed(mod(val))}</strong><small>{abbr}</small></div><small className="muted">Bruto {raw??'—'} · limite {cap}</small><small className="muted">Origem +{originBonusValue(c,k)} · Nível +{Number(attributeIncreaseMap(c)[k]||0)} · Item +{attributeItemBonus(c,k)}</small></div>})}</div></>}</Panel>
}
Creation = function Creation({c,state,dispatch,tasks}){
  const sp=specialization(c); const org=origin(c); const cfg=specTrainingConfig(c);
  const allowedRes=RESISTANCES.filter(([id])=>cfg.resAllowed.includes(id));
  const skillPool=trainableSkills().filter(s=>!cfg.skillForbidden.includes(s.id));
  const skillMax=skillLimit(c), resMax=resistanceLimit(c); const sCount=selectedSkillCount(c); const baseChosen=baseSkillChosenCount(c,cfg);
  return <section className="grid gap creationPage">
    <Panel title="1. Dados básicos"><div className="grid3"><Field label="Nome"><input value={c.name} onChange={e=>dispatch({type:'update',key:'name',value:e.target.value})}/></Field><Field label="Jogador"><input value={c.playerName} onChange={e=>dispatch({type:'update',key:'playerName',value:e.target.value})}/></Field><Field label="Campanha"><input value={c.campaign} onChange={e=>dispatch({type:'update',key:'campaign',value:e.target.value})}/></Field><Field label="Nível"><input type="number" min="1" max="20" value={c.level} onChange={e=>dispatch({type:'update',key:'level',value:Number(e.target.value)})}/></Field><Field label="Grau"><Select value={c.grade} onChange={v=>dispatch({type:'update',key:'grade',value:v})}>{['Quarto','Terceiro','Segundo','Primeiro','Especial'].map(x=><option key={x}>{x}</option>)}</Select></Field></div></Panel>
    <AttributeRollPanel c={c} dispatch={dispatch}/>
    <AttributeLimitControls c={c} dispatch={dispatch}/>
    {totalAttributeIncreaseEntitlement(c)>0&&<AttributeIncreaseManager c={c} dispatch={dispatch}/>}    
    <Panel title="3. Origem"><Field label="Origem"><Select value={c.originId} onChange={v=>dispatch({type:'update',key:'originId',value:v})}><option value="">Escolha</option>{rules.origins.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>{org&&<RuleBox title={org.name} text={org.originalText}/>}<OriginBonusPanel c={c} dispatch={dispatch}/></Panel>
    <Panel title="4. Especialização e escolhas principais"><div className="grid3"><Field label="Especialização"><Select value={c.specializationId} onChange={v=>dispatch({type:'update',key:'specializationId',value:v})}><option value="">Escolha</option>{rules.specializations.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field><Field label="Atributo de CD"><Select value={c.cdAttribute} onChange={v=>dispatch({type:'update',key:'cdAttribute',value:v})}><option value="">—</option>{ATTRS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select></Field><Field label="Atributo de Energia"><Select value={c.energyAttribute} onChange={v=>dispatch({type:'update',key:'energyAttribute',value:v})}><option value="">—</option>{ATTRS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select></Field></div>{sp&&<RuleBox title={sp.name} text={sp.originalText}/>}<div className="notice"><b>Treinamentos/Maestrias:</b> {cfg.masteryText}</div><LimitedChoiceGrid title={`Resistências (${(c.choices.resistances||[]).length}/${resMax})`} items={allowedRes.map(([id,name])=>({id,name,originalText:RESISTANCE_HELP[id]}))} selected={c.choices.resistances||[]} limit={resMax} onChange={arr=>dispatch({type:'choice',key:'resistances',value:clampSelection(arr,cfg.resAllowed,resMax)})}/><div className="notice"><b>Perícias treinadas:</b> {sCount}/{skillMax}. Grupo obrigatório da especialização: {baseChosen}/{cfg.skillBaseNeed}. Extras por INT ou SAB: +{extraSkillSlots(c)}.</div><LimitedChoiceGrid title="Perícias que podem ser treinadas" items={skillPool.map(s=>({...s, originalText:SKILL_HELP[s.id]}))} selected={c.choices.skills||[]} limit={skillMax} onChange={arr=>dispatch({type:'choice',key:'skills',value:clampSelection(arr,skillPool.map(s=>s.id),skillMax)})}/>{(c.choices.skills||[]).includes('oficio')&&<OfficeSelector c={c} dispatch={dispatch}/>} {masterSkillLimit(c)>0&&<LimitedChoiceGrid title={`Perícias Mestre (${(c.choices.masterSkills||[]).length}/${masterSkillLimit(c)})`} items={trainableSkills().filter(s=>selectedTrainedSkills(c).includes(s.id))} selected={c.choices.masterSkills||[]} limit={masterSkillLimit(c)} onChange={arr=>dispatch({type:'choice',key:'masterSkills',value:arr.slice(0,masterSkillLimit(c))})}/>}</Panel>
    <Panel title="5. Equipamento inicial"><div className="notice"><b>Equipamento inicial é resolvido no Registro e Inventário.</b> Itens gratuitos da especialização não contam nos 2 itens de custo 1.</div><button className="gold" onClick={()=>dispatch({type:'tab',tab:'Registro e Inventário'})}>Ir para Registro e Inventário</button><button onClick={()=>dispatch({type:'applyStarterEquipment'})}>Aplicar equipamentos gratuitos iniciais</button></Panel>
    <Panel title="Pendências"><TaskList tasks={tasks}/></Panel>
  </section>
}
Mundane = function Mundane({c,dispatch}){ 
  const sp=specialization(c), org=origin(c); const tMax=talentLimit(c); const selectedTalents=c.choices.talents||[]; const cfg=specTrainingConfig(c); const selectedFeatures=c.choices.mundaneFeatures||[]; const featureLimit=classFeatureChoiceLimit(c); const split=splitClassFeatures(sp);
  const totalPossible = split.choicesByLevel.filter(g=>Number(c.level||1)>=g.level).reduce((sum,g)=>sum+g.abilities.length,0);
  return <section className="grid gap mundanePage"><AttributeLimitControls c={c} dispatch={dispatch}/><Panel title="Perfil Mundano"><div className="grid3"><Stat label="Especialização" value={sp?.name||'—'}/><Stat label="Origem" value={org?.name||'—'}/><Stat label="Exaustão" value={c.mundaneProfile?.exhaustionLevel||0}/></div><div className="notice"><b>Maestrias/Treinamentos:</b> {cfg.masteryText}</div></Panel>
    <details className="collapsePanel"><summary>Habilidades automáticas e escolhas fixas</summary><div className="collapseContent"><div className="classSection"><h3>Origem</h3><div className="classAutoGrid">{org?<ClassFeatureReadOnly feature={{title:org.name,text:org.originalText}}/>:<p>Escolha uma origem.</p>}</div></div><div className="classSection"><h3>Base da Especialização</h3><p className="muted">Habilidades que entram automaticamente. Se o texto exigir uma escolha, selecione uma opção detectada no próprio texto.</p><div className="classAutoGrid">{split.base.length?split.base.map(f=><ClassBaseCard key={f.id} feature={f} c={c} dispatch={dispatch}/>):<p>Escolha uma especialização.</p>}</div></div></div></details>
    {totalAttributeIncreaseEntitlement(c)>0&&<AttributeIncreaseManager c={c} dispatch={dispatch}/>}    
    <Panel title={`Habilidades de Classe por nível: ${selectedFeatures.length}/${featureLimit}`}><p className="muted">Habilidades escolhíveis agrupadas por nível mínimo. Texto extraído do livro, sem resumo.</p><div className="notice"><b>Disponíveis no seu nível:</b> {totalPossible}. <b>Limite atual:</b> {featureLimit}.</div><div className="levelAbilityList">{split.choicesByLevel.length?split.choicesByLevel.map(group=><ClassLevelGroup key={group.level} group={group} c={c} selected={selectedFeatures} limit={featureLimit} dispatch={dispatch}/>):<p>Nenhuma habilidade de classe detectada para esta especialização.</p>}</div>{split.tables.length>0&&<details className="collapseBox"><summary>Tabelas e desbloqueios detectados</summary><div className="classAutoGrid">{split.tables.map(f=><ClassFeatureReadOnly key={f.id} feature={f}/>)}</div></details>}</Panel>
    <TalentMechanicsPanel c={c} dispatch={dispatch}/><Panel title={`Talentos e escolhas de level up: ${selectedTalents.length}/${tMax}`}><p className="muted">Talentos competem com habilidades de classe quando o level up permite escolher entre um ou outro. Use “?” para consultar texto e requisitos.</p><LimitedChoiceGrid title="Talentos disponíveis" items={rules.talents} selected={selectedTalents} limit={tMax} onChange={arr=>dispatch({type:'choice',key:'talents',value:clampSelection(arr,rules.talents.map(t=>t.id),tMax)})}/></Panel></section> }
LevelUp = function LevelUp({c,dispatch}){
  const [to,setTo]=useState(Math.min(20,Number(c.level||1)+1)); const tasks=levelTasks(c,Number(to)); const attrGainBetween=Array.from({length:Math.max(0,Number(to)-Number(c.level||1))},(_,i)=>Number(c.level||1)+i+1).filter(l=>l%4===0).length*2;
  return <section className="grid gap"><Panel title="Level Up Guiado"><div className="grid3"><Stat label="Nível atual" value={c.level}/><Field label="Novo nível"><input type="number" min={Number(c.level||1)+1} max="20" value={to} onChange={e=>setTo(e.target.value)}/></Field><button className="gold" onClick={()=>dispatch({type:'patch',patch:{level:Number(to),levelHistory:[{id:uid(),from:c.level,to:Number(to),at:new Date().toISOString(),tasks},...c.levelHistory]}})}>Aplicar Level Up</button></div>{attrGainBetween>0&&<div className="notice warnNotice"><b>Este avanço libera +{attrGainBetween} pontos de atributo.</b> Após aplicar, distribua abaixo.</div>}<div className="taskList">{tasks.map((t,i)=><div key={i} className="bad"><AlertTriangle/><span>{t}</span></div>)}</div><h3>Histórico</h3>{c.levelHistory.map(h=><details key={h.id}><summary>Nível {h.from} → {h.to}</summary>{h.tasks.map(t=><p key={t}>{t}</p>)}</details>)}</Panel><AttributeIncreaseManager c={c} dispatch={dispatch}/></section>
}

createRoot(document.getElementById('root')).render(<App/>);