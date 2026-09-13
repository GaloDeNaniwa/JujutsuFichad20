import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import { Save, Upload, Download, RotateCcw, Search, AlertTriangle, CheckCircle2, Lock, Plus, Trash2, Swords, HeartPulse, Zap, Shield, BookOpen, Eye, Coins, ChevronDown, ChevronUp } from 'lucide-react';
import rules from './data/rules.json';
import bookPageIndex from './data/page-index.json';
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
const CREDIT_PASSWORD_DEFAULT = '2655';
const CREDIT_MASTER_PASSWORD = '265511';
const ATTRIBUTE_HELP = {strength:'Força mede potência física: ataques e manobras corporais, Atletismo, dano/controle físico quando a habilidade usa FOR.',dexterity:'Destreza mede agilidade, reflexos e precisão: Defesa, Iniciativa, Acrobacia, Furtividade e ataques/ações ágeis quando aplicável.',constitution:'Constituição mede resistência corporal: PV, Fortitude, fôlego, tolerância a dano, venenos e esforço prolongado.',intelligence:'Inteligência mede estudo, técnica e raciocínio: investigação, ofícios, ocultismo, medicina e algumas CDs/recursos de especialização.',wisdom:'Sabedoria mede percepção, intuição e leitura do ambiente: Atenção, Percepção, Intuição e algumas CDs/recursos.',presence:'Presença mede força de personalidade e imposição: Persuasão, Intimidação, Enganação, Performance e técnicas sociais.'};
const RESISTANCE_HELP = {astucia:'Astúcia é usada contra efeitos que exigem raciocínio, leitura, truques mentais ou reação intelectual.',fortitude:'Fortitude é usada contra efeitos físicos, venenos, dor, exaustão e resistência corporal.',integrity:'Integridade protege a estabilidade interna, alma, corpo e efeitos que atacam sua essência.',reflexes:'Reflexos é usado para evitar explosões, armadilhas, ataques em área e ameaças que dependem de reação rápida.',will:'Vontade é usada contra medo, compulsão, domínio mental, pressão espiritual e efeitos que desafiam determinação.'};
const SKILL_HELP = {acrobacia:'Acrobacia cobre equilíbrio, cambalhotas, quedas, saltos precisos, escapar de posições ruins e movimentos corporais complexos.',atletismo:'Atletismo cobre correr, saltar, nadar, escalar, empurrar, puxar, agarrar e feitos de força física.',direcao:'Direção cobre conduzir veículos, montarias ou movimentação controlada em deslocamento arriscado.',enganacao:'Enganação cobre mentir, blefar, disfarçar intenções e manipular informações falsas.',feiticaria:'Feitiçaria cobre conhecimento e execução de energia amaldiçoada, feitiços, técnicas e fenômenos jujutsu.',furtividade:'Furtividade cobre se esconder, se mover sem ser notado e agir silenciosamente.',historia:'História cobre conhecimento histórico, eventos, linhagens, organizações e registros relevantes.',intimidacao:'Intimidação cobre ameaçar, pressionar e impor presença para obter reação social.',intuicao:'Intuição cobre perceber intenção, mentira, emoção e riscos sutis.',investigacao:'Investigação cobre buscar pistas, interpretar detalhes e conectar evidências.',medicina:'Medicina cobre estabilizar, tratar ferimentos, diagnosticar condições e lidar com cuidados físicos.',ocultismo:'Ocultismo cobre conhecimento de maldições, rituais, barreiras, entidades e fenômenos sobrenaturais.',oficio:'Ofício exige especificar uma profissão/ferramenta. Ex.: Ferreiro, Alfaiate, Alquimia, Canalizador.',percepcao:'Percepção cobre notar ameaças, sons, movimento, detalhes visuais e emboscadas. Também alimenta Atenção.',performance:'Performance cobre atuação, música, presença pública e apresentação artística/social.',persuasao:'Persuasão cobre convencer, negociar, pedir ajuda e influenciar sem ameaça direta.',prestidigitacao:'Prestidigitação cobre truques manuais, esconder objetos, saques rápidos e manipulação fina.',sobrevivencia:'Sobrevivência cobre rastrear, se orientar, resistir em ambientes hostis e lidar com natureza.',tecnologia:'Tecnologia cobre operar, entender e consertar dispositivos modernos.',teologia:'Teologia cobre religiões, doutrinas, símbolos espirituais e tradição sagrada.'};

// v5.2 — origem Herdado por clã
const HERDADO_CLANS = [
  {
    id:'gojo', name:'Clã Gojo', attrs:['intelligence','wisdom'], techniques:'Seis Olhos, Ilimitado',
    skills:['feiticaria','percepcao','intuicao'],
    featureName:'Potencial Lendário',
    featureText:'Ser parte do clã Gojo confere um potencial de energia extremo, juntamente de uma facilidade para desenvolver feitiços. Em todo nível par você recebe 1 ponto de energia amaldiçoada adicional. Além disso, você também recebe 1 Feitiço adicional no primeiro nível e mais um nos níveis 5, 10, 15 e 20.',
    originalText:'CLÃ GOJO\nO Clã Gojo descende de um lendário feiticeiro antigo de Jujutsu, Michizane Sugawara, e tem como técnicas herdadas o Ilimitado e os Seis Olhos, que juntos tem um poder enorme. O membro de maior destaque é Satoru Gojo, o feiticeiro mais forte, cujo poder sozinho é capaz de manter o clã Gojo entre os maiores e mais respeitados.\n\nCARACTERÍSTICAS DE CLÃ\nCaso seu personagem seja do clã Gojo, recebe os seguintes benefícios:\nBônus em Atributo. Aumenta em 2 a Inteligência ou Sabedoria, e em 1 o que não foi escolhido.\nTreinamentos de Clã. Você se torna treinado em 2 perícias entre Feitiçaria, Percepção e Intuição. Ao invés de receber treinamento em 2 perícias, você pode escolher se tornar especialista em uma.\nPotencial Lendário. Ser parte do clã Gojo confere um potencial de energia extremo, juntamente de uma facilidade para desenvolver feitiços. Em todo nível par você recebe 1 ponto de energia amaldiçoada adicional. Além disso, você também recebe 1 Feitiço adicional no primeiro nível e mais um nos níveis 5, 10, 15 e 20.'
  },
  {
    id:'inumaki', name:'Clã Inumaki', attrs:['intelligence','presence'], techniques:'Fala Amaldiçoada',
    skills:['feiticaria','percepcao','intuicao'],
    featureName:'Olhos de Cobra e Presas',
    featureText:'Os membros do clã Inumaki possuem uma marca única ao redor de sua boca, a qual tem a forma dos olhos de uma cobra e presas. Remetendo à técnica herdada do clã, essa marca já concede algum poder as palavras de um Inumaki: uma quantidade de vezes igual ao seu bônus de treinamento, você pode dar o comando de uma ação bônus para um aliado, o qual pode a realizar como uma reação. Você recupera os usos dessa habilidade após um descanso longo.',
    originalText:'CLÃ INUMAKI\nO Clã Inumaki é uma das várias famílias menores. Embora não sejam considerados um dos clãs maiores, sua técnica amaldiçoada, Fala Amaldiçoada, é bem respeitada. Possuem um sigilo característico da família, que são os emblemas ao redor da boca do usuário da técnica. O membro de maior destaque é Toge Inumaki.\n\nCARACTERÍSTICAS DE CLÃ\nCaso seu personagem seja do clã Inumaki, ele recebe os seguintes benefícios:\nBônus em Atributo. Aumenta em 2 a Inteligência ou Presença, e em 1 o que não foi escolhido.\nTreinamentos de Clã. Você se torna treinado em 2 perícias entre Feitiçaria, Percepção e Intuição. Ao invés de receber treinamento em 2 perícias, você pode escolher se tornar especialista em uma.\nOlhos de Cobra e Presas. Os membros do clã Inumaki possuem uma marca única ao redor de sua boca, a qual tem a forma dos olhos de uma cobra e presas. Remetendo à técnica herdada do clã, essa marca já concede algum poder as palavras de um Inumaki: uma quantidade de vezes igual ao seu bônus de treinamento, você pode dar o comando de uma ação bônus para um aliado, o qual pode a realizar como uma reação. Você recupera os usos dessa habilidade após um descanso longo.'
  },
  {
    id:'kamo', name:'Clã Kamo', attrs:['constitution','wisdom'], techniques:'Manipulação Sanguínea',
    skills:['atletismo','medicina','persuasao'],
    featureName:'Valor do Sangue',
    featureText:'Os membros do Clã Kamo compreendem o valor do sangue, e isso os dá uma maior vitalidade. Sempre que subir de nível, sua vida máxima aumenta em 1 ponto adicional. A partir do nível 10, você soma o seu modificador de Constituição ao seu total de vida. Caso, ao subir de nível, você role para aumentar a sua vida máxima e o valor obtido seja menor do que a média, você pode rolar novamente e ficar com o maior valor.',
    originalText:'CLÃ KAMO\nO Clã Kamo valoriza grandemente os laços de sangue, e herdar a sua técnica é o foco. A sua técnica herdada é a Manipulação de Sangue, herdada pelo membro de maior destaque, que é Noritoshi Kamo. Sua técnica é admirada pelo equilíbrio fornecido e por ser perfeita para aqueles que valorizam o sangue.\n\nCARACTERÍSTICAS DE CLÃ\nCaso seu personagem seja do clã Kamo, recebe os seguintes benefícios:\nBônus em Atributo. Aumenta em 2 a Constituição ou Sabedoria, e em 1 o que não foi escolhido.\nTreinamentos de Clã. Você se torna treinado em 2 perícias entre Atletismo, Medicina e Persuasão. Ao invés de receber treinamento em 2 perícias, você pode escolher se tornar especialista em uma.\nValor do Sangue. Os membros do Clã Kamo compreendem o valor do sangue, e isso os dá uma maior vitalidade. Sempre que subir de nível, sua vida máxima aumenta em 1 ponto adicional. A partir do nível 10, você soma o seu modificador de Constituição ao seu total de vida. Caso, ao subir de nível, você role para aumentar a sua vida máxima e o valor obtido seja menor do que a média, você pode rolar novamente e ficar com o maior valor.'
  },
  {
    id:'zenin', name:'Clã Zenin', attrs:['strength','dexterity','constitution','intelligence','wisdom','presence'], techniques:'Dez Sombras, Projeção',
    skills:'any',
    featureName:'Foco no Poder',
    featureText:'O clã Zenin se dedica completamente ao poder e aprimoramento das suas técnicas, ampliando o potencial delas e de suas habilidades. No primeiro nível, você pode escolher um Feitiço para ser um Feitiço Focado. Um Feitiço Focado pode: causar um dado de dano a mais, curar um dado de vida a mais, ter o dobro do alcance ou ter a dificuldade do teste para resistir aumentada em um valor igual ao seu bônus de treinamento. Nos níveis 5, 10, 15 e 20 você pode escolher outro Feitiço para ser um Feitiço Focado.',
    originalText:'CLÃ ZENIN\nO Clã Zenin incorpora todos os valores nobres de um clã maior, acreditando que técnicas amaldiçoadas poderosas são mais importantes do que tudo. Entretanto, às vezes isso acarreta em problemáticas diante aqueles feiticeiros que não se desenvolvem muito. Possuem várias técnicas herdadas, com grande variedade, mas mantendo o poder e potencial elevado.\n\nCARACTERÍSTICAS DE CLÃ\nCaso seu personagem seja do clã Zenin, recebe os seguintes benefícios:\nBônus em Atributo. Um membro do clã Zenin aumenta o valor de um atributo em 2 pontos o de outro em 1 ponto.\nTreinamentos de Clã. Você se torna treinado em 2 perícias quaisquer. Ao invés de receber treinamento em 2 perícias, você pode escolher se tornar especialista em uma.\nFoco no Poder. O clã Zenin se dedica completamente ao poder e aprimoramento das suas técnicas, ampliando o potencial delas e de suas habilidades. No primeiro nível, você pode escolher um Feitiço para ser um Feitiço Focado. Um Feitiço Focado pode: causar um dado de dano a mais, curar um dado de vida a mais, ter o dobro do alcance ou ter a dificuldade do teste para resistir aumentada em um valor igual ao seu bônus de treinamento. Nos níveis 5, 10, 15 e 20 você pode escolher outro Feitiço para ser um Feitiço Focado.'
  }
];
function herdadoClan(c){ return HERDADO_CLANS.find(x=>x.id===c.choices?.herdadoClan); }
function herdadoClanSkillPool(c){ const clan=herdadoClan(c); if(!clan) return []; return clan.skills==='any' ? trainableSkills().map(s=>s.id) : clan.skills; }
function herdadoClanTrainedSkills(c){ if(c.originId!=='herdado') return []; const clan=herdadoClan(c); if(!clan) return []; const mode=c.choices?.herdadoClanTrainingMode||'trained'; if(mode==='master') return c.choices?.herdadoClanMasterSkill ? [c.choices.herdadoClanMasterSkill] : []; const pool=herdadoClanSkillPool(c); return clampSelection(c.choices?.herdadoClanTrainedSkills||[], pool, 2); }
function herdadoClanMasterSkills(c){ if(c.originId!=='herdado') return []; return c.choices?.herdadoClanTrainingMode==='master' && c.choices?.herdadoClanMasterSkill ? [c.choices.herdadoClanMasterSkill] : []; }
function herdadoClanTrainingResolved(c){ if(c.originId!=='herdado') return true; const clan=herdadoClan(c); if(!clan) return false; const mode=c.choices?.herdadoClanTrainingMode||'trained'; if(mode==='master') return !!c.choices?.herdadoClanMasterSkill && herdadoClanSkillPool(c).includes(c.choices.herdadoClanMasterSkill); return herdadoClanTrainedSkills(c).length===2; }
function herdadoExtraEnergy(c){ if(c.originId==='herdado' && c.choices?.herdadoClan==='gojo') return Math.floor(Number(c.level||1)/2); return 0; }
function herdadoExtraHp(c){ if(c.originId==='herdado' && c.choices?.herdadoClan==='kamo') return Number(c.level||1) + (Number(c.level||1)>=10 ? Math.max(0,mod(finalAttr(c,'constitution'))) : 0); return 0; }
function herdadoExtraSpellSlots(c){ if(c.originId!=='herdado') return 0; const lvl=Number(c.level||1); if(c.choices?.herdadoClan==='gojo') return 1 + [5,10,15,20].filter(x=>lvl>=x).length; if(c.choices?.herdadoClan==='zenin') return 1 + [5,10,15,20].filter(x=>lvl>=x).length; return 0; }


function uid(){ if(typeof crypto!=='undefined' && crypto.randomUUID) return crypto.randomUUID(); return Math.random().toString(36).slice(2)+Date.now().toString(36)+Math.random().toString(36).slice(2); }
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
  combat:{hpCurrent:null, hpTemp:0, peCurrent:null, peTemp:0, staminaCurrent:null, staminaTemp:0, soulCurrent:null, conditions:[], log:[], santuarioStacks:0},
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
  const base={activeTab:'Criação Guiada', credits:5, firstFreeUsed:false, creditPassword:CREDIT_PASSWORD_DEFAULT, characters:[emptyCharacter()], activeCharacterId:null, ruleReview:{}, communityTechniques:[], adminLog:[]};
  base.activeCharacterId=base.characters[0].id;
  try {
    const creditRaw = localStorage.getItem(CREDIT_STORAGE_KEY);
    if(creditRaw){
      const creditState = JSON.parse(creditRaw);
      base.credits = Number.isFinite(Number(creditState.credits)) ? Number(creditState.credits) : 5;
      base.firstFreeUsed = !!creditState.firstFreeUsed;
      base.creditPassword = typeof creditState.creditPassword==='string' && creditState.creditPassword ? creditState.creditPassword : CREDIT_PASSWORD_DEFAULT;
    }
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw) return base;
    const parsed=JSON.parse(raw);
    if(!Array.isArray(parsed.characters) || !parsed.characters.length) return base;
    const characters = parsed.characters.map(normalizeCharacter);
    const activeCharacterId = characters.some(c=>c.id===parsed.activeCharacterId) ? parsed.activeCharacterId : characters[0].id;
    return {...base, ...parsed, credits:base.credits, firstFreeUsed:base.firstFreeUsed, creditPassword:base.creditPassword, characters, activeCharacterId};
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
    case 'update': return withChar(c=>{ const next={...c,[action.key]:action.value}; if(action.key==='originId'){ next.choices={...next.choices, originBonuses:{}, originBonusAlloc:{}, herdadoClan:'', herdadoClanBonusMain:'', herdadoClanTrainingMode:'trained', herdadoClanTrainedSkills:[], herdadoClanMasterSkill:'', herdadoFocusedSpells:[], restringidoApexAttrs:[], [DERIVADO_LIMIT_ATTR_KEY]:''}; next.attributes={...next.attributes, originBonuses:{}}; next.isRestricted=action.value==='restringido'; if(action.value==='restringido') next.specializationId='restringido'; } if(action.key==='specializationId'){ const cfg=specTrainingConfig(next); next.choices={...next.choices, resistances:[...new Set([...(cfg.resFixed||[]), ...(next.choices.resistances||[])])].slice(0,cfg.resMax)}; if(next.cdAttribute && !cfg.cdAttributes.includes(next.cdAttribute)) next.cdAttribute=''; if(!cfg.hasEnergy || !cfg.energyAddsAttribute || (next.energyAttribute && !cfg.cdAttributes.includes(next.energyAttribute))) next.energyAttribute=''; } return next; });
    case 'patch': return withChar(c=>({...c, ...action.patch}));
    case 'identity': return withChar(c=>({...c, identity:{...c.identity, [action.key]:action.value}}));
    case 'choice': return withChar(c=>({...c, choices:{...c.choices, [action.key]:action.value}}));
    case 'setExtraSkillMasterCount': return withChar(c=>reclampSkillsAfter({...c, choices:{...c.choices, extraSkillMasterCount:action.value}}));
    case 'setExtraSkillAttribute': return withChar(c=>reclampSkillsAfter({...c, choices:{...c.choices, extraSkillAttribute:action.value}}));
    case 'setHpGain': return withChar(c=>({...c, hpGains:{...(c.hpGains||{}), [action.level]:{mode:action.mode, value:action.value}}}));
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
    case 'addItem': return {...withChar(c=>({...c, inventory:{...c.inventory, items:[...c.inventory.items,{...action.item, instanceId:uid(), qty:1, freeStarter:!!action.freeStarter, equipped: action.item.type==='uniform' && !c.inventory.items.some(i=>i.type==='uniform'&&i.equipped)}]}})), adminLog:[...state.adminLog,{id:uid(),type:'item',text:`${action.item.name} ${action.freeStarter?'adicionado como equipamento gratuito':'adicionado ao inventário'}.`,at:new Date().toISOString()}], toast:{id:uid(),kind:'good',text:`${action.item.name} adicionado ao inventário.`}};
    case 'clearToast': return state.toast && state.toast.id===action.id ? {...state, toast:null} : state;
    case 'applyStarterEquipment': return applyStarterEquipment(state, currentId, withChar);
    case 'removeItem': return withChar(c=>({...c, inventory:{...c.inventory, items:c.inventory.items.filter(i=>i.instanceId!==action.instanceId)}}));
    case 'equipItem': return withChar(c=>({...c, inventory:{...c.inventory, items:c.inventory.items.map(i=> i.instanceId===action.instanceId ? {...i, equipped:!i.equipped} : (action.singleType && i.type===action.singleType ? {...i,equipped:false}:i))}}));
    case 'updateItemField': return withChar(c=>({...c, inventory:{...c.inventory, items:c.inventory.items.map(i=> i.instanceId===action.instanceId ? {...i, [action.field]:action.value} : i)}}));
    case 'santuarioHit': return withChar(c=>({...c, combat:{...c.combat, santuarioStacks:Math.min(3,Number(c.combat.santuarioStacks||0)+1)}}));
    case 'santuarioReset': return withChar(c=>({...c, combat:{...c.combat, santuarioStacks:0}}));
    case 'applySantuarioTempHp': return withChar(c=>{ const s=calc(c); const temp=Number(c.combat.hpTemp||0)>0 ? c.combat.hpTemp : Math.floor(s.hpMax/3); return {...c, combat:{...c.combat, hpTemp:temp}}; });
    case 'toggleCondition': return withChar(c=>({ ...c, combat:{...c.combat, conditions:c.combat.conditions.includes(action.id)?c.combat.conditions.filter(x=>x!==action.id):[...c.combat.conditions,action.id]}}));
    case 'log': return withChar(c=>({...c, combat:{...c.combat, log:[{id:uid(),at:new Date().toISOString(),...action.entry},...c.combat.log].slice(0,80)}}));
    case 'applyDamage': return withChar(c=>{ const d=Math.max(0,Number(action.value)||0); const s=calc(c); const curr=c.combat.hpCurrent ?? s.hpMax; const temp=Number(c.combat.hpTemp||0); const absorbed=Math.min(temp,d); const remaining=d-absorbed; return {...c, combat:{...c.combat, hpCurrent:Math.max(0,curr-remaining), hpTemp:temp-absorbed, log:[{id:uid(),type:'damage',label:`Dano ${d}${absorbed?` (${absorbed} absorvido por PV temporário)`:''}`,at:new Date().toISOString()},...c.combat.log]}} });
    case 'applyHeal': return withChar(c=>{ const h=Number(action.value)||0; const s=calc(c); const curr=c.combat.hpCurrent ?? s.hpMax; return {...c, combat:{...c.combat, hpCurrent:Math.min(s.hpMax,curr+h), log:[{id:uid(),type:'heal',label:`Cura ${h}`,at:new Date().toISOString()},...c.combat.log]}} });
    case 'setTempHp': return withChar(c=>{ const s=calc(c); const cap=Math.floor(s.hpMax/2); return {...c, combat:{...c.combat, hpTemp:Math.max(0,Math.min(cap,Number(action.value)||0))}} });
    case 'setTempPe': return withChar(c=>{ const s=calc(c); const cap=Math.floor(s.peMax/2); return {...c, combat:{...c.combat, peTemp:Math.max(0,Math.min(cap,Number(action.value)||0))}} });
    case 'spendPE': return withChar(c=>{ const v=Number(action.value)||0; const s=calc(c); const curr=c.combat.peCurrent ?? s.peMax; return {...c, combat:{...c.combat, peCurrent:Math.max(0,curr-v), log:[{id:uid(),type:'energy',label:`Gasto de PE ${v}`,at:new Date().toISOString()},...c.combat.log]}} });
    case 'healPE': return withChar(c=>{ const v=Number(action.value)||0; const s=calc(c); const curr=c.combat.peCurrent ?? s.peMax; return {...c, combat:{...c.combat, peCurrent:Math.min(s.peMax,curr+v), log:[{id:uid(),type:'energy',label:`Recuperação de PE ${v}`,at:new Date().toISOString()},...c.combat.log]}} });
    case 'restEnergy': return withChar(c=>{ const s=calc(c); const curr=c.combat.peCurrent ?? s.peMax; const nextPe=action.rest==='longo'?s.peMax:Math.min(s.peMax, curr+Math.floor(s.peMax/2)); const nextHp=action.rest==='longo'?s.hpMax:(c.combat.hpCurrent??s.hpMax); return {...c, combat:{...c.combat, peCurrent:nextPe, hpCurrent:nextHp, log:[{id:uid(),type:'energy',label:`Descanso ${action.rest==='longo'?'longo':'curto'}: PE ${nextPe}/${s.peMax}${action.rest==='longo'?`, PV restaurado`:''}`,at:new Date().toISOString()},...c.combat.log]}} });
    case 'spendStamina': return withChar(c=>{ const v=Number(action.value)||0; const s=calc(c); const curr=c.combat.staminaCurrent ?? s.staminaMax; return {...c, combat:{...c.combat, staminaCurrent:Math.max(0,curr-v), log:[{id:uid(),type:'stamina',label:`Gasto de Estamina ${v}`,at:new Date().toISOString()},...c.combat.log]}} });
    case 'restoreStamina': return withChar(c=>{ const s=calc(c); const curr=c.combat.staminaCurrent ?? s.staminaMax; const next=action.rest==='longo'?s.staminaMax:Math.min(s.staminaMax, curr+Math.floor(s.staminaMax/2)); return {...c, combat:{...c.combat, staminaCurrent:next, log:[{id:uid(),type:'stamina',label:`Descanso ${action.rest==='longo'?'longo':'curto'}: Estamina restaurada para ${next}/${s.staminaMax}`,at:new Date().toISOString()},...c.combat.log]}} });
    case 'addSummon': return withChar(c=>({...c, summons:[...c.summons,{id:uid(),name:'Invocação',grade:'-',cost:0,hpMax:10,hpCurrent:10,defense:10,movement:9,attributes:{strength:8,dexterity:8,constitution:8,intelligence:8,wisdom:8,presence:8},actions:[],traits:[]}]}));
    case 'updateSummon': return withChar(c=>({...c, summons:c.summons.map(s=>s.id===action.id?{...s,[action.key]:action.value}:s)}));
    case 'removeSummon': return withChar(c=>({...c, summons:c.summons.filter(s=>s.id!==action.id)}));
    case 'levelUp': return withChar(c=>({...c, level:Number(action.toLevel), levelHistory:[{id:uid(),from:c.level,to:Number(action.toLevel),at:new Date().toISOString(),tasks:levelTasks(c, Number(action.toLevel))},...c.levelHistory]}));
    case 'addTechFeature': return withChar(c=>({...c, technique:{...c.technique, [action.key]:[...c.technique[action.key], {id:uid(),name:'',grade:'Primeiro',cost:'0',action:'Padrão',target:'',area:'',duration:'',imageUrl:'',text:''}]}}));
    case 'addPresetActive': return withChar(c=>({...c, technique:{...c.technique, actives:[...c.technique.actives, {id:uid(),name:action.preset.name,grade:'Estilo',cost:'Ver texto',action:'Ver texto',target:'',area:'',duration:'',imageUrl:'',text:action.preset.originalText}]}}));
    case 'importTechniques': return withChar(c=>{
      const newActives=[...c.technique.actives]; const newPassives=[...c.technique.passives];
      for(const item of action.items){
        const feature={id:uid(), name:item.name, grade:item.grade, cost:item.action?`Ver texto (${item.action})`:'Ver texto', action:item.action||'', target:item.target||'', area:item.area||'', duration:item.duration||'', imageUrl:'', text:[item.requisito?`Requisito: ${item.requisito}`:'', item.text].filter(Boolean).join('\n\n')};
        if(item.isPassive) newPassives.push(feature); else newActives.push(feature);
      }
      return {...c, technique:{...c.technique, actives:newActives, passives:newPassives}};
    });
    case 'updateTechFeature': return withChar(c=>({...c, technique:{...c.technique, [action.key]:c.technique[action.key].map(f=>f.id===action.id?{...f,[action.field]:action.value}:f)}}));
    case 'removeTechFeature': return withChar(c=>({...c, technique:{...c.technique, [action.key]:c.technique[action.key].filter(f=>f.id!==action.id)}}));
    case 'exportImport': {
      const incoming = action.state || {};
      const characters = Array.isArray(incoming.characters) && incoming.characters.length ? incoming.characters.map(normalizeCharacter) : state.characters;
      const activeCharacterId = characters.some(c=>c.id===incoming.activeCharacterId) ? incoming.activeCharacterId : characters[0]?.id;
      return {...state, ...incoming, characters, activeCharacterId, credits:state.credits, firstFreeUsed:state.firstFreeUsed, creditPassword:state.creditPassword};
    }
    case 'reset': localStorage.removeItem(STORAGE_KEY); return {...initialState(), credits:state.credits, firstFreeUsed:state.firstFreeUsed, creditPassword:state.creditPassword};
    case 'addCredits': {
      if(String(action.password||'')!==String(state.creditPassword||CREDIT_PASSWORD_DEFAULT)) return {...state, adminLog:[...state.adminLog,{id:uid(),type:'erro',text:'Senha de créditos incorreta.',at:new Date().toISOString()}]};
      const amount=Math.max(0,Math.floor(Number(action.amount)||0));
      if(!amount) return state;
      return {...state, credits:state.credits+amount, adminLog:[...state.adminLog,{id:uid(),type:'credito',text:`+${amount} crédito(s) adicionado(s) manualmente.`,at:new Date().toISOString()}]};
    }
    case 'changeCreditPassword': {
      if(String(action.masterPassword||'')!==CREDIT_MASTER_PASSWORD) return {...state, adminLog:[...state.adminLog,{id:uid(),type:'erro',text:'Senha mestra incorreta.',at:new Date().toISOString()}]};
      const newPassword=String(action.newPassword||'').trim();
      if(!newPassword) return state;
      return {...state, creditPassword:newPassword, adminLog:[...state.adminLog,{id:uid(),type:'credito',text:'Senha de créditos alterada.',at:new Date().toISOString()}]};
    }
    default: return state;
  }
}
function latestRollSet(c){ return c.rolls[c.rolls.length-1]; }
function rollValue(c, rollId){ return latestRollSet(c)?.rolls.find(r=>r.id===rollId)?.total; }


function originBonusAllocation(c){ return c.choices?.originBonusAlloc || {}; }

function originBonusSpent(c){ return Object.values(originBonusAllocation(c)).reduce((a,b)=>a+Number(b||0),0); }


function HerdadoOriginPanel({c,dispatch}){
  const clan=herdadoClan(c); const cfg=originBonusConfig(c); const pool=herdadoClanSkillPool(c); const mode=c.choices?.herdadoClanTrainingMode||'trained'; const trained=herdadoClanTrainedSkills(c); const [modal,setModal]=useState(null);
  return <div className="choiceBlock herdadoPanel"><h3>Origem Herdado — escolha de clã</h3><p className="muted">Herdado não usa bônus genérico. Primeiro escolha o clã; depois o app libera os atributos, treinamentos e herança daquele clã.</p>
    <Field label="Clã"><Select value={c.choices?.herdadoClan||''} onChange={v=>{ dispatch({type:'choice',key:'herdadoClan',value:v}); dispatch({type:'choice',key:'herdadoClanBonusMain',value:''}); dispatch({type:'choice',key:'herdadoClanTrainedSkills',value:[]}); dispatch({type:'choice',key:'herdadoClanMasterSkill',value:''}); }}><option value="">Escolha o clã</option>{HERDADO_CLANS.map(cl=><option key={cl.id} value={cl.id}>{cl.name} — {cl.techniques}</option>)}</Select></Field>
    {clan&&<><div className="notice"><b>Técnicas/Jujutsus herdados:</b> {clan.techniques}</div><button onClick={()=>setModal(clan)}>Ver texto completo do clã</button>
      <h4>Bônus em Atributo</h4>{clan.id==='zenin'?<div className="grid2"><Field label="+2 em atributo"><Select value={c.choices.originBonuses?.b2||''} onChange={v=>dispatch({type:'choiceObject',key:'originBonuses',id:'b2',value:v})}><option value="">—</option>{ATTRS.map(([k,l])=><option key={k} value={k} disabled={c.choices.originBonuses?.b1===k}>{l}</option>)}</Select></Field><Field label="+1 em atributo"><Select value={c.choices.originBonuses?.b1||''} onChange={v=>dispatch({type:'choiceObject',key:'originBonuses',id:'b1',value:v})}><option value="">—</option>{ATTRS.map(([k,l])=><option key={k} value={k} disabled={c.choices.originBonuses?.b2===k}>{l}</option>)}</Select></Field></div>:<Field label={`Escolha qual atributo recebe +2. O outro atributo do ${clan.name} recebe +1 automaticamente.`}><Select value={c.choices?.herdadoClanBonusMain||''} onChange={v=>dispatch({type:'choice',key:'herdadoClanBonusMain',value:v})}><option value="">Escolha</option>{clan.attrs.map(k=><option key={k} value={k}>{ATTR_LABEL[k]}</option>)}</Select></Field>}
      <h4>Treinamentos de Clã</h4><div className="notice">Escolha <b>2 perícias treinadas</b> entre as opções do clã OU escolha <b>1 perícia especialista/mestre</b>. Essas perícias são da origem e não gastam o limite normal da especialização.</div><Field label="Modo de treinamento do clã"><Select value={mode} onChange={v=>{dispatch({type:'choice',key:'herdadoClanTrainingMode',value:v}); dispatch({type:'choice',key:'herdadoClanTrainedSkills',value:[]}); dispatch({type:'choice',key:'herdadoClanMasterSkill',value:''});}}><option value="trained">Treinado em 2 perícias</option><option value="master">Especialista/Mestre em 1 perícia</option></Select></Field>
      {mode==='trained'?<LimitedChoiceGrid title={`Perícias do clã (${trained.length}/2)`} items={pool.map(id=>({...rules.skills.find(s=>s.id===id), originalText:SKILL_HELP[id]})).filter(Boolean)} selected={trained} limit={2} onChange={arr=>dispatch({type:'choice',key:'herdadoClanTrainedSkills',value:arr.slice(0,2)})}/>:<Field label="Perícia especialista/mestre do clã"><Select value={c.choices?.herdadoClanMasterSkill||''} onChange={v=>dispatch({type:'choice',key:'herdadoClanMasterSkill',value:v})}><option value="">Escolha</option>{pool.map(id=><option key={id} value={id}>{skillName(id)}</option>)}</Select></Field>}
      <h4>Herança de Clã</h4><RuleBox title={clan.featureName} text={clan.featureText}/>
      {clan.id==='gojo'&&<div className="notice"><b>Automático:</b> +{herdadoExtraEnergy(c)} PE por níveis pares. Feitiços adicionais no 1º, 5º, 10º, 15º e 20º: {herdadoExtraSpellSlots(c)}.</div>}
      {clan.id==='kamo'&&<div className="notice"><b>Automático:</b> +{herdadoExtraHp(c)} PV máximo pela herança Valor do Sangue.</div>}
      {clan.id==='zenin'&&<div className="notice"><b>Controle:</b> Feitiços Focados disponíveis: {herdadoExtraSpellSlots(c)}. Registre quais feitiços foram escolhidos na área de Técnica.</div>}
      {clan.id==='inumaki'&&<div className="notice"><b>Usos:</b> Olhos de Cobra e Presas usa bônus de treinamento: {trainingBonus(c.level)} uso(s) por descanso longo.</div>}
    </>}
    {modal&&<ModalText title={modal.name} text={modal.originalText} onClose={()=>setModal(null)}/>} 
  </div>
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
function talentsPool(c){ return escolhidoId(c.originId) ? [...rules.talents, ...ESCOLHIDO_TALENTS] : rules.talents; }
function selectedTalentNames(c){ return (c.choices?.talents||[]).map(id=>talentsPool(c).find(t=>t.id===id)?.name || id); }
function hasTalentByName(c,name){ const n=normText(name); return selectedTalentNames(c).some(x=>normText(x)===n || normText(x).includes(n)); }
function getSelectedArrayChoice(c,key){ const v=c.choices?.[key]; return Array.isArray(v)?v:[]; }
function equippedAttrItem(c,k){ const targets=ATTRIBUTE_SPECIAL_ITEM_MAP[k]||[]; return (c.inventory?.items||[]).find(i=>i.equipped && targets.some(t=>normText(i.name).includes(normText(t)) || normText(i.originalText).includes(normText(t)))); }
function attributeItemBonus(c,k){ return equippedAttrItem(c,k) ? 2 : 0; }
function extraAttributeValueFromMechanics(c,k){ let total=0; if(hasTalentByName(c,'Incremento De Atributo') && c.choices?.talentIncrementAttr===k) total+=2; if(hasTalentByName(c,'Quebra De Limites') && getSelectedArrayChoice(c,'quebraLimitesAttrs').includes(k)) total+=2; if(hasTalentByName(c,'Resiliência Melhorada') && c.choices?.resilienciaMelhoradaAttr===k) total+=1; if(hasTalentByName(c,'Tempestade De Ideias') && c.choices?.tempestadeAttr===k) total+=1; if(hasTalentByName(c,'Mestre Das Armas') && c.choices?.mestreArmasAttr===k) total+=2; if(hasTalentByName(c,'Especialista Em Concussão') && c.choices?.especialistaConcussaoAttr===k) total+=1; if(hasTalentByName(c,'Especialista Em Cortes') && c.choices?.especialistaCortesAttr===k) total+=1; if(hasTalentByName(c,'Especialista Em Perfuração') && c.choices?.especialistaPerfuracaoAttr===k) total+=1; if(c.originId==='restringido' && getSelectedArrayChoice(c,'restringidoApexAttrs').includes(k)) total+=2; if(hasEscolhidoVow(c,'hb_filho_do_adulterio') && c.choices?.filhoAdulterioAttr===k) total+=4; return total; }
function baseAttributeValue(c,k){ const base=rollValue(c,c.attributes.assigned[k]); if(base==null) return null; const inc=Number(attributeIncreaseMap(c)[k]||0); return base + originBonusValue(c,k) + Number(c.attributes.temp[k]||0) + inc + extraAttributeValueFromMechanics(c,k); }
function attributeCap(c,k){ let cap=ATTRIBUTE_CAP_BASE; if(c.originId==='restringido' && RESTRINGIDO_PHYSICAL_ATTRS.includes(k)) cap=ATTRIBUTE_CAP_ITEM; if(c.originId==='derivado' && c.choices?.[DERIVADO_LIMIT_ATTR_KEY]===k) cap += Math.floor(Number(c.level||1)/4); if(hasTalentByName(c,'Incremento De Atributo') && c.choices?.talentIncrementAttr===k) cap += 2; if(hasTalentByName(c,'Quebra De Limites') && getSelectedArrayChoice(c,'quebraLimitesAttrs').includes(k)) cap += 2; if(hasEscolhidoVow(c,'hb_filho_do_adulterio') && c.choices?.filhoAdulterioAttr===k) cap=Math.max(cap,24); if(equippedAttrItem(c,k)) cap=ATTRIBUTE_CAP_ITEM; return Math.min(ATTRIBUTE_CAP_ITEM, cap); }
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
function finalAttr(c,k){ if(hasEscolhidoVow(c,'hb_filho_do_adulterio') && (k==='strength'||k==='constitution')) return 4; const raw=rawFinalAttr(c,k); if(raw==null) return null; return Math.min(raw, attributeCap(c,k)); }
function trainingBonus(level){ return level>=17?6:level>=13?5:level>=9?4:level>=5?3:2; }
function specialization(c){ return rules.specializations.find(s=>s.id===c.specializationId); }
function origin(c){ return ALL_ORIGINS.find(o=>o.id===c.originId); }

function selectedManualSkills(c){ return c.choices?.skills || []; }
function talentGrantedSkills(c){ const out=[]; if(hasTalentByName(c,'Tempestade De Ideias') && c.choices?.tempestadeSkill) out.push(c.choices.tempestadeSkill); if(hasTalentByName(c,'Artesão Amaldiçoado') && c.choices?.artesaoOficio) out.push('oficio'); return [...new Set(out)]; }




function accessoryBonus(c,type){
  let bonus=0; for(const i of c.inventory.items.filter(x=>x.equipped)){ const t=(i.originalText||'').toLowerCase(); if(type==='hp' && t.includes('pontos de vida máximos aumentam em 10')) bonus+=10; if(type==='hp' && t.includes('pontos de vida máximos aumentam em 20')) bonus+=20; if(type==='defense' && t.includes('+2 na defesa')) bonus+=2; if(type==='attention' && t.includes('percepção')) bonus+=2; }
  return bonus;
}

function inventorySpaces(c){ return c.inventory.items.reduce((sum,i)=>sum+(Number(i.spaces)||0)*(Number(i.qty)||1),0); }
function inventoryMax(c){ const f=mod(finalAttr(c,'strength')); return 8 + f*2 + Number(c.inventory.extraSpaces||0); }

function hasOriginDependentChoices(c){ return Object.values(c.choices?.originBonuses||{}).some(Boolean) || Object.values(c.choices?.originBonusAlloc||{}).some(v=>Number(v)>0) || !!c.choices?.herdadoClan; }
function trainableSkills(){ return rules.skills.filter(s=>s.id!=='iniciativa' && s.name!=='Iniciativa'); }
function resistanceName(id){ return RESISTANCES.find(r=>r[0]===id)?.[1] || id; }
function skillName(id){ return rules.skills.find(s=>s.id===id)?.name || id; }

function extraSkillAttributeMod(c){ const attr=c.choices?.extraSkillAttribute; if(attr!=='intelligence' && attr!=='wisdom') return 0; return Math.max(0, mod(finalAttr(c,attr))); }
function extraSkillMasterCount(c){ return Math.min(Math.max(0,Math.floor(Number(c.choices?.extraSkillMasterCount)||0)), extraSkillAttributeMod(c)); }
function extraSkillSlots(c){ return extraSkillAttributeMod(c) - extraSkillMasterCount(c); }




function aptitudeLevelPointLimit(c){ const lvl=Number(c.level||1); return Math.floor(lvl/2) + (lvl>=10?1:0) + (lvl>=20?1:0); }
function getAptitudeLevels(c){ return {Aura:0,'Controle e Leitura':0,Barreira:0,'Domínio':0,'Energia Reversa':0,...(c.choices.aptitudeLevels||{})}; }
function aptitudeLevelTotal(c){ return Object.values(getAptitudeLevels(c)).reduce((a,b)=>a+Number(b||0),0); }
function aptitudeLevelFor(c, group){ return Number(getAptitudeLevels(c)[group]||0); }
function getPrereqText(item){ const m=String(item.originalText||'').match(/\[Pré-Requisito:([^\]]+)\]/i); return m ? m[1].trim() : ''; }
function attrFromName(n){ const x=String(n||'').toLowerCase(); if(x.includes('força')) return 'strength'; if(x.includes('destreza')) return 'dexterity'; if(x.includes('constituição')) return 'constitution'; if(x.includes('inteligência')) return 'intelligence'; if(x.includes('sabedoria')) return 'wisdom'; if(x.includes('presença')) return 'presence'; return null; }
function aptitudeCategory(item){ const n=(item.name||'').toLowerCase(), t=((item.originalText||'')+' '+n).toLowerCase(); if(n.startsWith('aura')||n.includes('aura')||n.includes('afinidade ampliada')||n.includes('absorção elemental')) return 'Aura'; if(t.includes('barreira')) return 'Barreira'; if(t.includes('domínio')||t.includes('dominio')) return 'Domínio'; if(t.includes('energia reversa')||t.includes('reversa')) return 'Energia Reversa'; if(t.includes('controle')||t.includes('leitura')||t.includes('fluxo')||t.includes('detectar')) return 'Controle e Leitura'; return 'Outras'; }
const SPEC_AUTO_APTITUDES = {
  suporte: [
    {id:'apt_energia_reversa', level:6},
    {id:'apt_liberação_de_energia_reversa', level:8},
  ],
};
function specAutoAptitudeGrants(c){
  const sp=specialization(c);
  const list=SPEC_AUTO_APTITUDES[sp?.id]||[];
  return list.map(g=>({...g, item:rules.aptitudes.find(a=>a.id===g.id), unlocked:Number(c.level||1)>=g.level})).filter(g=>g.item);
}
function specAutoAptitudeUnlockedIds(c){ return specAutoAptitudeGrants(c).filter(g=>g.unlocked).map(g=>g.id); }
function effectiveAptitudeIds(c){ return [...new Set([...(c.choices.aptitudes||[]), ...specAutoAptitudeUnlockedIds(c)])]; }
function aptitudeRequirementStatus(c,item){ const req=getPrereqText(item); if(!req) return {ok:true, req:''}; const problems=[]; const lvl=(String(req).match(/Nível\s*(\d+)/i)||[])[1]; if(lvl && Number(c.level)<Number(lvl)) problems.push(`Nível ${lvl}`); const apt=(String(req).match(/Nível de Aptidão em ([^0-9]+)\s*(\d+)/i)||[]); if(apt.length){ let group=apt[1].trim(); if(/aura/i.test(group)) group='Aura'; else if(/barreira/i.test(group)) group='Barreira'; else if(/domínio|dominio/i.test(group)) group='Domínio'; else if(/reversa/i.test(group)) group='Energia Reversa'; else if(/controle|leitura/i.test(group)) group='Controle e Leitura'; if(aptitudeLevelFor(c,group)<Number(apt[2])) problems.push(`${group} ${apt[2]}`); } const trained=(String(req).match(/Treinado em ([^,\]]+)/i)||[])[1]; if(trained){ const wanted=trained.trim().toLowerCase(); const ok=(c.choices.skills||[]).some(id=>skillName(id).toLowerCase().includes(wanted)); if(!ok) problems.push(`Treinado em ${trained.trim()}`); } const attrReqs=[...String(req).matchAll(/(Força|Destreza|Constituição|Inteligência|Sabedoria|Presença)\s*(\d+)/gi)]; for(const m of attrReqs){ const k=attrFromName(m[1]); if(k && (finalAttr(c,k)||0)<Number(m[2])) problems.push(`${m[1]} ${m[2]}`); } const names=effectiveAptitudeIds(c).map(id=>rules.aptitudes.find(a=>a.id===id)?.name?.toLowerCase()).filter(Boolean); for(const a of rules.aptitudes){ if(req.toLowerCase().includes(a.name.toLowerCase()) && !names.includes(a.name.toLowerCase())) problems.push(a.name); } return {ok:problems.length===0, req, problems}; }
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

function parseSpecLevelGains(text=''){ const gains={}; String(text||'').split(/\n/).map(x=>x.trim()).forEach(line=>{ const m=line.match(/^(\d+)[º°]?\s+(.+)$/i); if(m){ const lvl=Number(m[1]); if(lvl>=1&&lvl<=20) gains[lvl]=m[2].trim(); }}); return gains; }

function extractSpecUnlocks(text,lvl){ const out=[]; const patterns=[`No nível ${lvl}`,`No ${lvl}º nível`,`Nos níveis ${lvl}`]; for(const p of patterns){ const idx=String(text).indexOf(p); if(idx>=0) out.push(String(text).slice(idx,idx+180).replace(/\s+/g,' ').trim()); } return out.slice(0,3); }
function usePersist(state){ useEffect(()=>{ const persist={...state}; delete persist.credits; delete persist.firstFreeUsed; delete persist.creditPassword; delete persist.toast; localStorage.setItem(STORAGE_KEY, JSON.stringify(persist)); localStorage.setItem(CREDIT_STORAGE_KEY, JSON.stringify({credits:state.credits, firstFreeUsed:state.firstFreeUsed, creditPassword:state.creditPassword})); },[state]); }
function Tooltip({text}){ const [open,setOpen]=useState(false); return <span className="tip"><button onClick={()=>setOpen(!open)} className="q">?</button>{open&&<span className="tipbox">{text}</span>}</span>; }
function ModalText({title,text,onClose}){ return <div className="modalOverlay" onClick={onClose}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modalHead"><h2>{title}</h2><button onClick={onClose}>Fechar</button></div><div className="modalText">{String(text||'').split(/\n{2,}|(?=•)/).filter(Boolean).map((p,i)=><p key={i}>{p.trim()}</p>)}</div></div></div>; }
function CreditAdminButton({state,dispatch}){
  const [open,setOpen]=useState(false);
  const [pw,setPw]=useState('');
  const [amount,setAmount]=useState(1);
  const [masterPw,setMasterPw]=useState('');
  const [newPw,setNewPw]=useState('');
  const [msg,setMsg]=useState(null);
  const close=()=>{ setOpen(false); setPw(''); setMasterPw(''); setNewPw(''); setMsg(null); };
  const addCredits=()=>{
    if(pw!==(state.creditPassword||CREDIT_PASSWORD_DEFAULT)){ setMsg({bad:true,text:'Senha incorreta.'}); return; }
    const amt=Math.max(0,Math.floor(Number(amount)||0));
    if(!amt){ setMsg({bad:true,text:'Informe uma quantidade válida.'}); return; }
    dispatch({type:'addCredits',password:pw,amount:amt});
    setMsg({bad:false,text:`+${amt} crédito(s) adicionado(s).`});
    setPw('');
  };
  const changePassword=()=>{
    if(masterPw!==CREDIT_MASTER_PASSWORD){ setMsg({bad:true,text:'Senha mestra incorreta.'}); return; }
    if(!newPw.trim()){ setMsg({bad:true,text:'Informe a nova senha.'}); return; }
    dispatch({type:'changeCreditPassword',masterPassword:masterPw,newPassword:newPw.trim()});
    setMsg({bad:false,text:'Senha de créditos alterada.'});
    setMasterPw(''); setNewPw('');
  };
  const modal=<div className="modalOverlay" onClick={close}><div className="modal creditModal" onClick={e=>e.stopPropagation()}>
      <div className="modalHead"><h2>Administrar créditos</h2><button onClick={close}>Fechar</button></div>
      <div className="modalText creditAdmin">
        <h3>Adicionar créditos</h3>
        <div className="grid2">
          <Field label="Senha"><input type="password" value={pw} onChange={e=>setPw(e.target.value)}/></Field>
          <Field label="Quantidade"><input type="number" min="1" value={amount} onChange={e=>setAmount(e.target.value)}/></Field>
        </div>
        <button onClick={addCredits}>Adicionar créditos</button>
        <hr/>
        <h3>Trocar senha de créditos</h3>
        <p className="muted small">Requer a senha mestra (do dono). A nova senha passa a valer para adicionar créditos.</p>
        <div className="grid2">
          <Field label="Senha mestra"><input type="password" value={masterPw} onChange={e=>setMasterPw(e.target.value)}/></Field>
          <Field label="Nova senha de créditos"><input value={newPw} onChange={e=>setNewPw(e.target.value)}/></Field>
        </div>
        <button onClick={changePassword}>Trocar senha</button>
        {msg && <div className={msg.bad?'bad small':'notice good'}>{msg.text}</div>}
      </div>
    </div></div>;
  return <>
    <button className="q mini" title="Administrar créditos" onClick={()=>setOpen(true)}><Lock size={14}/></button>
    {open && createPortal(modal, document.body)}
  </>;
}
function App(){ const [state,dispatch]=useReducer(reducer,undefined,initialState); usePersist(state); const c=state.characters.find(x=>x.id===state.activeCharacterId)||state.characters[0]; const stats=calc(c); const tasks=validation(c); const pending=tasks.filter(t=>!t.ok); const [showMobile,setShowMobile]=useState(false);
  return <div className="app"><header className="top"><div><h1>Feiticeiros & Maldições</h1><p>Ficha automatizada · criação guiada · compêndio interno · banco comunitário de técnicas</p></div><div className="topActions"><span className="pill"><Coins size={16}/> {state.credits} créditos</span><CreditAdminButton state={state} dispatch={dispatch}/><select value={c.id} onChange={e=>dispatch({type:'selectCharacter',id:e.target.value})}>{state.characters.map(ch=><option key={ch.id} value={ch.id}>{ch.name||'Personagem sem nome'}</option>)}</select><button onClick={()=>dispatch({type:'newCharacter'})}>Novo</button><button onClick={()=>downloadState(state)}>Exportar</button><label className="button">Importar<input type="file" hidden accept=".json" onChange={e=>importFile(e,dispatch)}/></label><button className="danger" onClick={()=>confirm('Resetar dados locais?')&&dispatch({type:'reset'})}>Reset local</button></div></header>
  <nav className="tabs"><button className="hamb" onClick={()=>setShowMobile(!showMobile)}>{showMobile?'Ocultar abas':'Mostrar abas'}</button><div className={showMobile?'tabsInner open':'tabsInner'}>{TABS.map(t=><button key={t} className={state.activeTab===t?'active':''} onClick={()=>dispatch({type:'tab',tab:t})}>{t}{t==='Criação Guiada'&&pending.length?<b>{pending.length}</b>:null}</button>)}</div></nav>
  {pending.length>0 && <div className="pendingBar"><AlertTriangle size={18}/><b>Ficha com {pending.length} pendências.</b>{pending.slice(0,5).map(p=><span key={p.id}>{p.label}{p.tab&&<button onClick={()=>dispatch({type:'tab',tab:p.tab})}>Ir</button>}</span>)}</div>}
  <main>{state.activeTab==='Criação Guiada'&&<Creation c={c} state={state} dispatch={dispatch} tasks={tasks}/>} {state.activeTab==='Ficha/Combate'&&<CombatSheet c={c} dispatch={dispatch} stats={stats}/>} {state.activeTab==='Valores'&&<Values c={c} dispatch={dispatch} stats={stats}/>} {state.activeTab==='Registro e Inventário'&&<Inventory c={c} dispatch={dispatch}/>} {state.activeTab==='Perfil Mundano'&&<Mundane c={c} dispatch={dispatch}/>} {state.activeTab==='Perfil Amaldiçoado'&&<Cursed c={c} dispatch={dispatch}/>} {state.activeTab==='Perfil Restrito'&&<Restricted c={c} dispatch={dispatch}/>} {state.activeTab==='Bônus de Interlúdio'&&<Interlude c={c} dispatch={dispatch}/>} {state.activeTab==='Invocações'&&<Summons c={c} dispatch={dispatch}/>} {state.activeTab==='Técnicas'&&<TechniqueBank c={c} state={state} dispatch={dispatch}/>} {state.activeTab==='Level Up'&&<LevelUp c={c} dispatch={dispatch}/>} {state.activeTab==='Compêndio'&&<Compendium/>} {state.activeTab==='Admin'&&<Admin state={state}/>}</main><Toast toast={state.toast} dispatch={dispatch}/></div> }
function Toast({toast,dispatch}){
  useEffect(()=>{ if(!toast) return; const t=setTimeout(()=>dispatch({type:'clearToast',id:toast.id}), 2600); return ()=>clearTimeout(t); },[toast, dispatch]);
  if(!toast) return null;
  return createPortal(<div className="toastWrap"><div className={`toast ${toast.kind||'good'}`}><CheckCircle2 size={16}/><span>{toast.text}</span></div></div>, document.body);
}
function Field({label,children,help}){ return <label className="field"><span>{label}{help&&<Tooltip text={help}/>}</span>{children}</label> }
function Select({value,onChange,children}){ return <select value={value||''} onChange={e=>onChange(e.target.value)}>{children}</select> }

function LimitedChoiceGrid({title,items,selected,onChange,limit=999,requirementCheck}){ return <div><h3>{title}</h3><div className="choiceGrid">{items.map(i=>{ const checked=selected.includes(i.id); const req=requirementCheck?requirementCheck(i):{ok:true,problems:[]}; const limitReached=!checked && selected.length>=limit; const blocked=limitReached || (!checked && !req.ok); const info=i.originalText||i.tooltip||SKILL_HELP[i.id]||RESISTANCE_HELP[i.id]||'Esta opção é válida para esta escolha.'; const warnText=!req.ok?`Bloqueado: ${(req.problems||[]).join(', ')}`:(limitReached?'Limite atingido':''); return <label key={i.id} className={blocked?'check blocked':'check'} title={warnText}><input type="checkbox" checked={checked} disabled={blocked} onChange={e=>onChange(e.target.checked?[...selected,i.id]:selected.filter(x=>x!==i.id))}/>{i.name}<Tooltip text={info}/>{bookPageIndex[i.id]&&<BookPageButton pageNumber={bookPageIndex[i.id]} title={i.name}/>}{warnText&&<small className="warn">{warnText}</small>}</label>})}</div></div> }
function ChoiceGrid({title,items,selected,onChange,limit=999}){ return <LimitedChoiceGrid title={title} items={items} selected={selected} onChange={onChange} limit={limit}/> }
function RuleBox({title,text}){ const [open,setOpen]=useState(false); const formatted=useMemo(()=>formatRuleText(text||''),[text]); return <div className="ruleBox readable"><h3>{title}</h3><p>{formatted.slice(0,900)}{formatted.length>900?'...':''}</p>{formatted.length>900&&<button onClick={()=>setOpen(true)}>Ver texto completo</button>}{open&&<ModalText title={title} text={formatted} onClose={()=>setOpen(false)}/>}</div> }
const FLAVOR_SKIP_RE = /(\d|bônus|recebe|ganha|ganham|torna[- ]se|treinado|treinada|PV\b|PE\b|CD\b|teste de|Teste de|dano|nível|ação bônus|ação comum|ação completa|reação|vantagem|desvantagem|redução|resistência|Defesa|Iniciativa|Atenção|escolha|escolhe)/;
function mechanicalPreview(text, maxLen=280){
  const formatted = formatRuleText(text||'');
  if(!formatted) return '';
  const sentences = formatted.split(/(?<=[.!?])\s+/).filter(Boolean);
  if(sentences.length<=1) return formatted.length>maxLen ? formatted.slice(0,maxLen)+'...' : formatted;
  let startIdx = 0;
  while(startIdx < sentences.length-1 && startIdx < 2 && !FLAVOR_SKIP_RE.test(sentences[startIdx])) startIdx++;
  const trimmed = sentences.slice(startIdx).join(' ').trim() || formatted;
  return trimmed.length>maxLen ? trimmed.slice(0,maxLen)+'...' : trimmed;
}
const ORIGIN_SUMMARY = {
  inato: {
    bonuses: ['+2 em um atributo e +1 em outro, à sua escolha.', 'Talento Natural: 1 talento à escolha no 1º nível; +1 talento adicional (uma única vez) a partir do 4º nível ao subir de nível.', 'Marca Registrada: +1 Feitiço adicional, com custo reduzido em 1 PE.'],
    playstyle: 'Origem mais genérica e versátil — combina com qualquer especialização/conceito e já sai na frente com um talento extra logo no 1º nível.'
  },
  herdado: {
    bonuses: ['Bônus de atributo, perícias e herança dependem 100% do clã escolhido (Gojo, Inumaki, Kamo ou Zenin).', 'Escolha o clã no painel abaixo para liberar os bônus reais.'],
    playstyle: 'Sua técnica e seu foco vêm da linhagem do clã — a escolha do clã é a decisão mais importante desta origem.'
  },
  derivado: {
    bonuses: ['+2 em um atributo e +1 em outro, à sua escolha.', '1 Aptidão Amaldiçoada de Aura (precisa cumprir os pré-requisitos dela).', 'Energia Antinatural: 1x/dia, ação bônus em combate, recupera PE = 2x seu bônus de treinamento.', 'A cada 4 níveis: +1 ponto e +1 no limite de atributo, no atributo que você escolher.'],
    playstyle: 'Cresce de forma inesperada e desbalanceada, quebrando o limite normal de atributo em um único foco escolhido.'
  },
  restringido: {
    bonuses: ['Força, Destreza e Constituição +1; mais 2 pontos livres entre atributos físicos.', 'Deslocamento +3m; imune a doenças mundanas; vantagem contra venenos.', 'Em descanso curto, cura dados adicionais = metade do bônus de treinamento.', 'Limite de Força/Destreza/Constituição sobe para 30 (em vez de 20); a cada 6 níveis, +2 em um desses atributos.', 'Redução de dano (usos por descanso longo = bônus de treinamento) ou evitar 1 desmembramento.'],
    playstyle: 'Zero energia amaldiçoada — tudo é físico, armas e Domínio Simples. Só pode usar a especialização Restringido (não há outra opção).'
  },
  'feto_amaldiçoado_híbrido': {
    bonuses: ['+2 em um atributo e +1 em outro, à sua escolha.', '1 Característica de Anatomia à escolha; +1 característica a cada 5 níveis.', 'Cura recebida de energia reversa é reduzida à metade (mas pode converter para energia amaldiçoada, gastando 2 PE, para curar o valor cheio).', 'Vigor Maldito: 1x/descanso longo, ação bônus, cura 5 + mod. Constituição (mais usos e valor nos níveis 4/8/12).'],
    playstyle: 'Meio humano, meio maldição — a build muda bastante conforme as Características de Anatomia escolhidas ao longo dos níveis.'
  },
  'sem_técnica': {
    bonuses: ['4 pontos de atributo livres, máx. 3 no mesmo atributo.', 'Treinado em 2 perícias à escolha (Estudos Dedicados).', 'Empenho Implacável: talento OU aptidão nos níveis 1 e 10; bônus crescente em 2 perícias + 1 ataque/TR nos níveis 3/13/17; habilidade de especialização extra nos níveis 6/15/19.', 'No 4º nível: ganha o Novo Estilo da Sombra (equivalente a uma técnica) + a aptidão Domínio Simples.'],
    playstyle: 'Sem técnica amaldiçoada nem Feitiços, e não pode ser Especialista em Técnicas — compensa com talentos, perícias e o estilo de combate do Domínio Simples.'
  },
  'corpo_amaldiçoado_mutante': {
    bonuses: ['2 pontos de atributo livres para distribuir.', 'Imune a dano venenoso e à condição Envenenado (mas não recebe cura de refeições nem itens de Medicina).', '3 núcleos com atributos/PV/PE próprios — escolha 1 como Núcleo Primário; trocar de núcleo ativo em combate é Ação Bônus.'],
    playstyle: 'Joga como três "formas" alternáveis em combate — mais complexo de gerenciar, mas muito flexível.'
  },
  hb_o_escolhido: {
    bonuses: ['4 pontos de atributo livres, máx. 3 no mesmo atributo.', 'Aquele Abençoado por Deus: +1 PV por nível (+2/nível a partir do 10º); treinado em 2 perícias adicionais.', 'Empenho Implacável idêntico ao de Sem Técnica (talento/aptidão nos níveis 1 e 10, bônus em perícias/ataque-TR, habilidades extras).', 'No 4º nível: ganha o estilo "Tocado por Deus" + Domínio Simples + talentos exclusivos de O Escolhido.'],
    playstyle: 'Variante temática de Sem Técnica inspirada em Sir Galahad — cavaleiro sagrado com Excalibur e a armadura Dama Do Lago. Conteúdo homebrew, não é do livro oficial.'
  }
};
const SPEC_SUMMARY = {
  lutador: {
    bonuses: ['PV: 12 + mod. Constituição no 1º nível; +1d10 (ou 6 fixo) + mod. Constituição por nível.', 'Treinado em Armas Simples, Marciais e Escudo Leve; TR de Fortitude ou Reflexos; 1 perícia de Ofício + escolha entre Atletismo ou Acrobacia + 3 livres.', '4 PE por nível. Atributo-chave: Força ou Destreza.', 'Corpo Treinado: ataque desarmado extra como Ação Bônus; dano desarmado 1d8, subindo até 1d12 nos níveis 5/9/13/17.'],
    playstyle: 'Linha de frente corpo a corpo, ágil e resistente — foco em socos, chutes e armas marciais.'
  },
  especialista_combate: {
    bonuses: ['PV: 12 + mod. Constituição no 1º nível; +1d10 (ou 6 fixo) + mod. Constituição por nível.', 'Treinado em todas as armas e escudos; TR de Fortitude ou Reflexos; 2 perícias de Ofício + escolha entre Atletismo ou Acrobacia + 3 livres.', '4 PE por nível. Atributo-chave: Força, Destreza ou Sabedoria.', 'Repertório do Especialista: escolhe 1 estilo de combate no 1º nível (Defensivo, Arremessador, Duelista...) que melhora em níveis altos.'],
    playstyle: 'Combatente versátil e tático — o estilo escolhido muda bastante como a build joga (defesa, arremesso, duelo, etc.).'
  },
  especialista_tecnica: {
    bonuses: ['PV: 10 + mod. Constituição no 1º nível; +1d8 (ou 5 fixo) + mod. Constituição por nível.', 'Treinado em Armas Simples e a Distância; TR de Astúcia ou Vontade; já começa treinado em Feitiçaria e Ocultismo de graça; +2 perícias de Ofício (2 ofícios diferentes) + 2 livres.', '6 PE por nível + mod. do atributo de técnica. Atributo-chave: Inteligência ou Sabedoria.', 'Domínio dos Fundamentos: 2 "Mudanças de Fundamento" no 1º nível (+1 no 12º), que alteram como seus Feitiços funcionam.'],
    playstyle: 'Foco total em potencializar e customizar a própria técnica amaldiçoada. Não pode ser origem Sem Técnica ou O Escolhido.'
  },
  controlador: {
    bonuses: ['PV: 10 + mod. Constituição no 1º nível; +1d8 (ou 5 fixo) + mod. Constituição por nível.', 'Treinado em Armas Simples e a Distância; TR de Astúcia ou Vontade; já começa treinado em Percepção e Persuasão de graça; +1 perícia de Ofício + 2 livres.', '5 PE por nível + mod. do atributo de técnica. Atributo-chave: Presença ou Sabedoria.', 'Treinamento em Controle: começa com 2 Invocações (mais em vários níveis) e +1 invocação ativa simultânea.'],
    playstyle: 'Joga através de invocações (shikigamis ou corpos amaldiçoados) — combate indireto, posicional e de controle de campo.'
  },
  suporte: {
    bonuses: ['PV: 10 + mod. Constituição no 1º nível; +1d8 (ou 5 fixo) + mod. Constituição por nível.', 'Treinado em Armas Simples e Escudos; TR de Astúcia ou Vontade; já começa treinado em Medicina e Prestidigitação de graça; +2 perícias de Ofício (2 ofícios diferentes) + 3 livres.', '5 PE por nível + mod. do atributo de técnica. Atributo-chave: Presença ou Sabedoria.', 'Suporte em Combate: cura por Ação Bônus (2d6 + Presença/Sabedoria, escalando até 6d10 no nível 16).'],
    playstyle: 'Cura e fortalece o grupo — joga em torno de manter os aliados de pé e amplificar o que eles fazem.'
  },
  restringido: {
    bonuses: ['PV: 16 + mod. Constituição no 1º nível (o maior PV base do jogo); +1d12 (ou 7 fixo) + mod. Constituição por nível.', 'Treinado em todas as armas e escudos; TR de Fortitude E Reflexos (as duas); 1 perícia de Ofício + 4 livres, exceto Feitiçaria.', 'Sem PE — usa Pontos de Estamina (baseados em Força/Constituição).', 'Restrito pelos Céus: soma Força ou Constituição na Defesa (limitado pelo nível); ferramenta amaldiçoada inicial; Arsenal Amaldiçoado a partir do 2º nível; 1 Dádiva do Céu a cada 4 níveis.'],
    playstyle: 'Combatente puramente marcial e sobre-humano. Só existe junto da origem Restringido — não é possível escolher separadamente.'
  }
};
function MechanicalSummary({title,summary,fallbackText}){
  const [open,setOpen]=useState(false);
  if(!summary) return <RuleBox title={title} text={fallbackText}/>;
  return <div className="ruleBox readable mechSummary">
    <h3>{title}</h3>
    <ul className="bonusList">{summary.bonuses.map((b,i)=><li key={i}>{b}</li>)}</ul>
    {summary.playstyle && <p className="playstyleNote"><b>Como jogar:</b> {summary.playstyle}</p>}
    {fallbackText && <button onClick={()=>setOpen(true)}>Ler descrição/lore completa</button>}
    {open && <ModalText title={title} text={formatRuleText(fallbackText||'')} onClose={()=>setOpen(false)}/>}
  </div>;
}
function Panel({title,children,help}){ const [open,setOpen]=useState(true); return <section className={open?'panel':'panel collapsed'}><h2 className="panelHead"><span className="panelToggle" onClick={()=>setOpen(o=>!o)}>{open?<ChevronUp size={18}/>:<ChevronDown size={18}/>}{title}</span>{help&&<Tooltip text={help}/>}</h2>{open&&<div className="panelBody">{children}</div>}</section> }
function Stat({label,value,icon}){ return <div className="stat">{icon}<span>{label}</span><b>{value}</b></div> }

function Resource({label,current,max,temp}){ return <div className="resource"><h3>{label}</h3><b>{current}/{max}</b><small>Temp. {temp||0}</small><div className="bar"><i style={{width:`${Math.max(0,Math.min(100,(max?current/max:0)*100))}%`}}/></div></div> }
function Values({c,dispatch,stats}){ const trained=selectedTrainedSkills(c); const master=selectedMasterSkills(c); return <section className="sheetLike"><Panel title="Valores"><div className="valuesLayout"><div><h3>Testes e Perícias</h3><table><tbody>{trainableSkills().map(s=><tr key={s.id}><td>{s.name}</td><td>{ATTR_LABEL[s.attribute]}</td><td>{master.includes(s.id)?'Mestre':trained.includes(s.id)?'Treinado':'-'}</td><td><b>{signed(stats.skillMap[s.id]||0)}</b></td></tr>)}</tbody></table></div><div><h3>Testes de Resistência</h3><table><tbody>{RESISTANCES.map(([id,name])=><tr key={id}><td>{name}</td><td>{(c.choices.resistances||[]).includes(id)?(restringidoMasterResistances(c).includes(id)?'Mestre':'Treinado'):'-'}</td><td><b>{signed(stats.resMap?.[id]||0)}</b></td></tr>)}</tbody></table></div><div><h3>Atributos</h3><div className="attrOrbit">{ATTRS.map(([k,l,abbr])=><div key={k} className="orb"><span>{abbr}</span><b>{finalAttr(c,k)??0}</b><small>{signed(mod(finalAttr(c,k)))}</small></div>)}</div></div><div><h3>Defesas e Recursos</h3><Stat label="Defesa" value={stats.defense}/><Stat label="RD" value={stats.rd}/>{stats.cd!=null&&<Stat label="CD" value={stats.cd}/>}<Stat label="Atenção" value={stats.attention}/><Stat label="Iniciativa" value={signed(stats.initiative)}/><Stat label="Movimento" value={`${stats.movement}m`}/>{stats.attackBonus>0&&<Stat label="Bônus extra de acerto" value={signed(stats.attackBonus)}/>}{stats.damageBonus>0&&<Stat label="Bônus extra de dano" value={signed(stats.damageBonus)}/>}</div></div></Panel><Panel title="Registro Rápido">{c.inventory.items.filter(i=>i.equipped&&(i.type==='weapon'||i.type==='shield')).map(i=><WeaponCard key={i.instanceId} item={i} compact/> )}</Panel></section> }


function CatalogGroup({title,items,dispatch}){ const [open,setOpen]=useState(title==='Armas'); const [modal,setModal]=useState(null); return <div className="catalogGroup"><h3 onClick={()=>setOpen(!open)}>{open?<ChevronUp/>:<ChevronDown/>}{title} <small>{items.length}</small></h3>{open&&<div className="catalogButtons">{items.map(i=><span key={i.id} className="catalogPick"><button onClick={()=>dispatch({type:'addItem',item:i})}>{i.name}<small>C{i.cost??0} · E{i.spaces??0}</small></button><button className="q mini" onClick={()=>setModal(i)}>?</button></span>)}</div>}{modal&&<ModalText title={modal.name} text={formatRuleText(modal.originalText||'Sem descrição cadastrada.')} onClose={()=>setModal(null)}/>}</div> }
function WeaponCatalogList({items,dispatch,character,setModal}){
  return <div className="catalogButtons">{items.map(i=>{
    const mastered=!character || hasWeaponMastery(character,i);
    return <span key={i.id} className={mastered?'catalogPick':'catalogPick unmastered'}>
      <button onClick={()=>dispatch({type:'addItem',item:i})} title={mastered?'':'Sua especialização atual não tem maestria nesta arma.'}>{!mastered && <AlertTriangle size={12}/>}{i.name}<small>C{i.cost??0} · E{i.spaces??0}</small></button>
      <button className="q mini" onClick={()=>setModal(i)}>?</button>
    </span>;
  })}</div>;
}
function WeaponCatalogGroup({items,dispatch,character}){
  const [open,setOpen]=useState(true);
  const [modal,setModal]=useState(null);
  const simples=items.filter(i=>String(i.category||'').toLowerCase().includes('simples'));
  const complexas=items.filter(i=>!String(i.category||'').toLowerCase().includes('simples'));
  return <div className="catalogGroup">
    <h3 onClick={()=>setOpen(!open)}>{open?<ChevronUp/>:<ChevronDown/>}Armas <small>{items.length}</small></h3>
    {open && <>
      <div className="weaponCategoryBlock">
        <h4>Armas Simples <small>{simples.length}</small></h4>
        <p className="muted small">Prós: fáceis de conseguir e leves; toda especialização já tem maestria nelas, sem risco de penalidade. Contras: dano e propriedades geralmente mais fracos que os das armas complexas.</p>
        <WeaponCatalogList items={simples} dispatch={dispatch} character={character} setModal={setModal}/>
      </div>
      <div className="weaponCategoryBlock">
        <h4>Armas Complexas <small>{complexas.length}</small></h4>
        <p className="muted small">Prós: dano e propriedades melhores. Contras: exigem maestria específica ("Armas Marciais", "Armas a Distância" ou "Todas as armas") — as marcadas com <AlertTriangle size={12}/> não têm maestria pela sua especialização atual; equipá-las sem treino normalmente gera penalidade (confirme com o Mestre) e o app avisa na Ficha/Combate.</p>
        <WeaponCatalogList items={complexas} dispatch={dispatch} character={character} setModal={setModal}/>
      </div>
    </>}
    {modal&&<ModalText title={modal.name} text={formatRuleText(modal.originalText||'Sem descrição cadastrada.')} onClose={()=>setModal(null)}/>}
  </div>;
}


function detectSpecMilestones(text=''){ const out=[]; String(text).split(/\n/).forEach(line=>{ if(/No (primeiro|\d|\d+º)|Nos níveis|No nível/.test(line) && line.length<240) out.push(line.trim()); }); return out.slice(0,20); }

function Cursed({c,dispatch}){
  const groups=groupAptitudes(); const max=aptitudeLimit(c); const lvlMax=aptitudeLevelPointLimit(c); const lvlUsed=aptitudeLevelTotal(c); const levels=getAptitudeLevels(c); const cfg=specTrainingConfig(c);
  const autoGrants=specAutoAptitudeGrants(c); const autoIds=new Set(autoGrants.map(g=>g.id));
  return <section className="grid gap"><Panel title="Aspectos de Técnica e Aptidões"><div className="grid2"><div className="miniPanel"><h3>Aspectos de Técnica</h3><Stat label="Nível de Habilidades" value="1º"/><Stat label="Habilidades Conhecidas" value={(c.technique.passives.length+c.technique.actives.length)}/><Field label="Atributo de Técnica" help="Mesmo Atributo de CD escolhido em Criação Guiada — as opções seguem a especialização atual."><Select value={c.cdAttribute} onChange={v=>dispatch({type:'update',key:'cdAttribute',value:v})}><option value="">—</option>{ATTRS.filter(([k])=>cfg.cdAttributes.includes(k)).map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select></Field></div><div className="miniPanel"><h3>Níveis de Aptidão</h3><p className="muted">Distribuídos: {lvlUsed}/{lvlMax}. Cada aptidão vai de 0 a 5. Nível 1 começa com tudo 0.</p>{['Aura','Controle e Leitura','Barreira','Domínio','Energia Reversa'].map(g=><div key={g} className="aptLevelRow"><span>{g}</span><div><button disabled={levels[g]<=0} onClick={()=>dispatch({type:'setAptitudeLevel',key:g,value:levels[g]-1})}>−</button><b>{levels[g]}</b><button disabled={levels[g]>=5||lvlUsed>=lvlMax} onClick={()=>dispatch({type:'setAptitudeLevel',key:g,value:levels[g]+1})}>+</button></div><Tooltip text={aptitudeHelp(g)}/></div>)}</div></div></Panel><Panel title={`Aptidões Amaldiçoadas: ${(c.choices.aptitudes||[]).length} / ${max}`}><p className="muted">Você recebe uma aptidão amaldiçoada sempre que sobe de nível, exceto Restringido. O app bloqueia excesso e sinaliza pré-requisitos detectados no texto.</p>{autoGrants.length>0&&<div className="notice good"><b>Aptidões automáticas da especialização (não gastam sua vaga normal):</b>{autoGrants.map(g=><div key={g.id} className={g.unlocked?'':'muted small'}>{g.item.name} — {g.unlocked?'liberada':`libera no nível ${g.level}`}</div>)}</div>}{Object.entries(groups).map(([group,items])=>{ const visible=items.filter(i=>!autoIds.has(i.id)); return <details key={group} open={group==='Aura'}><summary>{group} · {visible.length}</summary><ChoiceCards items={visible} selected={c.choices.aptitudes||[]} limit={max} character={c} onChange={arr=>dispatch({type:'choice',key:'aptitudes',value:clampSelection(arr,rules.aptitudes.map(a=>a.id),max)})}/></details>; })}</Panel><Panel title="Técnica"><TechniqueEditor c={c} dispatch={dispatch}/></Panel></section>;
}
function aptitudeHelp(g){ return ({Aura:'Conhecimento e compreensão sobre a própria energia amaldiçoada.', 'Controle e Leitura':'Liberar, controlar e ler fluxos/aura de energia.', Barreira:'Uso e refinamento de técnicas de barreira.', Domínio:'Aptidão em técnicas de domínio e expansão.', 'Energia Reversa':'Proficiência no uso da energia reversa para regeneração e cura.'})[g]||''; }
function ChoiceCards({items,selected,onChange,limit=999,character=null}){ const [q,setQ]=useState(''); const [modal,setModal]=useState(null); const filtered=items.filter(i=>(i.name+' '+(i.originalText||'')).toLowerCase().includes(q.toLowerCase())); return <><Field label="Buscar"><input value={q} onChange={e=>setQ(e.target.value)}/></Field><div className="cards">{filtered.map(i=>{ const checked=selected.includes(i.id); const req=character?aptitudeRequirementStatus(character,i):{ok:true}; const blocked=(!checked && selected.length>=limit)||(!checked&&!req.ok); return <div key={i.id} className={checked?'feature selected':'feature'}><div className="row"><h3>{i.name}</h3><input type="checkbox" checked={checked} disabled={blocked} onChange={e=>onChange(e.target.checked?[...selected,i.id]:selected.filter(x=>x!==i.id))}/><button className="q" onClick={()=>setModal(i)}>?</button></div>{getPrereqText(i)&&<small className={req.ok?'okText':'warn'}>Pré-requisito: {getPrereqText(i)}</small>}<p>{mechanicalPreview(i.originalText,320)}</p>{!req.ok&&<small className="warn">Bloqueado: falta {req.problems?.join(', ')}</small>}{!checked&&selected.length>=limit&&<small className="warn">Limite atingido.</small>}<BookPageButton pageNumber={bookPageIndex[i.id]} title={i.name}/></div>})}</div>{modal&&<ModalText title={modal.name} text={formatRuleText(modal.originalText||'')} onClose={()=>setModal(null)}/>}</> }
let pdfjsLibPromise=null;
function loadPdfJs(){
  if(!pdfjsLibPromise) pdfjsLibPromise=Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(([lib,worker])=>{ lib.GlobalWorkerOptions.workerSrc=worker.default; return lib; });
  return pdfjsLibPromise;
}
let bookPdfPromise=null;
function loadBookPdf(){
  if(!bookPdfPromise) bookPdfPromise=loadPdfJs().then(lib=>lib.getDocument({url:'/livro-regras.pdf'}).promise);
  return bookPdfPromise;
}
function BookPageModal({pageNumber,title,onClose}){
  const canvasRef=React.useRef(null);
  const [status,setStatus]=useState('loading');
  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        const pdf=await loadBookPdf();
        const page=await pdf.getPage(pageNumber);
        if(cancelled) return;
        const viewport=page.getViewport({scale:1.6});
        const canvas=canvasRef.current;
        if(!canvas) return;
        canvas.width=viewport.width;
        canvas.height=viewport.height;
        const ctx=canvas.getContext('2d');
        await page.render({canvasContext:ctx, viewport}).promise;
        if(!cancelled) setStatus('ready');
      }catch(err){
        console.error(err);
        if(!cancelled) setStatus('error');
      }
    })();
    return ()=>{ cancelled=true; };
  },[pageNumber]);
  return <div className="modalOverlay" onClick={onClose}><div className="modal bookPageModal" onClick={e=>e.stopPropagation()}>
    <div className="modalHead"><h2>{title||`Página ${pageNumber} do livro`}</h2><button onClick={onClose}>Fechar</button></div>
    <div className="bookPageBody">
      {status==='loading'&&<p className="muted">Carregando página do livro...</p>}
      {status==='error'&&<p className="warn">Não foi possível carregar a página do livro.</p>}
      <canvas ref={canvasRef} className="bookPageCanvas" style={{display:status==='ready'?'block':'none'}}/>
    </div>
  </div></div>;
}
function BookPageButton({pageNumber,title}){
  const [open,setOpen]=useState(false);
  if(!pageNumber) return null;
  return <>
    <button type="button" className="bookPageBtn" onClick={()=>setOpen(true)}><BookOpen size={14}/> Ver página do livro</button>
    {open&&<BookPageModal pageNumber={pageNumber} title={title} onClose={()=>setOpen(false)}/>}
  </>;
}
async function extractPdfText(file){
  const pdfjsLib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data:buf}).promise;
  const pageTexts=[];
  for(let i=1;i<=pdf.numPages;i++){
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let lastY=null, line=[]; const lines=[];
    for(const item of content.items){
      const y = Math.round(item.transform[5]);
      if(lastY!==null && Math.abs(y-lastY)>2){ lines.push(line.join(' ').replace(/\s+/g,' ').trim()); line=[]; }
      line.push(item.str);
      lastY=y;
    }
    if(line.length) lines.push(line.join(' ').replace(/\s+/g,' ').trim());
    pageTexts.push(lines.filter(Boolean).join('\n'));
  }
  return pageTexts.join('\n\n');
}
const TECH_MARKER_RE = /Habilidade\s+de\s+(Feit(?:i|í)ço|Ben[çc][ãa]o\s*M[áa]xima|Bên[çc][ãa]o\s*M[áa]xima)(?:\s*(Nível\s*(\d+)))?|Habilidade\s+Passiva(?:\s*(Nível\s*(\d+)))?/i;
function parseTechniqueDocument(text){
  const lines = String(text||'').split('\n').map(x=>x.trim()).filter(l=>l && !/^-?\s*Feito por/i.test(l) && !/^\d{1,4}$/.test(l));
  const markerIdx=[]; lines.forEach((line,i)=>{ if(TECH_MARKER_RE.test(line)) markerIdx.push(i); });
  const fieldRe=/^(Conjuração|Alcance|Área|Alvo|Duração|Requisito)\s*:\s*(.*)$/i;
  const items=[];
  for(let mi=0; mi<markerIdx.length; mi++){
    const idx=markerIdx[mi];
    const markerLine=lines[idx];
    const m=markerLine.match(TECH_MARKER_RE);
    const isPassive=/Passiva/i.test(markerLine);
    let name=markerLine.slice(0,m.index).trim();
    let consumedPrevLine=false;
    if(!name && idx>0){ name=lines[idx-1]; consumedPrevLine=true; }
    const levelMatch=markerLine.match(/Nível\s*(\d+)/i);
    const grade=levelMatch?`Nível ${levelMatch[1]}`:(isPassive?'Passiva':(m[1]?m[1]:'Estilo'));
    const nextIdx = mi+1<markerIdx.length ? markerIdx[mi+1] : lines.length;
    let bodyEnd = nextIdx;
    if(mi+1<markerIdx.length){
      const nextMarkerLine=lines[markerIdx[mi+1]];
      const nextM=nextMarkerLine.match(TECH_MARKER_RE);
      const nextNameOnSameLine=nextMarkerLine.slice(0,nextM.index).trim();
      if(!nextNameOnSameLine) bodyEnd = Math.max(idx+1, markerIdx[mi+1]-1);
    }
    const bodyLines=lines.slice(idx+1, bodyEnd);
    const fields={}; const descLines=[];
    for(const bl of bodyLines){ const fm=bl.match(fieldRe); if(fm) fields[fm[1].toLowerCase()]=fm[2].trim(); else descLines.push(bl); }
    items.push({
      id:uid(), include:true, isPassive,
      name:name||`Técnica ${mi+1}`,
      grade,
      action:fields['conjuração']||'',
      area:fields['área']||'',
      target:fields['alvo']||'',
      duration:fields['duração']||'',
      requisito:fields['requisito']||'',
      text:descLines.join('\n').trim(),
    });
  }
  return items;
}
function ImportTechniquesFromPdf({dispatch}){
  const [items,setItems]=useState(null);
  const [busy,setBusy]=useState(false);
  const [err,setErr]=useState('');
  const onFile=async e=>{
    const f=e.target.files?.[0]; e.target.value=''; if(!f) return;
    setBusy(true); setErr(''); setItems(null);
    try{
      const text=await extractPdfText(f);
      const parsed=parseTechniqueDocument(text);
      if(!parsed.length) setErr('Nenhuma técnica reconhecida neste PDF. O formato precisa ter "Habilidade de Feitiço/Passiva/Benção Máxima" perto do nome de cada técnica. Você ainda pode cadastrar manualmente abaixo.');
      setItems(parsed);
    }catch(err){ setErr('Não foi possível ler este PDF: '+(err?.message||'erro desconhecido')); }
    setBusy(false);
  };
  const toggle=(id)=>setItems(list=>list.map(i=>i.id===id?{...i,include:!i.include}:i));
  const rename=(id,name)=>setItems(list=>list.map(i=>i.id===id?{...i,name}:i));
  const confirmImport=()=>{
    const selected=items.filter(i=>i.include);
    if(!selected.length) return;
    dispatch({type:'importTechniques',items:selected});
    setItems(null);
  };
  return <div className="notice">
    <b>Importar técnicas de um PDF:</b> <span>envie o PDF da técnica homebrew e o app tenta separar cada Habilidade automaticamente pelo padrão "Habilidade de Feitiço/Passiva/Benção Máxima". Revise antes de confirmar — a extração pode errar em PDFs com layout diferente.</span>
    <div className="row" style={{marginTop:8}}><label className="button">{busy?'Lendo PDF...':'Escolher PDF'}<input type="file" accept="application/pdf" hidden disabled={busy} onChange={onFile}/></label></div>
    {err && <p className="bad small">{err}</p>}
    {items && items.length>0 && <div className="pdfImportPreview">
      {items.map(i=><div key={i.id} className={i.include?'pdfImportItem':'pdfImportItem excluded'}>
        <label className="choiceLine"><input type="checkbox" checked={i.include} onChange={()=>toggle(i.id)}/><input className="pdfImportName" value={i.name} onChange={e=>rename(i.id,e.target.value)}/><span className="pill">{i.isPassive?'Passiva':'Ativa'} · {i.grade}</span></label>
        <p className="muted small">{(i.action?`Conjuração: ${i.action}. `:'')}{(i.target?`Alvo: ${i.target}. `:'')}{i.text.slice(0,180)}{i.text.length>180?'…':''}</p>
      </div>)}
      <button className="gold" onClick={confirmImport}>Importar {items.filter(i=>i.include).length} técnica(s) selecionada(s)</button>
    </div>}
  </div>;
}
function TechniqueEditor({c,dispatch}){ return <div className="grid gap"><ImportTechniquesFromPdf dispatch={dispatch}/><div className="grid2"><Field label="Nome da Técnica"><input value={c.technique.name} onChange={e=>dispatch({type:'technique',key:'name',value:e.target.value})}/></Field><Field label="Link de imagem/print da técnica"><input placeholder="https://..." value={c.technique.imageUrl||''} onChange={e=>dispatch({type:'technique',key:'imageUrl',value:e.target.value})}/></Field></div>{c.technique.imageUrl&&<img className="techPreview" src={c.technique.imageUrl} alt="Print da técnica"/>}<Field label="Funcionamento Base"><textarea value={c.technique.baseFunction} onChange={e=>dispatch({type:'technique',key:'baseFunction',value:e.target.value})}/></Field><Field label="Link de imagem/print do funcionamento base"><input placeholder="https://..." value={c.technique.baseImageUrl||''} onChange={e=>dispatch({type:'technique',key:'baseImageUrl',value:e.target.value})}/></Field>{c.technique.baseImageUrl&&<img className="techPreview" src={c.technique.baseImageUrl} alt="Print do funcionamento base"/>}<TechList title="Passivas" keyName="passives" list={c.technique.passives} dispatch={dispatch}/><TechList title="Ativas" keyName="actives" list={c.technique.actives} dispatch={dispatch}/><Panel title="Votos e Expansão"><Field label="Expansão de Domínio"><textarea value={c.technique.domain.text} onChange={e=>dispatch({type:'technique',key:'domain',value:{...c.technique.domain,text:e.target.value}})}/></Field></Panel></div> }

function Restricted({c,dispatch}){
  if(!c.isRestricted && !restringidoIsSpec(c)) return <Panel title="Perfil Restrito bloqueado"><p>Esta aba é usada por personagens com origem/caminho restrito (Restringido). Escolha a origem Restringido em Criação Guiada para liberar.</p></Panel>;
  const stats=calc(c);
  const sp=specialization(c);
  const spClassFeatures=sp?.classFeatures||[];
  const estiloText=[spClassFeatures.find(f=>f.title==='Estilo Marcial')?.text, spClassFeatures.find(f=>f.title==='Nível Da Técnica Marcial Custo')?.text].filter(Boolean).join('\n\n');
  const giftIds=restringidoGiftIds(c), giftLimit=restringidoGiftLimit(c);
  const arsenalRows=Object.entries(RESTRINGIDO_ARSENAL_TABLE);
  const martialSlots=2+[3,5,7,9,11,13,15,17,19].filter(l=>Number(c.level||1)>=l).length;
  const martialLevelAccess=1+(Number(c.level||1)>=5?1:0)+(Number(c.level||1)>=9?1:0)+(Number(c.level||1)>=15?1:0);
  return <section className="grid gap">
    <Panel title="Restringido — Restrito pelos Céus">
      <p className="muted">Um Restringido troca a energia amaldiçoada por um físico sobre-humano: <b>Físico Abençoado</b> e <b>Ápice Corporal Humano</b> vêm da Origem (veja Criação Guiada/Perfil Mundano); <b>Restrito pelos Céus</b> e as demais habilidades automáticas/escolhíveis da Especialização ficam em <b>Perfil Mundano</b>. Aqui ficam os recursos exclusivos do Restringido: Estamina, CD, Dádivas do Céu, Arsenal Amaldiçoado e Estilo Marcial.</p>
      <div className="grid4">
        <Stat label="Estamina máx." value={stats.staminaMax}/>
        <Stat label="CD" value={stats.cd??'—'}/>
        <Stat label="Defesa" value={stats.defense}/>
        <Stat label="RD físico" value={stats.rd}/>
      </div>
      {stats.rdTechnique>0&&<div className="notice"><b>Indulgente a Feitiçaria:</b> Redução de Dano de {stats.rdTechnique} contra danos de técnicas/aptidões amaldiçoadas (não somada ao RD físico acima).</div>}
      <div className="notice"><b>Bônus automáticos por nível:</b> Esquiva Sobre-humana +{restringidoEsquivaBonus(c.level)} (Defesa e Reflexos) · Implemento Celeste +{restringidoImplementoCelesteBonus(c.level)} (CD) · Versatilidade +{restringidoVersatilidadeBonus(c)} (todas as perícias){Number(c.level||1)>=9?' · Teste de Resistência Mestre (mestre em Fortitude e Reflexos)':''}.</div>
    </Panel>
    <Panel title="Restrito pelos Céus — bônus de Defesa">
      <p className="muted">Escolha se soma também o modificador de Força ou de Constituição na sua Defesa. Esse bônus é limitado ao seu nível.</p>
      <Field label="Atributo somado à Defesa"><Select value={c.choices?.restritoCeusDefAttr||''} onChange={v=>dispatch({type:'choice',key:'restritoCeusDefAttr',value:v})}><option value="">Nenhum</option><option value="strength">Força</option><option value="constitution">Constituição</option></Select></Field>
      {c.choices?.restritoCeusDefAttr && <div className="notice">Bônus atual aplicado à Defesa: +{restringidoDefenseAttrBonus(c)}.</div>}
    </Panel>
    <Panel title={`Dádivas do Céu (${giftIds.length}/${giftLimit})`}>
      <p className="muted">Você recebe uma Dádiva do Céu no 4º nível e a cada 4 níveis depois disso (máximo de 5, alcançado no 20º nível).</p>
      <LimitedChoiceGrid title="Dádivas disponíveis" items={RESTRINGIDO_HEAVENLY_GIFTS} selected={giftIds} limit={giftLimit} onChange={arr=>dispatch({type:'choice',key:'heavenlyGifts',value:clampSelection(arr,RESTRINGIDO_HEAVENLY_GIFTS.map(g=>g.id),giftLimit)})}/>
    </Panel>
    <Panel title="Arsenal Amaldiçoado">
      <p className="muted">A partir do 2º nível, seu Bônus de Treinamento define seu arsenal de ferramentas amaldiçoadas (armas, escudos ou uniformes). A ferramenta inicial de quarto grau conta neste arsenal; você pode alternar livremente entre as armas do arsenal durante o seu turno.</p>
      <table><tbody>{arsenalRows.map(([tb,text])=><tr key={tb} className={stats.tb===Number(tb)?'activeRow':''}><td><b>+{tb}{stats.tb===Number(tb)?' (atual)':''}</b></td><td>{text}</td></tr>)}</tbody></table>
    </Panel>
    <Panel title="Estilo Marcial">
      <RuleBox title="Estilo Marcial e Técnicas Marciais" text={estiloText||'Texto não encontrado no banco extraído.'}/>
      <div className="notice"><b>Slots de Técnicas Marciais:</b> {martialSlots} (2 iniciais + 1 adicional nos níveis 3, 5, 7, 9, 11, 13, 15, 17 e 19). <b>Nível máximo de Técnica Marcial disponível:</b> {martialLevelAccess}º (libera acesso ao 2º/3º/4º nível nos níveis 5, 9 e 15).</div>
      <TechniqueEditor c={c} dispatch={dispatch}/>
    </Panel>
  </section>;
}
function Interlude({c,dispatch}){ const tracks=c.choices.interlude||{}; const max=interludeLimit(c); const spent=Object.values(tracks).reduce((a,b)=>a+Number(b||0),0); const set=(name,val)=>{ const current=tracks[name]||0; const next=val; const delta=next-current; if(delta>0 && spent+delta>max) return; dispatch({type:'choice',key:'interlude',value:{...tracks,[name]:next}}); }; return <Panel title={`Focos de Interlúdio: ${spent} / ${max}`}><div className="notice"><b>Importante:</b> focos de interlúdio não são ganho automático de level up. Eles devem ser concedidos pelo mestre/admin após interlúdios, descanso, treino ou recompensa narrativa.</div><Field label="Focos concedidos pelo mestre/admin (modo local)"><input type="number" min="0" value={c.choices.interludeFocus||0} onChange={e=>dispatch({type:'adminInterludeFocus',value:e.target.value})}/></Field><div className="trackGrid">{rules.interludeTracks.map(t=><div key={t} className="track"><h3>{t}<Tooltip text={`Trilha de ${t}. Compre em ordem: 1ª, 2ª, 3ª, 4ª e Completo. O efeito deve ser consultado no texto completo do interlúdio ou cadastrado pelo admin.`}/></h3>{[1,2,3,4,5].map(n=>{ const checked=(tracks[t]||0)>=n; const blocked=!checked && spent>=max; return <label key={n} className={blocked?'blocked':''}><input type="checkbox" checked={checked} disabled={blocked} onChange={()=>set(t,checked?n-1:n)}/>{n<5?`${n}ª Etapa`:'Completo'}</label>})}</div>)}</div><RuleBox title="Treinamento e Interlúdio" text={rules.compendium.find(e=>e.id==='chapter_dia_a_dia')?.originalText}/></Panel> }
function Summons({c,dispatch}){ return <Panel title="Invocações"><button onClick={()=>dispatch({type:'addSummon'})}>Adicionar invocação</button><div className="summonGrid">{c.summons.map(s=><div className="summon" key={s.id}><Field label="Nome"><input value={s.name} onChange={e=>dispatch({type:'updateSummon',id:s.id,key:'name',value:e.target.value})}/></Field><div className="grid4"><Field label="Grau"><input value={s.grade} onChange={e=>dispatch({type:'updateSummon',id:s.id,key:'grade',value:e.target.value})}/></Field><Field label="Custo"><input type="number" value={s.cost} onChange={e=>dispatch({type:'updateSummon',id:s.id,key:'cost',value:Number(e.target.value)})}/></Field><Field label="PV"><input type="number" value={s.hpCurrent} onChange={e=>dispatch({type:'updateSummon',id:s.id,key:'hpCurrent',value:Number(e.target.value)})}/></Field><Field label="Defesa"><input type="number" value={s.defense} onChange={e=>dispatch({type:'updateSummon',id:s.id,key:'defense',value:Number(e.target.value)})}/></Field></div><button className="danger" onClick={()=>dispatch({type:'removeSummon',id:s.id})}>Remover</button></div>)}</div><RuleBox title="Capítulo de Invocações" text={rules.compendium.find(e=>e.id==='chapter_invocacoes')?.originalText}/></Panel> }
function TechniqueBank({c,state,dispatch}){ return <section className="grid gap"><Panel title="Banco de Técnicas"><p>As técnicas são a parte comunitária/customizável. Cadastre textos, passivas, ativas e expansão. Em produção, o Supabase salva como pendente até aprovação.</p><TechniqueEditor c={c} dispatch={dispatch}/></Panel>{escolhidoId(c.originId)&&<TocadoPorDeusPanel c={c} dispatch={dispatch}/>}</section> }
function TocadoPorDeusPanel({c,dispatch}){
  const controleLeitura=Number(c.choices?.aptitudeLevels?.['Controle e Leitura']||0);
  const activeNames=(c.technique.actives||[]).map(a=>normText(a.name));
  const vows=getSelectedArrayChoice(c,'escolhidoVows');
  const hasVow=id=>vows.includes(id);
  const auraPrereqOk=(c.choices?.aptitudes||[]).includes('apt_energia_reversa') && (c.choices?.aptitudes||[]).includes('apt_cura_em_grupo');
  return <Panel title="Novo Estilo da Sombra — Tocado por Deus (Homebrew)">
    <div className="notice warnNotice"><b>Conteúdo homebrew (não-oficial):</b> "Tocado por Deus" — por @Vai Wilson Vai, inspirado em Sir Galahad. Exclusivo da origem O Escolhido.</div>
    <MechanicalSummary title={TOCADO_POR_DEUS_STYLE.name} summary={{bonuses:['Ganha acesso aos artefatos Excalibur e Dama Do Lago, sacrificando uma Técnica de Estilo ao receber cada um.','Suas Técnicas de Estilo escalam com seu Nível de Aptidão em Controle e Leitura (mostrado abaixo).'], playstyle:'Cavaleiro sagrado inspirado em Sir Galahad — combina Domínio Simples, espada/armadura lendárias e técnicas que crescem junto com Controle e Leitura.'}} fallbackText={TOCADO_POR_DEUS_STYLE.originalText}/>
    <div className="notice"><b>Nível atual em Controle e Leitura:</b> {controleLeitura}. As técnicas de estilo abaixo escalam com esse valor — ajuste em Perfil Amaldiçoado.</div>
    <h3>Técnicas de Estilo</h3>
    <div className="cards">{TOCADO_POR_DEUS_TECHNIQUES.map(t=>{ const added=activeNames.includes(normText(t.name)); const needsAura=t.id==='hb_aura_do_escolhido'; const blocked=needsAura && !auraPrereqOk; return <div key={t.id} className={added?'feature selected':'feature'}><h3>{t.name}</h3><p>{mechanicalPreview(t.originalText,320)}</p>{needsAura&&!auraPrereqOk&&<small className="warn">Bloqueado: exige as aptidões Energia Reversa e Cura Em Grupo.</small>}<button disabled={added||blocked} onClick={()=>dispatch({type:'addPresetActive',preset:t})}>{added?'Já adicionada em Ativas':'Adicionar como Ativa (Técnica)'}</button></div>; })}</div>
    <h3>Artefatos Arthurianos</h3>
    <p className="muted">Ao receber acesso, sacrifique uma Técnica de Estilo conforme o Funcionamento Básico acima.</p>
    <div className="cards">{ESCOLHIDO_ARTIFACTS.map(a=>{ const owned=(c.inventory.items||[]).some(i=>i.name===a.name); return <div key={a.id} className={owned?'feature selected':'feature'}><h3>{a.name}</h3><p>{mechanicalPreview(a.originalText,320)}</p><button disabled={owned} onClick={()=>dispatch({type:'addItem',item:{...a,homebrew:true}})}>{owned?'Já no inventário':'Adicionar ao inventário'}</button></div>; })}</div>
    <h3>Votos Adicionais (opcionais)</h3>
    <LimitedChoiceGrid title="Votos" items={ESCOLHIDO_VOWS} selected={vows} onChange={arr=>dispatch({type:'choice',key:'escolhidoVows',value:arr})}/>
    {hasVow('hb_filho_do_adulterio')&&<div className="choiceBlock"><h4>Filho do Adultério — atributo beneficiado</h4><p className="muted">Força e Constituição ficam travadas em 4 (aplicado automaticamente). Escolha Sabedoria ou Destreza para ter o máximo elevado a 24 e receber +4.</p><Field label="Atributo (Sabedoria ou Destreza)"><Select value={c.choices?.filhoAdulterioAttr||''} onChange={v=>dispatch({type:'choice',key:'filhoAdulterioAttr',value:v})}><option value="">Escolha</option><option value="wisdom">Sabedoria</option><option value="dexterity">Destreza</option></Select></Field><div className="notice"><b>RD geral atual pelo voto:</b> +{escolhidoVowRd(c)}. <b>Só recebe aptidão em níveis pares</b> (já aplicado no limite de Perfil Amaldiçoado).</div></div>}
    {hasVow('hb_codigo_de_cavaleiro')&&<div className="notice"><b>Código de Cavaleiro ativo:</b> +{Number(c.level||1)} PE máximo, bônus de treinamento (+{trainingBonus(Number(c.level||1))}) em testes de Presença (exceto Enganação) e +{Math.floor(trainingBonus(Number(c.level||1))/2)} de Defesa — já somados aos seus totais.</div>}
  </Panel>;
}

function Compendium(){ const [q,setQ]=useState(''); const [type,setType]=useState('all'); const entries=useMemo(()=>[...rules.compendium,...rules.weapons,...rules.uniforms,...rules.shields,...rules.kits,...rules.specialItems,...rules.aptitudes,...rules.talents,...rules.conditions],[]); const filtered=useMemo(()=>{ const query=q.toLowerCase(); return entries.filter(e=>(type==='all'||e.type===type)&&((e.name||'')+' '+(e.category||'')+' '+(e.originalText||'')).toLowerCase().includes(query)).slice(0,200); },[entries,q,type]); const [modal,setModal]=useState(null); return <Panel title="Compêndio"><div className="grid2"><Field label="Busca"><input value={q} onChange={e=>setQ(e.target.value)} placeholder="aptidão, arma, condição, regra..."/></Field><Field label="Tipo"><Select value={type} onChange={setType}><option value="all">Todos</option>{[...new Set(entries.map(e=>e.type))].map(t=><option key={t} value={t}>{t}</option>)}</Select></Field></div><div className="compendiumList">{filtered.map(e=><button key={e.id} onClick={()=>setModal(e)}><b>{e.name}</b><span>{e.type} · p. {e.pageStart||'?'}</span><p>{(e.originalText||'').slice(0,220)}</p></button>)}</div>{modal&&<ModalText title={modal.name} text={modal.originalText||''} onClose={()=>setModal(null)}/>}</Panel> }
function Admin({state}){ return <section className="grid gap"><Panel title="Admin / Revisão"><p>Estrutura preparada para Supabase: créditos, aprovação de técnicas comunitárias, revisão de regras extraídas e logs.</p><h3>Logs locais</h3>{state.adminLog.map(l=><div key={l.id} className="logline"><b>{l.type}</b> {l.text}</div>)}</Panel><Panel title="Resumo do banco extraído"><div className="grid4"><Stat label="Armas" value={rules.weapons.length}/><Stat label="Itens especiais" value={rules.specialItems.length}/><Stat label="Aptidões extraídas" value={rules.aptitudes.length}/><Stat label="Entradas no compêndio" value={rules.compendium.length}/></div></Panel></section> }
function downloadState(state){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'})); a.download='fm-ficha-backup.json'; a.click(); }
function importFile(e,dispatch){ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const parsed=JSON.parse(r.result); if(!parsed || typeof parsed!=='object' || !Array.isArray(parsed.characters)){ alert('Arquivo inválido: não parece um backup desta ficha (falta a lista de personagens).'); return; } if(!confirm('Importar este arquivo vai substituir os personagens carregados atualmente. Deseja continuar?')) return; dispatch({type:'exportImport',state:parsed}); }catch(err){ alert('Arquivo inválido: não foi possível ler o JSON.'); } }; r.readAsText(f); e.target.value=''; }


// =========================
// Overrides v4: anti-burla, classe, equipamentos e leitura
// =========================
function oficioLines(c){
  const raw=(c.choices.skillDetails?.oficios ?? c.choices.skillDetails?.oficio ?? '').toString();
  return raw.split(/\n|,/).map(x=>x.trim()).filter(Boolean);
}

function baseSkillChosenCount(c,cfg){
  let n=(c.choices.skills||[]).filter(id=>id!=='oficio' && cfg.skillBaseAllowed.includes(id)).length;
  if((c.choices.skills||[]).includes('oficio') && cfg.skillBaseAllowed.includes('oficio')) n += Math.max(1, oficioLines(c).length);
  return n;
}
function oficioExtraWeight(c){
  if(!(c.choices.skills||[]).includes('oficio')) return 0;
  return Math.max(0, Math.max(1, oficioLines(c).length)-1);
}
function effectiveSkillCount(c){ return selectedSkillCount(c) + oficioExtraWeight(c); }


function hasWeaponMastery(c,item){
  if(!item || item.type!=='weapon') return true;
  if(item.homebrew) return true;
  const cfg=specTrainingConfig(c), t=(cfg.masteryText||'').toLowerCase();
  if(t.includes('todas as armas')) return true;
  if(t.includes('armas simples') && String(item.category||'').toLowerCase().includes('simples')) return true;
  if(t.includes('armas marciais') && String(item.category||'').toLowerCase().includes('complex')) return true;
  if(t.includes('armas a distância') && String(item.kind||'').toLowerCase().includes('distância')) return true;
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

function parseLevelTableFromText(text=''){
  const gains={};
  const lines=String(text).split(/\n/).map(x=>x.trim()).filter(Boolean);
  for(const line of lines){ const m=line.match(/^(\d+)[º°]?\s+(.+)$/); if(m && Number(m[1])>=1 && Number(m[1])<=20){ gains[Number(m[1])]=m[2].trim(); }}
  return gains;
}

function CatalogQuick({dispatch}){ return <div className="notice"><b>Equipamento inicial:</b> use o Registro e Inventário para escolher no catálogo completo. Aqui só aplicamos os itens gratuitos e mostramos as maestrias da Especialização. <button onClick={()=>dispatch({type:'applyStarterEquipment'})}>Aplicar gratuitos iniciais</button><button onClick={()=>dispatch({type:'tab',tab:'Registro e Inventário'})}>Abrir Registro e Inventário</button></div> }

function featureCardsFromSpec(sp){
  if(!sp?.originalText) return [];
  const t=sp.originalText.replace(/\r/g,'');
  const start=t.search(/HABILIDADES DO|HABILIDADES DE|No primeiro nível|No 1º nível/i);
  const chunk=(start>=0?t.slice(start):t).split(/(?=\n[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9\s\-]{5,}\n)/g);
  return chunk.map(x=>x.trim()).filter(x=>x.length>80).slice(0,30).map((x,i)=>{ const lines=x.split('\n').map(y=>y.trim()).filter(Boolean); const title=(lines[0]||`Habilidade ${i+1}`).slice(0,80); return {id:`${sp.id}_feature_${i}`, name:title, originalText:x}; });
}
function FeatureCard({title,text}){ const [open,setOpen]=useState(false); const formatted=formatRuleText(text||''); return <div className="feature readable"><h3>{title}</h3><div className="textPreview">{formatted.slice(0,700)}{formatted.length>700?'...':''}</div><button onClick={()=>setOpen(true)}>Consultar texto completo</button>{open&&<ModalText title={title} text={formatted} onClose={()=>setOpen(false)}/>}</div> }

function equipStatRows(item){
  const cost=`C${item.cost??0} / E${item.spaces??0}`;
  if(item.type==='weapon') return [['Dano',item.damage||'-'],['Crítico',item.critical||'-'],['Grupo',item.group||'-'],['Tipo',item.kind||'-'],['Custo/Espaço',cost]];
  if(item.type==='uniform') return [['Defesa',`+${item.defenseBonus??0}`],...(item.penalty?[['Ônus',item.penalty]]:[]),['Custo/Espaço',cost]];
  if(item.type==='shield') return [['Dano',item.damage||'-'],['RD',item.rd??0],...(item.penalty?[['Ônus',item.penalty]]:[]),['Custo/Espaço',cost]];
  if(item.type==='special') return [['Categoria',item.category||'-'],['Custo/Espaço',cost]];
  return [['Custo/Espaço',cost]];
}
function WeaponCard({item,dispatch,compact,character}){
  const [open,setOpen]=useState(false);
  const isUniform=item.type==='uniform';
  const canUpgrade=item.type==='weapon'||item.type==='uniform'||item.type==='shield';
  const isStatic=item.type==='kit'||item.type==='special';
  const warn=character && item.equipped && ((item.type==='weapon'&&!hasWeaponMastery(character,item))||(item.type==='shield'&&!hasShieldMastery(character,item)));
  const propsText=Array.isArray(item.properties)?item.properties.join(', '):(item.properties||'');
  const edit=(field,value)=>dispatch({type:'updateItemField',instanceId:item.instanceId,field,value});
  const hasExtra=propsText||item.specialText||item.customNotes;
  const rows=equipStatRows(item);
  const descPreview=formatRuleText(item.originalText||'');
  return <div className={`equipCard sheetCard ${warn?'invalid':''}`}>
    <div className="equipTitle"><b>{item.name}</b><span>{item.freeStarter?'Grátis':item.type}</span></div>
    {warn&&<div className="bad small"><AlertTriangle size={14}/> Sem maestria pela especialização atual.</div>}
    <div className="equipGrid">
      {canUpgrade && <><span>Grau Am.</span>{dispatch?<select value={item.grade||'—'} onChange={e=>edit('grade',e.target.value)}><option value="—">—</option>{['4º Grau','3º Grau','2º Grau','1º Grau','Grau Especial'].map(g=><option key={g} value={g}>{g}</option>)}</select>:<b>{item.grade||'-'}</b>}</>}
      {rows.map(([label,value],i)=><React.Fragment key={i}><span>{label}</span><b>{value}</b></React.Fragment>)}
    </div>
    {!compact && <>
      {canUpgrade && dispatch && <details className="equipCharDetails"><summary>Características / evolução de grau{hasExtra?'':' (vazio)'}</summary>
        <span className="miniLabel">Propriedades</span><textarea className="equipEditField" rows={2} value={propsText} placeholder="Propriedades da arma/item..." onChange={e=>edit('properties',e.target.value)}/>
        <span className="miniLabel">Habilidade Especial</span><textarea className="equipEditField" rows={2} value={item.specialText||''} placeholder="Habilidade especial ganha ao evoluir de grau..." onChange={e=>edit('specialText',e.target.value)}/>
        <span className="miniLabel">Encantamentos / Característica Especial</span><textarea className="equipEditField" rows={2} value={item.customNotes||''} placeholder="Encantamentos, gravações, características especiais..." onChange={e=>edit('customNotes',e.target.value)}/>
      </details>}
      {isStatic && descPreview && <p className="muted small equipDesc">{descPreview.slice(0,220)}{descPreview.length>220?'…':''}</p>}
      <div className="row"><button onClick={()=>dispatch({type:'equipItem',instanceId:item.instanceId,singleType:isUniform?'uniform':null})}>{item.equipped?'Desequipar':'Equipar'}</button><button className="danger" onClick={()=>dispatch({type:'removeItem',instanceId:item.instanceId})}><Trash2 size={16}/>Remover</button><button onClick={()=>setOpen(true)}>Ver descrição</button></div>
    </>}
    {open&&<ModalText title={item.name} text={formatRuleText(item.originalText||'Sem descrição cadastrada.')} onClose={()=>setOpen(false)}/>}
  </div>;
}
const EQUIP_TYPE_LABELS = {weapon:'Armas', uniform:'Uniformes', shield:'Escudos', kit:'Kits', special:'Itens Especiais / Acessórios'};
function EquipmentTypeGroup({type,items,dispatch,character}){
  const [open,setOpen]=useState(true);
  if(!items.length) return null;
  return <div className="equipTypeGroup">
    <h3 className="equipTypeHead" onClick={()=>setOpen(o=>!o)}>{open?<ChevronUp size={16}/>:<ChevronDown size={16}/>}{EQUIP_TYPE_LABELS[type]||type} <small>{items.length}</small></h3>
    {open && <div className="cards equipmentCards">{items.map(i=><WeaponCard key={i.instanceId} item={i} dispatch={dispatch} character={character}/>)}</div>}
  </div>;
}
function Inventory({c,dispatch}){ const [filter,setFilter]=useState(''); const catalog=allCatalog().filter(i=>(i.name+' '+i.type+' '+(i.category||'')).toLowerCase().includes(filter.toLowerCase())); return <section className="grid gap"><Panel title={`Inventário — ${inventorySpaces(c)} / ${inventoryMax(c)} espaços`}><div className="notice"><b>Maestrias atuais:</b> {specTrainingConfig(c).masteryText}</div><div className="grid2"><Field label="Dinheiro atual"><input type="number" value={c.inventory.money} onChange={e=>dispatch({type:'inventory',key:'money',value:Number(e.target.value)})}/></Field><Field label="Espaços extras"><input type="number" value={c.inventory.extraSpaces} onChange={e=>dispatch({type:'inventory',key:'extraSpaces',value:Number(e.target.value)})}/></Field></div><Field label="Buscar no catálogo completo"><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="arma, uniforme, escudo, kit, acessório..."/></Field><div className="catalogGroups"><WeaponCatalogGroup items={catalog.filter(i=>i.type==='weapon')} dispatch={dispatch} character={c}/><CatalogGroup title="Uniformes" items={catalog.filter(i=>i.type==='uniform')} dispatch={dispatch}/><CatalogGroup title="Escudos" items={catalog.filter(i=>i.type==='shield')} dispatch={dispatch}/><CatalogGroup title="Kits" items={catalog.filter(i=>i.type==='kit')} dispatch={dispatch}/><CatalogGroup title="Itens Especiais / Acessórios" items={catalog.filter(i=>i.type==='special')} dispatch={dispatch}/></div></Panel><Panel title={`Equipamentos — ${c.inventory.items.length} item(ns)`}><p className="muted">Itens marcados como Grátis não contam no limite de 2 equipamentos iniciais de custo 1. Só Armas, Uniformes e Escudos podem virar Ferramentas Amaldiçoadas e ganhar Grau (regra do livro) — edite o Grau e as características deles conforme evoluem. Kits e Itens Especiais/Acessórios não têm progressão de Grau.</p>{c.inventory.items.length===0 && <p className="muted">Nenhum item no inventário ainda — adicione algo no catálogo acima.</p>}{['weapon','uniform','shield','kit','special'].map(type=><EquipmentTypeGroup key={type} type={type} items={c.inventory.items.filter(i=>i.type===type)} dispatch={dispatch} character={c}/>)}</Panel><Panel title="Anotações"><textarea value={c.inventory.notes} onChange={e=>dispatch({type:'inventory',key:'notes',value:e.target.value})}/></Panel></section> }
const ACTION_TYPE_INFO = [
  {id:'comum', name:'Ação Comum', text:'A ação básica do turno — usada normalmente para atacar ou conjurar um Feitiço.'},
  {id:'bonus', name:'Ação Bônus', text:'Ação extra no turno, geralmente ligada a habilidades de Especialização/Técnica (comandar invocação, ataque extra, etc.).'},
  {id:'movimento', name:'Ação de Movimento', text:'Dedicada a se mover pelo campo de batalha, usando seu valor de Movimento.'},
  {id:'livre', name:'Ação Livre', text:'Coisas simples (abrir porta, falar). Ilimitadas por turno, mas cada Ação Livre só pode repetir 1x por rodada.'},
  {id:'reacao', name:'Reação', text:'Usada em resposta a um gatilho, dentro ou fora do seu turno. Só 1 uso da mesma Reação por rodada; usar qualquer reação te impede de usar outra até seu próximo turno.'},
  {id:'completa', name:'Ação Completa', text:'Junta Ação Comum + Ação Bônus em uma coisa só — só pode ser usada se nenhuma das duas já foi gasta no turno.'},
];
const ACTION_HIERARCHY_NOTE = 'Hierarquia: Ação Comum > Ação Bônus > Ação de Movimento. Você pode converter uma ação de valor maior em uma de menor (ex.: usar sua Ação Comum como Movimento), mas nunca o contrário.';
function parseActionListSection(text){
  const lines=String(text||'').split('\n').map(x=>x.trim());
  const items=[]; let current=null;
  for(const line of lines){
    if(!line || /^\d{1,4}$/.test(line)) continue;
    const isHeader=/^[A-ZÀ-Ý][A-ZÀ-Ý0-9\s\-]{1,44}$/.test(line) && line.length>=3 && !/^MOD\.|DIST[ÂA]NCIA/.test(line);
    if(isHeader){ if(current) items.push(current); current={id:slugify(line), name:toTitleCaseSmart(line), text:''}; }
    else if(current){ current.text += (current.text?' ':'')+line; }
  }
  if(current) items.push(current);
  return items;
}
function buildCombatActionCatalog(){
  const chapter=rules.compendium.find(x=>x.id==='chapter_combate');
  if(!chapter) return {};
  const t=chapter.originalText||'';
  const bounds=[
    ['comum', t.indexOf('LISTA DE AÇÕES COMUNS')],
    ['bonus', t.indexOf('LISTA DE AÇÕES BÔNUS')],
    ['movimento', t.indexOf('LISTA DE AÇÕES DE MOVIMENTO')],
    ['completa', t.indexOf('LISTA DE AÇÕES COMPLETAS')],
    ['livre', t.indexOf('LISTA DE AÇÕES LIVRES')],
  ].filter(([,i])=>i>=0).sort((a,b)=>a[1]-b[1]);
  const hardEnd=t.indexOf('REALIZANDO E RESOLVENDO ATAQUES');
  const byType={};
  for(let i=0;i<bounds.length;i++){
    const [key,start]=bounds[i];
    const end=i+1<bounds.length?bounds[i+1][1]:(hardEnd>start?hardEnd:t.length);
    const bodyStart=t.indexOf('\n',start);
    byType[key]=parseActionListSection(t.slice(bodyStart,end));
  }
  return byType;
}
const COMBAT_ACTION_CATALOG = buildCombatActionCatalog();
function ActionTypeCard({info}){ return <div className="actionTypeCard"><b>{info.name}</b><Tooltip text={info.text}/></div> }
function ActionSubCard({a}){ const [open,setOpen]=useState(false); const txt=formatRuleText(a.text||''); return <div className="actionCard"><h3>{a.name}</h3><div className="textPreview actionText">{txt.slice(0,300)}{txt.length>300?'...':''}</div>{txt.length>300&&<button onClick={()=>setOpen(true)}>Ver ação completa</button>}{open&&<ModalText title={a.name} text={txt} onClose={()=>setOpen(false)}/>}</div> }
function ActionTypeGroup({title,items}){ const [open,setOpen]=useState(false); if(!items?.length) return null; return <details className="collapseBox actionTypeGroup" open={open} onToggle={e=>setOpen(e.currentTarget.open)}><summary>{title} <small>{items.length}</small></summary><div className="actionList improved">{items.map(a=><ActionSubCard key={a.id} a={a}/>)}</div></details> }
function QuickAbilityRow({item}){
  const [open,setOpen]=useState(false);
  const pageNumber=bookPageIndex[item.id];
  return <div className="toolkitRow">
    <b>{item.name}</b>
    {item.tag&&<span className="pill mini">{item.tag}</span>}
    <button className="toolkitViewBtn" onClick={()=>setOpen(true)}>Ver texto</button>
    <BookPageButton pageNumber={pageNumber} title={item.name}/>
    {open&&<ModalText title={item.name} text={formatRuleText(item.text||'Sem descrição cadastrada.')} onClose={()=>setOpen(false)}/>}
  </div>;
}
function QuickAbilityList({title,items,defaultOpen,emptyText}){
  return <details className="collapseBox toolkitGroup" open={defaultOpen}>
    <summary>{title} <small>{items.length}</small></summary>
    {items.length===0 ? <p className="muted small">{emptyText||'Nada cadastrado ainda.'}</p> : <div className="toolkitList">{items.map((it,i)=><QuickAbilityRow key={it.id||i} item={it}/>)}</div>}
  </details>;
}
function AvailableToolkitPanel({c}){
  const sp=specialization(c);
  const activeTechs=(c.technique.actives||[]).filter(f=>f.available!==false).map(f=>({id:f.id,name:f.name,tag:[f.grade,f.action].filter(Boolean).join(' · '),text:f.text}));
  const passiveTechs=(c.technique.passives||[]).filter(f=>f.available!==false).map(f=>({id:f.id,name:f.name,tag:f.grade,text:f.text}));
  const talentPool=talentsPool(c);
  const talents=(c.choices?.talents||[]).map(id=>talentPool.find(t=>t.id===id)).filter(Boolean).map(t=>({id:t.id,name:t.name,text:t.originalText}));
  const aptitudes=(c.choices?.aptitudes||[]).map(id=>rules.aptitudes.find(a=>a.id===id)).filter(Boolean).map(a=>({id:a.id,name:a.name,text:a.originalText}));
  const featurePool=splitClassFeatures(sp).choice;
  const features=(c.choices?.mundaneFeatures||[]).map(id=>featurePool.find(f=>f.id===id)).filter(Boolean).map(f=>({id:f.id,name:f.title,tag:f.level?`Nível ${f.level}`:'',text:f.text}));
  const summons=(c.summons||[]).map(s=>({id:s.id,name:s.name,tag:`PV ${s.hpCurrent??s.hpMax}/${s.hpMax}`,text:(s.traits||[]).map(t=>t.name).join(', ')}));
  return <Panel title="O que você tem disponível" help="Resumo rápido de tudo que você já escolheu e pode usar em combate — técnicas, talentos, aptidões e habilidades de classe. Toque no '?' para ver o texto completo de cada uma.">
    <QuickAbilityList title="Técnicas Ativas (Feitiços)" items={activeTechs} defaultOpen emptyText="Nenhuma técnica ativa disponível agora — cadastre ou marque como disponível na aba Técnicas."/>
    <QuickAbilityList title="Técnicas Passivas" items={passiveTechs} defaultOpen emptyText="Nenhuma técnica passiva disponível agora — cadastre ou marque como disponível na aba Técnicas."/>
    <QuickAbilityList title="Talentos" items={talents} emptyText="Nenhum talento escolhido ainda (Perfil Mundano)."/>
    <QuickAbilityList title="Aptidões Amaldiçoadas" items={aptitudes} emptyText="Nenhuma aptidão escolhida ainda (Perfil Amaldiçoado)."/>
    <QuickAbilityList title="Habilidades de Classe" items={features} emptyText="Nenhuma habilidade de classe escolhida ainda (Perfil Mundano)."/>
    {summons.length>0 && <QuickAbilityList title="Invocações" items={summons} defaultOpen/>}
  </Panel>;
}
function CombatSheet({c,dispatch,stats}){
  const [dmg,setDmg]=useState(''); const [heal,setHeal]=useState(''); const [pe,setPe]=useState(''); const [stam,setStam]=useState(''); const [healPe,setHealPe]=useState('');
  const [tempHp,setTempHp]=useState(''); const [tempPe,setTempPe]=useState('');
  const equipped=c.inventory.items.filter(i=>i.equipped); const hasStamina=restringidoIsSpec(c);
  const hpTempCap=Math.floor(stats.hpMax/2), peTempCap=Math.floor(stats.peMax/2);
  return <section className="grid gap">
    <Panel title="Ficha / Combate">
      <div className="heroGrid"><div><h2>{c.name||'Personagem sem nome'}</h2><p>{origin(c)?.name||'Origem não escolhida'} · {specialization(c)?.name||'Especialização não escolhida'} · Nível {c.level}</p></div><Stat label="Defesa" value={stats.defense} icon={<Shield/>}/><Stat label="Atenção" value={stats.attention} icon={<Eye/>}/><Stat label="Movimento" value={`${stats.movement}m`} icon={<Swords/>}/>{stats.cd!=null&&<Stat label="CD" value={stats.cd} icon={<Zap/>}/>}{stats.rd>0&&<Stat label="RD" value={stats.rd}/>}{stats.attackBonus>0&&<Stat label="Bônus extra de acerto" value={signed(stats.attackBonus)}/>}{stats.damageBonus>0&&<Stat label="Bônus extra de dano" value={signed(stats.damageBonus)}/>}</div>
      <div className="resources"><Resource label="PV" current={c.combat.hpCurrent??stats.hpMax} max={stats.hpMax} temp={c.combat.hpTemp}/>{!hasStamina&&<Resource label="PE" current={c.combat.peCurrent??stats.peMax} max={stats.peMax} temp={c.combat.peTemp}/>}{hasStamina&&<Resource label="Estamina" current={c.combat.staminaCurrent??stats.staminaMax} max={stats.staminaMax} temp={c.combat.staminaTemp}/>}<Resource label="Alma" current={c.combat.soulCurrent??stats.soulMax} max={stats.soulMax} temp={0}/></div>
      <div className="grid3">
        <Field label="Dano recebido" help="PV temporário absorve o dano antes do PV atual."><input value={dmg} onChange={e=>setDmg(e.target.value)} /><button onClick={()=>{dispatch({type:'applyDamage',value:dmg});setDmg('')}}>Aplicar dano</button></Field>
        <Field label="Cura recebida"><input value={heal} onChange={e=>setHeal(e.target.value)} /><button onClick={()=>{dispatch({type:'applyHeal',value:heal});setHeal('')}}>Aplicar cura</button></Field>
        {!hasStamina&&<Field label="Gasto de PE"><input value={pe} onChange={e=>setPe(e.target.value)} /><button onClick={()=>{dispatch({type:'spendPE',value:pe});setPe('')}}>Gastar</button></Field>}
        {!hasStamina&&<Field label="Cura de PE" help="Para recuperação pontual (item, feitiço de cura de energia, etc). Para descanso, use os botões abaixo."><input value={healPe} onChange={e=>setHealPe(e.target.value)} /><button onClick={()=>{dispatch({type:'healPE',value:healPe});setHealPe('')}}>Recuperar</button></Field>}
        {hasStamina&&<Field label="Gasto de Estamina"><input value={stam} onChange={e=>setStam(e.target.value)} /><button onClick={()=>{dispatch({type:'spendStamina',value:stam});setStam('')}}>Gastar</button></Field>}
        <Field label={`PV temporário (máx. ${hpTempCap}, metade do PV máx.)`} help="Não estoca: definir um novo valor substitui o antigo (sempre vale o maior). Some ao PV atual e é consumido antes dele quando você sofre dano."><input value={tempHp} placeholder={String(c.combat.hpTemp||0)} onChange={e=>setTempHp(e.target.value)}/><button onClick={()=>{dispatch({type:'setTempHp',value:tempHp});setTempHp('')}}>Definir</button></Field>
        {!hasStamina&&<Field label={`PE temporário (máx. ${peTempCap}, metade do PE máx.)`}><input value={tempPe} placeholder={String(c.combat.peTemp||0)} onChange={e=>setTempPe(e.target.value)}/><button onClick={()=>{dispatch({type:'setTempPe',value:tempPe});setTempPe('')}}>Definir</button></Field>}
      </div>
      {hasStamina&&<div className="row"><button onClick={()=>dispatch({type:'restoreStamina',rest:'curto'})}>Descanso curto (metade da Estamina)</button><button onClick={()=>dispatch({type:'restoreStamina',rest:'longo'})}>Descanso longo (Estamina cheia)</button></div>}
      {!hasStamina&&<div className="row"><button onClick={()=>dispatch({type:'restEnergy',rest:'curto'})}>Descanso curto (recupera metade do PE)</button><button onClick={()=>dispatch({type:'restEnergy',rest:'longo'})}>Descanso longo (PV e PE cheios)</button></div>}
      {hasSantuario(c)&&<div className="notice"><b>Santuário (Dama Do Lago, Grau Especial):</b> +{Number(c.combat.santuarioStacks||0)*2} Defesa acumulada (máx +6). <div className="row"><button onClick={()=>dispatch({type:'santuarioHit'})}>Registrar acerto sofrido (+2 Defesa)</button><button onClick={()=>dispatch({type:'santuarioReset'})}>Zerar pilha (novo combate)</button><button onClick={()=>dispatch({type:'applySantuarioTempHp'})}>Aplicar PV temporário (1/3 do máx.)</button></div></div>}
    </Panel>
    <Panel title={`Equipamento equipado (${equipped.filter(i=>i.type==='weapon'||i.type==='shield').length})`}>
      <div className="cards">{equipped.filter(i=>i.type==='weapon'||i.type==='shield').map(i=><WeaponCard key={i.instanceId} item={i} compact character={c}/>)}{equipped.filter(i=>i.type==='weapon'||i.type==='shield').length===0&&<p className="muted">Nenhuma arma ou escudo equipado.</p>}</div>
    </Panel>
    <AvailableToolkitPanel c={c}/>
    <Panel title="Anotações de combos" help="Espaço livre para anotar sequências de ações, combos com aliados ou lembretes de jogo — nada aqui afeta os cálculos da ficha."><textarea placeholder="Ex.: Fintar (ação bônus) para deixar desprevenido, depois Investida com a espada..." value={c.combat.comboNotes||''} onChange={e=>dispatch({type:'combat',key:'comboNotes',value:e.target.value})}/></Panel>
    <Panel title="Ações de Combate" help="As 6 categorias de ação existem em todo turno; abaixo delas, os usos padrão de cada uma. Habilidades de Especialização/Técnica liberam mais opções.">
      <div className="actionTypeGrid">{ACTION_TYPE_INFO.map(info=><ActionTypeCard key={info.id} info={info}/>)}</div>
      <p className="muted small">{ACTION_HIERARCHY_NOTE}</p>
      <ActionTypeGroup title="Ações Comuns" items={COMBAT_ACTION_CATALOG.comum}/>
      <ActionTypeGroup title="Ações Bônus" items={COMBAT_ACTION_CATALOG.bonus}/>
      <ActionTypeGroup title="Ações de Movimento" items={COMBAT_ACTION_CATALOG.movimento}/>
      <ActionTypeGroup title="Ações Completas" items={COMBAT_ACTION_CATALOG.completa}/>
      <ActionTypeGroup title="Ações Livres" items={COMBAT_ACTION_CATALOG.livre}/>
    </Panel>
    <Panel title="Condições"><div className="conditionGrid">{rules.conditions.map(cond=><label key={cond.id} className={c.combat.conditions.includes(cond.id)?'condition active':'condition'}><input type="checkbox" checked={c.combat.conditions.includes(cond.id)} onChange={()=>dispatch({type:'toggleCondition',id:cond.id})}/><b>{cond.name}</b><Tooltip text={cond.originalText}/></label>)}</div></Panel>
    <Panel title="Log de sessão"><div className="log">{c.combat.log.map(l=><div key={l.id}><span>{new Date(l.at).toLocaleTimeString()}</span>{l.label}</div>)}</div></Panel>
  </section>;
}
function TechFeatureCard({f,keyName,dispatch}){
  const available=f.available!==false;
  const toggleAvailable=()=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'available',value:!available});
  return <details className={available?'techFeatureCard':'techFeatureCard unavailable'} open={available}>
    <summary>
      <label className="choiceLine" onClick={e=>e.stopPropagation()}><input type="checkbox" checked={available} onChange={toggleAvailable}/><b>Disponível agora</b></label>
      <span className="techFeatureName">{f.name||'Sem nome'}</span>
      <span className="pill mini">{f.grade||'—'}</span>
      {!available&&<span className="pill mini warnPill">Bloqueada</span>}
    </summary>
    <div className="techFeatureBody">
      <Field label="Nome"><input value={f.name} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'name',value:e.target.value})}/></Field>
      <div className="grid2"><Field label="Grau"><input value={f.grade} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'grade',value:e.target.value})}/></Field><Field label="Custo"><input value={f.cost} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'cost',value:e.target.value})}/></Field></div>
      <div className="grid3"><Field label="Alvo"><input value={f.target||''} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'target',value:e.target.value})}/></Field><Field label="Área"><input value={f.area||''} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'area',value:e.target.value})}/></Field><Field label="Duração"><input value={f.duration||''} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'duration',value:e.target.value})}/></Field></div>
      <Field label="Link de imagem/print da habilidade"><input placeholder="https://..." value={f.imageUrl||''} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'imageUrl',value:e.target.value})}/></Field>
      {f.imageUrl&&<img className="techPreview" src={f.imageUrl} alt="Print da habilidade"/>}
      <textarea value={f.text} onChange={e=>dispatch({type:'updateTechFeature',key:keyName,id:f.id,field:'text',value:e.target.value})}/>
      <button className="danger" onClick={()=>dispatch({type:'removeTechFeature',key:keyName,id:f.id})}>Remover</button>
    </div>
  </details>;
}
function TechList({title,keyName,list,dispatch}){
  const availableCount=list.filter(f=>f.available!==false).length;
  return <div><h3>{title}: {availableCount}/{list.length} disponíveis</h3><button onClick={()=>dispatch({type:'addTechFeature',key:keyName})}>Adicionar {title}</button><div className="techFeatureCards">{list.map(f=><TechFeatureCard key={f.id} f={f} keyName={keyName} dispatch={dispatch}/>)}</div></div>;
}



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

function splitClassFeatures(sp){
  const parsed=parseClassFeaturesByLevel(sp);
  const choice=parsed.choicesByLevel.flatMap(g=>g.abilities);
  return {base:parsed.base, choice, choicesByLevel:parsed.choicesByLevel, tables:parsed.tables};
}
function levelAllowedForClassFeature(c, feature){ return Number(c?.level||1) >= Number(feature?.level||99); }
function classFeatureChoiceLimit(c){
  const base=Math.max(0, Number(c.level||1)-1);
  const talentsFromShared=Math.max(0, (c.choices?.talents||[]).length - originOnlyTalentBonus(c));
  const featureBonus=(semTecnicaId(c.originId)||escolhidoId(c.originId)) ? semTecnicaExtraClassFeatureLimit(c) : 0;
  return Math.max(0, base-talentsFromShared) + featureBonus;
}
function levelUpPoolBreakdown(c){
  const base=Math.max(0, Number(c.level||1)-1);
  const featuresSelected=(c.choices?.mundaneFeatures||[]).length;
  const talentsSelected=(c.choices?.talents||[]).length;
  const originBonus=originOnlyTalentBonus(c);
  const talentsFromShared=Math.max(0, talentsSelected-originBonus);
  const featureBonus=(semTecnicaId(c.originId)||escolhidoId(c.originId)) ? semTecnicaExtraClassFeatureLimit(c) : 0;
  const sharedUsed=featuresSelected+talentsFromShared;
  const sharedRemaining=Math.max(0, base-sharedUsed);
  return {base, featuresSelected, talentsSelected, talentsFromShared, originBonus, featureBonus, sharedUsed, sharedRemaining};
}
function ClassFeatureChoiceCard({feature,selected,blocked,lockedReason,onToggle}){
  const [open,setOpen]=useState(false);
  const txt=formatRuleText(feature.text||'');
  return <div className={selected?'feature selected':'feature'}>
    <div className="row">
      <h3>{feature.title}</h3>
      {feature.level&&<span className="pill mini">Nível {feature.level}</span>}
      <input type="checkbox" checked={selected} disabled={blocked && !selected} onChange={onToggle}/>
      <button className="q" onClick={()=>setOpen(true)}>?</button>
    </div>
    {blocked&&!selected&&<small className="warn">{lockedReason||'Limite atingido'}</small>}
    <p>{mechanicalPreview(feature.text,380)}</p>
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

function TaskList({tasks=[],dispatch}){
  const list = Array.isArray(tasks) ? tasks : [];
  const pending = list.filter(t=>!(t?.ok === true || t?.status === 'complete' || t?.complete === true));
  if(!pending.length){
    return <div className="taskList"><div className="good"><CheckCircle2 size={16}/><span>Nenhuma pendência encontrada.</span></div></div>;
  }
  return <div className="taskList">{pending.map((t,i)=>{
    const label = t?.label || t?.title || String(t || 'Pendência');
    const detail = t?.reason || t?.detail || t?.message || '';
    return <div key={t?.id || i} className="bad">
      <AlertTriangle size={16}/>
      <span><b>{label}</b>{detail ? <small>{detail}</small> : null}</span>
      {t?.tab && dispatch && <button onClick={()=>dispatch({type:'tab',tab:t.tab})}>Ir</button>}
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
function SpecializationSkillPicker({c,dispatch,cfg,skillPool,skillMax}){
  const selected=c.choices.skills||[];
  const groups=cfg.skillChoiceGroups||[];
  const groupOptionIds=new Set(groups.flatMap(g=>g.options));
  const fixedIds=new Set(cfg.skillFixed);
  const baseIds=new Set(cfg.skillBaseAllowed);
  const baseCandidates=skillPool.filter(s=>baseIds.has(s.id));
  const freeCandidates=skillPool.filter(s=>!baseIds.has(s.id) && !fixedIds.has(s.id) && !groupOptionIds.has(s.id));
  const baseChosen=baseSkillChosenCount(c,cfg);
  const freeMax=cfg.skillAnyNeed+extraSkillSlots(c);
  const freeChosen=selected.filter(id=>freeCandidates.some(s=>s.id===id)).length;
  const adjustedLimit=Math.max(0,skillMax-oficioExtraWeight(c));
  const onChange=arr=>dispatch({type:'choice',key:'skills',value:clampSelection(arr,skillPool.map(s=>s.id),adjustedLimit)});
  return <div className="skillPickerBlock">
    {cfg.skillFixed.length>0 && <div className="notice good"><b>Perícias fixas da especialização:</b> {cfg.skillFixed.map(id=>skillName(id)).join(', ')} — sempre treinadas de graça, não gastam o limite de perícias livres nem o grupo obrigatório abaixo.</div>}
    {baseCandidates.length>0 && <>
      <div className={baseChosen<cfg.skillBaseNeed?'notice warnNotice':'notice'}><b>Grupo obrigatório da especialização: {baseChosen}/{cfg.skillBaseNeed}</b><span> — {baseCandidates.some(s=>s.id==='oficio')&&baseCandidates.length===1?`escolha ao menos ${cfg.skillBaseNeed} Ofício(s) diferentes (cada linha de Ofício conta como 1).`:`escolha ao menos ${cfg.skillBaseNeed} entre estas ${baseCandidates.length} perícias específicas do livro. Cada uma conta aqui, não nas perícias livres abaixo.`}</span></div>
      <LimitedChoiceGrid title="Perícias do grupo obrigatório" items={baseCandidates.map(s=>({...s, originalText:(SKILL_HELP[s.id]?SKILL_HELP[s.id]+' ':'')+'Conta para o grupo obrigatório desta especialização.'}))} selected={selected} limit={adjustedLimit} onChange={onChange}/>
      {selected.includes('oficio') && <OfficeSelector c={c} dispatch={dispatch}/>}
    </>}
    {groups.map((g,gi)=>{ const chosen=choiceGroupChosenCount(c,g); const candidates=skillPool.filter(s=>g.options.includes(s.id)); return <div key={gi}>
      <div className={chosen<g.count?'notice warnNotice':'notice'}><b>Escolha obrigatória: {g.options.map(skillName).join(' ou ')} ({chosen}/{g.count})</b><span> — obrigatória além do grupo acima, não conta como perícia livre.</span></div>
      <LimitedChoiceGrid title={`Escolha ${g.count} entre ${g.options.map(skillName).join(' ou ')}`} items={candidates.map(s=>({...s, originalText:(SKILL_HELP[s.id]?SKILL_HELP[s.id]+' ':'')+'Escolha obrigatória desta especialização.'}))} selected={selected} limit={adjustedLimit} onChange={onChange}/>
    </div>; })}
    <ExtraSkillAttributePicker c={c} dispatch={dispatch}/>
    <div className="notice"><b>Perícias livres: {freeChosen}/{freeMax}</b><span> — qualquer perícia treinável, além das {cfg.skillBaseNeed} do grupo obrigatório{groups.length>0?` e das escolhas obrigatórias`:''}{cfg.skillFixed.length>0?` e das ${cfg.skillFixed.length} fixas`:''}. ({cfg.skillAnyNeed} da especialização + {extraSkillSlots(c)} por atributo.)</span></div>
    <LimitedChoiceGrid title="Outras perícias treináveis" items={freeCandidates.map(s=>({...s, originalText:SKILL_HELP[s.id]}))} selected={selected} limit={adjustedLimit} onChange={onChange}/>
  </div>;
}
function ExtraSkillAttributePicker({c,dispatch}){
  const intMod=Math.max(0,mod(finalAttr(c,'intelligence')));
  const wisMod=Math.max(0,mod(finalAttr(c,'wisdom')));
  const chosenAttr=c.choices?.extraSkillAttribute||'';
  const chosenMod=extraSkillAttributeMod(c);
  const masterCount=extraSkillMasterCount(c);
  const setAttr=v=>{ if(v!==chosenAttr && chosenAttr && !confirm('No livro, a escolha entre Inteligência ou Sabedoria para perícias extras é definitiva e não pode ser revertida após a criação. Trocar mesmo assim?')) return; dispatch({type:'setExtraSkillAttribute',value:v}); };
  return <div className="notice">
    <b>Perícias extras por atributo (escolha definitiva no livro):</b>
    <div className="row" style={{marginTop:6}}>
      <select value={chosenAttr} onChange={e=>setAttr(e.target.value)}>
        <option value="">— nenhuma escolhida —</option>
        <option value="intelligence">Inteligência (mod. +{intMod})</option>
        <option value="wisdom">Sabedoria (mod. +{wisMod})</option>
      </select>
      {chosenAttr && chosenMod>0 && <Field label="Quantas dessas viram Perícia Mestre (em perícia já treinada) em vez de nova treinada?"><input type="number" min="0" max={chosenMod} value={masterCount} onChange={e=>dispatch({type:'setExtraSkillMasterCount',value:Math.max(0,Math.min(chosenMod,Number(e.target.value)||0))})}/></Field>}
    </div>
    <span>{chosenAttr?` Você ganha ${chosenMod} perícia(s) extra(s) por ${chosenAttr==='intelligence'?'Inteligência':'Sabedoria'}: ${extraSkillSlots(c)} vira(m) nova(s) perícia(s) treinada(s)${masterCount>0?` e ${masterCount} vira(m) Perícia Mestre em uma perícia já treinada`:''}.`:' Escolha Inteligência ou Sabedoria para liberar perícias extras — o livro não permite somar as duas.'}</span>
  </div>;
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
  const level=Number(feature.level||1);
  const available=Number(c.level||1)>=level;
  return <div className={available?'selectCard readonly baseChoiceCard':'selectCard readonly baseChoiceCard locked'}>
    <div className="selectCardHead"><h3>{feature.title}</h3><span className={available?'pill':'pill mutedPill'}>{available?'Liberado':`Nível ${level}`}</span></div>
    <div className="selectPreview readableText">{mechanicalPreview(feature.text,480)}</div>
    {needsChoice&&<div className="choiceBlock"><h4>Escolha exigida por esta habilidade</h4>{options.length?<div className="chipGrid">{options.map(opt=><label key={opt} className={selected.includes(opt)?'chipCheck active':'chipCheck'}><input type="checkbox" checked={selected.includes(opt)} onChange={()=>dispatch({type:'choiceObject',key:'baseFeatureChoices',id:feature.id,value:toggleArrayValue(selected,opt)})}/>{opt}</label>)}</div>:<div className="notice">Não foi possível detectar uma lista fechada de opções no texto extraído. Revise no texto completo e selecione a opção no compêndio/admin quando o banco for revisado.</div>}</div>}
    <button onClick={()=>setOpen(true)}>Ler texto completo</button>
    {open&&<ModalText title={feature.title} text={txt} onClose={()=>setOpen(false)}/>} 
  </div>
}
function AttributeRollPanel({c,dispatch}){
  const rs=latestRollSet(c); const usedRollIds=Object.values(c.attributes.assigned).filter(Boolean);
  return <Panel title="2. Atributos por rolagem" help="Role seis resultados e distribua. Limite padrão: 20; Derivado, Restringido, talentos e acessórios podem aumentar esse limite."><button className="gold" onClick={()=>dispatch({type:'roll'})}>{rs?'Rerolar atributos':'Rolar atributos'}</button>{rs&&<><div className="rolls compactRolls">{rs.rolls.map(r=><span key={r.id} className={usedRollIds.includes(r.id)?'used':''}>{r.total}<small>{r.dice.join(', ')} − {r.dropped}</small></span>)}</div><AttributeCapNotice c={c}/><div className="attrGrid improvedAttrs compactAttrs">{ATTRS.map(([k,label,abbr])=>{ const val=finalAttr(c,k); const raw=rawFinalAttr(c,k); const cap=attributeCap(c,k); return <div className={raw>cap?'attrCard warnCard':'attrCard'} key={k}><h3>{label}<Tooltip text={ATTRIBUTE_HELP[k]}/></h3><select value={c.attributes.assigned[k]||''} onChange={e=>dispatch({type:'assignAttr',attr:k,rollId:e.target.value})}><option value="">—</option>{rs.rolls.map(r=><option key={r.id} value={r.id} disabled={usedRollIds.includes(r.id)&&c.attributes.assigned[k]!==r.id}>{r.total}</option>)}</select><div className="attrResult"><b>{val??'—'}</b><strong>{signed(mod(val))}</strong><small>{abbr}</small></div><small className="muted">Bruto {raw??'—'} · limite {cap}</small><small className="muted">Origem +{originBonusValue(c,k)} · Nível +{Number(attributeIncreaseMap(c)[k]||0)} · Item +{attributeItemBonus(c,k)}</small></div>})}</div></>}</Panel>
}
function Creation({c,state,dispatch,tasks}){
  const sp=specialization(c); const org=origin(c); const cfg=specTrainingConfig(c);
  const allowedRes=RESISTANCES.filter(([id])=>cfg.resAllowed.includes(id));
  const skillPool=trainableSkills().filter(s=>!cfg.skillForbidden.includes(s.id));
  const skillMax=skillLimit(c), resMax=resistanceLimit(c);
  return <section className="grid gap creationPage">
    <Panel title="1. Dados básicos"><div className="grid3"><Field label="Nome"><input value={c.name} onChange={e=>dispatch({type:'update',key:'name',value:e.target.value})}/></Field><Field label="Jogador"><input value={c.playerName} onChange={e=>dispatch({type:'update',key:'playerName',value:e.target.value})}/></Field><Field label="Campanha"><input value={c.campaign} onChange={e=>dispatch({type:'update',key:'campaign',value:e.target.value})}/></Field><Field label="Nível"><input type="number" min="1" max="20" value={c.level} onChange={e=>dispatch({type:'update',key:'level',value:Number(e.target.value)})}/></Field><Field label="Grau"><Select value={c.grade} onChange={v=>dispatch({type:'update',key:'grade',value:v})}>{['Quarto','Terceiro','Segundo','Primeiro','Especial'].map(x=><option key={x}>{x}</option>)}</Select></Field></div></Panel>
    <AttributeRollPanel c={c} dispatch={dispatch}/>
    <AttributeLimitControls c={c} dispatch={dispatch}/>
    {totalAttributeIncreaseEntitlement(c)>0&&<AttributeIncreaseManager c={c} dispatch={dispatch}/>}    
    <Panel title="3. Origem"><Field label="Origem"><Select value={c.originId} onChange={v=>{ if(v!==c.originId && hasOriginDependentChoices(c) && !confirm('Trocar de Origem reinicia a distribuição de bônus de atributo da origem. Perícias, aptidões e talentos já escolhidos continuam, mas podem ficar inválidos para a nova origem. Continuar?')) return; dispatch({type:'update',key:'originId',value:v}); }}><option value="">Escolha</option>{ALL_ORIGINS.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>{org?.homebrew&&<div className="notice warnNotice"><b>Conteúdo homebrew (não-oficial):</b> "O Escolhido" não é do livro oficial. Vem do homebrew "Abençoado pelos Céus", de @Vai Wilson Vai.</div>}{org&&<MechanicalSummary title={org.name} summary={ORIGIN_SUMMARY[org.id]} fallbackText={org.originalText}/>}<OriginBonusPanel c={c} dispatch={dispatch}/></Panel>
    <Panel title="4. Especialização e escolhas principais"><div className="grid3"><Field label="Especialização"><Select value={c.specializationId} onChange={v=>{ if(v!==c.specializationId && (c.choices?.resistances||[]).length>0 && !confirm('Trocar de Especialização pode cortar resistências já escolhidas que não são mais permitidas (perícias treinadas continuam, mas podem ficar fora do novo limite). Continuar?')) return; dispatch({type:'update',key:'specializationId',value:v}); }}><option value="">Escolha</option>{rules.specializations.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field><Field label="Atributo de CD" help="Atributo usado para calcular a Classe de Dificuldade (CD) das suas habilidades de especialização/técnica. As opções mudam conforme a especialização escolhida."><Select value={c.cdAttribute} onChange={v=>dispatch({type:'update',key:'cdAttribute',value:v})}><option value="">—</option>{ATTRS.filter(([k])=>cfg.cdAttributes.includes(k)).map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select></Field>{cfg.hasEnergy && cfg.energyAddsAttribute && <Field label="Atributo de Energia" help="Esta especialização soma o modificador deste atributo ao máximo de PE. Costuma ser igual ao Atributo de CD."><div className="row"><Select value={c.energyAttribute} onChange={v=>dispatch({type:'update',key:'energyAttribute',value:v})}><option value="">—</option>{ATTRS.filter(([k])=>cfg.cdAttributes.includes(k)).map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select>{!!c.cdAttribute && c.energyAttribute!==c.cdAttribute && <button type="button" onClick={()=>dispatch({type:'update',key:'energyAttribute',value:c.cdAttribute})}>Igual à CD</button>}</div></Field>}</div>{sp&&<MechanicalSummary title={sp.name} summary={SPEC_SUMMARY[sp.id]} fallbackText={sp.originalText}/>}<div className="notice"><b>Treinamentos/Maestrias:</b> {cfg.masteryText}</div><LimitedChoiceGrid title={`Resistências (${(c.choices.resistances||[]).length}/${resMax})`} items={allowedRes.map(([id,name])=>({id,name,originalText:RESISTANCE_HELP[id]}))} selected={c.choices.resistances||[]} limit={resMax} onChange={arr=>dispatch({type:'choice',key:'resistances',value:clampSelection(arr,cfg.resAllowed,resMax)})}/><SpecializationSkillPicker c={c} dispatch={dispatch} cfg={cfg} skillPool={skillPool} skillMax={skillMax}/> {masterSkillLimit(c)>0&&<LimitedChoiceGrid title={`Perícias Mestre (${(c.choices.masterSkills||[]).length}/${masterSkillLimit(c)})`} items={trainableSkills().filter(s=>selectedTrainedSkills(c).includes(s.id))} selected={c.choices.masterSkills||[]} limit={masterSkillLimit(c)} onChange={arr=>dispatch({type:'choice',key:'masterSkills',value:arr.slice(0,masterSkillLimit(c))})}/>}</Panel>
    <Panel title="5. Equipamento inicial"><div className="notice"><b>Equipamento inicial é resolvido no Registro e Inventário.</b> Itens gratuitos da especialização não contam nos 2 itens de custo 1.</div><button className="gold" onClick={()=>dispatch({type:'tab',tab:'Registro e Inventário'})}>Ir para Registro e Inventário</button><button onClick={()=>dispatch({type:'applyStarterEquipment'})}>Aplicar equipamentos gratuitos iniciais</button></Panel>
    <Panel title="Pendências"><TaskList tasks={tasks} dispatch={dispatch}/></Panel>
  </section>
}
function LevelUpPoolAudit({c}){
  const b=levelUpPoolBreakdown(c);
  return <Panel title="De onde vêm suas escolhas de nível (auditoria)" help='Habilidades de Classe e Talentos disputam o mesmo pool de "nível − 1" escolhas: cada uma escolhida consome 1 vaga do pool, então escolher mais de um lado reduz o limite do outro. Bônus de Origem para talentos e bônus de Habilidade de Classe (Sem Técnica/O Escolhido) ficam fora do pool — são somados à parte, não competem com nada.'>
    <div className="poolAuditGrid">
      <div className="poolAuditItem"><b>{b.base}</b><span>Pool compartilhado (nível − 1)</span></div>
      <div className="poolAuditItem"><b>{b.featuresSelected}</b><span>→ gasto em Habilidades de Classe</span></div>
      <div className="poolAuditItem"><b>{b.talentsFromShared}</b><span>→ gasto em Talentos (pool)</span></div>
      <div className="poolAuditItem"><b>{b.sharedRemaining}</b><span>Pool ainda livre</span></div>
      <div className="poolAuditItem origin"><b>{b.originBonus}</b><span>Talentos extras só de Origem<br/>(fora do pool)</span></div>
      <div className="poolAuditItem origin"><b>{b.featureBonus}</b><span>Habilidades de Classe extras<br/>(Sem Técnica/O Escolhido, fora do pool)</span></div>
    </div>
  </Panel>;
}
function Mundane({c,dispatch}){
  const sp=specialization(c), org=origin(c); const tMax=talentLimit(c); const selectedTalents=c.choices.talents||[]; const cfg=specTrainingConfig(c); const selectedFeatures=c.choices.mundaneFeatures||[]; const featureLimit=classFeatureChoiceLimit(c); const split=splitClassFeatures(sp);
  const totalPossible = split.choicesByLevel.filter(g=>Number(c.level||1)>=g.level).reduce((sum,g)=>sum+g.abilities.length,0);
  const pool=levelUpPoolBreakdown(c);
  return <section className="grid gap mundanePage"><AttributeLimitControls c={c} dispatch={dispatch}/><Panel title="Perfil Mundano"><div className="grid3"><Stat label="Especialização" value={sp?.name||'—'}/><Stat label="Origem" value={org?.name||'—'}/><Stat label="Exaustão" value={c.mundaneProfile?.exhaustionLevel||0}/></div><div className="notice"><b>Maestrias/Treinamentos:</b> {cfg.masteryText}</div></Panel>
    <details className="collapsePanel"><summary>Habilidades automáticas e escolhas fixas (Origem)</summary><div className="collapseContent"><div className="classSection"><h3>Origem</h3><p className="muted">Entram de graça, não disputam pool com Talentos nem com Habilidades de Classe.</p><div className="classAutoGrid">{org?<ClassFeatureReadOnly feature={{title:org.name,text:org.originalText}}/>:<p>Escolha uma origem.</p>}</div></div><div className="classSection"><h3>Base da Especialização</h3><p className="muted">Habilidades que entram automaticamente. Se o texto exigir uma escolha, selecione uma opção detectada no próprio texto.</p><div className="classAutoGrid">{split.base.length?split.base.map(f=><ClassBaseCard key={f.id} feature={f} c={c} dispatch={dispatch}/>):<p>Escolha uma especialização.</p>}</div></div></div></details>
    <LevelUpPoolAudit c={c}/>
    <Panel title={`Habilidades de Classe por nível: ${selectedFeatures.length}/${featureLimit}`}><p className="muted">Habilidades escolhíveis agrupadas por nível mínimo. Texto extraído do livro, sem resumo.</p><div className="notice"><b>Disponíveis no seu nível:</b> {totalPossible}. <b>Limite atual:</b> {featureLimit} ({pool.base-pool.talentsFromShared} do pool compartilhado{pool.featureBonus>0?` + ${pool.featureBonus} de bônus de origem`:''}).</div><div className="levelAbilityList">{split.choicesByLevel.length?split.choicesByLevel.map(group=><ClassLevelGroup key={group.level} group={group} c={c} selected={selectedFeatures} limit={featureLimit} dispatch={dispatch}/>):<p>Nenhuma habilidade de classe detectada para esta especialização.</p>}</div>{split.tables.length>0&&<details className="collapseBox"><summary>Tabelas e desbloqueios detectados</summary><div className="classAutoGrid">{split.tables.map(f=><ClassFeatureReadOnly key={f.id} feature={f}/>)}</div></details>}</Panel>
    <TalentMechanicsPanel c={c} dispatch={dispatch}/><Panel title={`Talentos e escolhas de level up: ${selectedTalents.length}/${tMax}`}><p className="muted">Talentos competem com habilidades de classe quando o level up permite escolher entre um ou outro. Use “?” para consultar texto e requisitos.</p><div className="notice"><b>Limite atual:</b> {tMax} ({pool.base-pool.featuresSelected} do pool compartilhado + {pool.originBonus} exclusivos de Origem, que não competem com Habilidades de Classe).</div>{escolhidoId(c.originId)&&<div className="notice"><b>Talentos exclusivos de O Escolhido (homebrew) liberados abaixo.</b> O Grande Lorde e O Grande Duque são mutuamente exclusivos; Ancestral de Nascien exige nível 8.</div>}<LimitedChoiceGrid title="Talentos disponíveis" items={talentsPool(c)} selected={selectedTalents} limit={tMax} requirementCheck={t=>escolhidoTalentRequirementStatus(c,t)} onChange={arr=>dispatch({type:'choice',key:'talents',value:clampSelection(arr,talentsPool(c).map(t=>t.id),tMax)})}/></Panel></section> }
function HpGainManager({c,dispatch}){
  const sp=specialization(c); const sr=currentSpecRuleV54(c);
  const hitDie=sr.hitDie||sp?.hitDie||'d8'; const dieMax=hpDieMax(hitDie);
  const fixedValue=sr.hpPerLevel||sp?.hpPerLevel||5;
  const level=Number(c.level||1);
  if(level<2) return null;
  const levels=Array.from({length:level-1},(_,i)=>i+2);
  return <Panel title={`Pontos de Vida por nível (dado ${hitDie})`} help={`A cada nível a partir do 2º, escolha como ganhar PV: Mínimo (sempre 1), Fixo (${fixedValue}, valor do livro) ou Rolar (role o dado ${hitDie} no Discord e digite o resultado, de 1 a ${dieMax}, para evitar rolagens não conferíveis).`}>
    <div className="hpGainGrid">
      {levels.map(lvl=>{
        const g=c.hpGains?.[lvl]||{mode:'fixed'};
        const set=(mode,value)=>dispatch({type:'setHpGain',level:lvl,mode,value});
        return <div key={lvl} className="hpGainRow">
          <b>Nível {lvl}</b>
          <label><input type="radio" name={`hpgain-${lvl}`} checked={g.mode==='min'} onChange={()=>set('min',1)}/> Mínimo (1)</label>
          <label><input type="radio" name={`hpgain-${lvl}`} checked={!g.mode||g.mode==='fixed'} onChange={()=>set('fixed',fixedValue)}/> Fixo ({fixedValue})</label>
          <label><input type="radio" name={`hpgain-${lvl}`} checked={g.mode==='roll'} onChange={()=>set('roll',g.mode==='roll'?g.value:1)}/> Rolar (Discord)</label>
          {g.mode==='roll' && <input className="hpGainRollInput" type="number" min="1" max={dieMax} value={g.value||1} onChange={e=>set('roll',Math.max(1,Math.min(dieMax,Number(e.target.value)||1)))}/>}
        </div>;
      })}
    </div>
  </Panel>;
}
function LevelUp({c,dispatch}){
  const [to,setTo]=useState(Math.min(20,Number(c.level||1)+1)); const tasks=levelTasks(c,Number(to)); const attrGainBetween=Array.from({length:Math.max(0,Number(to)-Number(c.level||1))},(_,i)=>Number(c.level||1)+i+1).filter(l=>l%4===0).length*2;
  return <section className="grid gap"><Panel title="Level Up Guiado"><div className="grid3"><Stat label="Nível atual" value={c.level}/><Field label="Novo nível"><input type="number" min={Number(c.level||1)+1} max="20" value={to} onChange={e=>setTo(e.target.value)}/></Field><button className="gold" onClick={()=>dispatch({type:'patch',patch:{level:Number(to),levelHistory:[{id:uid(),from:c.level,to:Number(to),at:new Date().toISOString(),tasks},...c.levelHistory]}})}>Aplicar Level Up</button></div>{attrGainBetween>0&&<div className="notice warnNotice"><b>Este avanço libera +{attrGainBetween} pontos de atributo.</b> Após aplicar, distribua abaixo.</div>}<div className="taskList">{tasks.map((t,i)=><div key={i} className="bad"><AlertTriangle/><span>{t}</span></div>)}</div><h3>Histórico</h3>{c.levelHistory.map(h=><details key={h.id}><summary>Nível {h.from} → {h.to}</summary>{h.tasks.map(t=><p key={t}>{t}</p>)}</details>)}</Panel><HpGainManager c={c} dispatch={dispatch}/><AttributeIncreaseManager c={c} dispatch={dispatch}/></section>
}


// =====================================================
// v5.3 — revisão completa das Origens: regras, escolhas e efeitos de core
// =====================================================
const ORIGIN = {
  INATO:'inato', HERDADO:'herdado', DERIVADO:'derivado', RESTRINGIDO:'restringido',
  FETO:'feto_amaldiçoado_híbrido', SEM_TECNICA:'sem_técnica', MUTANTE:'corpo_amaldiçoado_mutante',
  ESCOLHIDO:'hb_o_escolhido'
};
const PHYSICAL_ATTRS = ['strength','dexterity','constitution'];
const ANATOMY_FEATURES = [
  {id:'alma_maldita', name:'Alma Maldita', text:'Alma Maldita. Sua alma é impregnada com energia amaldiçoada, assumindo um aspecto maldito e difícil de se alterar. Quando uma criatura for causar dano na sua alma, esse dano é reduzido à metade antes do teste de Integridade; a partir do nível 15, ele é anulado. Essa habilidade funciona 2 vezes por dia, 3 no nível 6, 4 no nível 12 e 5 no nível 18.'},
  {id:'anatomia_incompreensivel', name:'Anatomia Incompreensível', text:'Anatomia Incompreensível. O seu corpo tem uma forma que é difícil de compreender. Você tem 25% de chance (resultado “1” em 1d4) de ignorar o dano adicional de um ataque crítico ou um ataque furtivo. No nível 15, se torna 50% (resultado “1 ou 2” em 1d4).'},
  {id:'arma_natural', name:'Arma Natural', text:'Arma Natural. Com uma fisionomia estranha, você possui garras, dentes afiados, cauda ou outro apêndice corporal próprio para ataques. Você recebe um ataque natural que causa 1d8 de dano Cortante, Perfurante ou de Impacto com os traços: Fineza e Enérgica. Esta arma natural conta como um ataque desarmado e se beneficia de efeitos que afetariam ataques desarmados. Caso seu dano desarmado seja superior ao da arma natural, ao invés disso aumente o seu dano desarmado em 1 nível.'},
  {id:'articulacoes_extensas', name:'Articulações Extensas', text:'Articulações Extensas. Suas juntas são mais longas, ou suas garras são estendidas, aumentando a distância com que pode atacar. O alcance dos seus ataques corpo a corpo aumenta em 1,5 metros.'},
  {id:'bracos_extras', name:'Braços Extras', text:'Braços Extras. Seu corpo possui um par de braços adicionais. Você recebe +2 em testes de prestidigitação e, se tiver pelo menos duas mãos livres, aplica esse bônus em testes de atletismo. E recebe um par adicional de mãos, permitindo você equipar dois equipamentos de uma mão ou um equipamento de duas mãos adicional, assim como agarrar duas criaturas e outros benefícios à discrição do Narrador.'},
  {id:'capacidade_voo', name:'Capacidade de Voo', text:'Capacidade de Voo. No seu corpo repousa uma capacidade de voo, que com um estímulo de energia se torna ativa. Como uma ação livre, você pode gastar 1 ponto de energia para transformar seu Deslocamento de Caminhada em Deslocamento de Voo por uma rodada.'},
  {id:'carapaca_mutante', name:'Carapaça Mutante', text:'Carapaça Mutante. Uma carapaça cobre o seu corpo, sendo uma mutação bizarra, mas resistente. Você recebe redução de dano contra danos físicos igual ao seu bônus de treinamento; no nível 10, você recebe resistência a um tipo de dano físico à sua escolha. Depois de feita essa escolha não pode ser mudada.'},
  {id:'corpo_especializado', name:'Corpo Especializado', text:'Corpo Especializado. Seu corpo se desenvolve de maneira a possuir um foco. Escolha uma perícia: você recebe um bônus de 1d4 nela.'},
  {id:'desenvolvimento_exagerado', name:'Desenvolvimento Exagerado', text:'Desenvolvimento Exagerado. Seu corpo se desenvolve de maneira exagerada, ultrapassando o formato e o porte padrão. Você aumenta sua categoria de tamanho em 1 e recebe 1 ponto de vida adicional por nível.'},
  {id:'devorador_energia', name:'Devorador de Energia', text:'Devorador de Energia. Sendo envolvido com a própria energia, você pode a devorar quando resiste a uma habilidade originada dela. Quando passar em um teste de resistência para resistir a um Feitiço, você recebe 1 ponto de energia temporário cumulativo.'},
  {id:'instinto_sanguinario', name:'Instinto Sanguinário', text:'Instinto Sanguinário. Em sua essência há um instinto por sangue e violência. Você adiciona o seu bônus de treinamento na sua Iniciativa; enquanto em uma cena de combate, você também adiciona seu bônus de treinamento na sua Atenção.'},
  {id:'olhos_sombrios', name:'Olhos Sombrios', text:'Olhos Sombrios. Seus olhos guardam escuridão, sendo sombrios por natureza e aguçados. Você recebe Visão no Escuro (p.297). Além disso, você se torna treinado em Percepção e recebe um bônus de +2 em rolagens com a perícia. No 12º nível você passa a ignorar completamente efeitos de escuridão Leve e Total.'},
  {id:'pernas_extras', name:'Pernas Extras', text:'Pernas Extras. No seu corpo cresce um par de pernas extras. Seu deslocamento aumenta em 4,5 metros e você passa a ignorar terreno difícil que esteja no solo.'},
  {id:'presenca_nefasta', name:'Presença Nefasta', text:'Presença Nefasta. Com um semblante vil, a sua própria presença é nefasta. Toda criatura hostil, ao vê-lo pela primeira vez, deve realizar um teste de resistência de Vontade contra sua CD Amaldiçoada. Em uma falha, ela fica amedrontada por uma rodada. Em um sucesso, ela consegue lidar parcialmente com a sua presença, ficando abalada por uma rodada.'},
  {id:'sangue_toxico', name:'Sangue Tóxico', text:'Sangue Tóxico. O seu sangue é tóxico, capaz de corroer o que entra em contato com. Sempre que sofrer dano de um ataque corpo a corpo, o atacante perde vida igual ao seu modificador de Constituição.'}
];
// =====================================================
// Homebrew — Origem "O Escolhido" e Novo Estilo das Sombras "Tocado por Deus"
// Conteúdo extra, não-oficial (por @Vai Wilson Vai). Estruturalmente é uma variante
// temática de Sem Técnica: mesmo bônus de atributo, mesmo Empenho Implacável e mesmo
// acesso a Novo Estilo da Sombra + Domínio Simples no 4º nível.
// =====================================================
function escolhidoId(id){ return id===ORIGIN.ESCOLHIDO; }
const ESCOLHIDO_ORIGIN = {
  id: ORIGIN.ESCOLHIDO, type:'origin', name:'O Escolhido (Homebrew)', homebrew:true,
  isRestricted:false, grantsCursedTechnique:false,
  attributeBonusRule:{bonuses:[], allowedAttributes:ATTRS.map(a=>a[0]), stackSameAttribute:false},
  originalText:'[Conteúdo homebrew — "Abençoado pelos Céus", por @Vai Wilson Vai, inspirado em Sir Galahad. Não é conteúdo oficial do livro.]\n\nVocê foi consagrado desde o nascimento pela vontade divina, selado como o guia destinado a conduzir o povo através das eras de incerteza. Sua existência não é mero acaso, mas um desígnio maior: restaurar a esperança onde ela foi esquecida, despertar a reciprocidade entre os homens e plantar paz e piedade até nos espíritos mais endurecidos.\n\nBônus de Atributo. O Escolhido recebe 4 pontos adicionais para distribuir entre seus atributos, com um máximo de 3 pontos no mesmo atributo.\n\nAquele Abençoado por Deus. O Escolhido carrega a bênção do Pai de Todos, um dom que fortalece seu corpo e sua alma, tornando-o capaz de suportar provações que derrubariam qualquer outro. Você recebe +1 ponto de vida adicional por nível; a partir do nível 10, esse bônus passa a ser +2 por nível. Além disso, você se torna treinado em 2 perícias adicionais. Sempre que subir de nível e rolar para determinar o aumento de sua vida máxima, caso o resultado seja menor que a média possível, você pode rolar novamente e permanecer com o maior valor obtido.\n\nEmpenho Implacável. Idêntico ao da origem Sem Técnica — veja o texto oficial dela. No 4º nível você recebe acesso ao Novo Estilo da Sombra (aqui, "Tocado por Deus") e à aptidão amaldiçoada Domínio Simples. Você também pode escolher os mesmos talentos da origem Sem Técnica, além dos talentos exclusivos de O Escolhido.',
  features: [], choices: []
};
const ALL_ORIGINS = [...rules.origins, ESCOLHIDO_ORIGIN];
const ESCOLHIDO_TALENTS = [
  {id:'hb_ancestral_de_nascien', name:'Ancestral de Nascien', homebrew:true, prereqText:'O Escolhido e Nível 8', originalText:'Você carrega o legado de um ancestral que foi um rei sábio e corajoso; em momentos difíceis, essa herança desperta e o guia, garantindo que você nunca enfrente as adversidades sozinho. Você recebe vantagem para resistir às condições Confuso, Amedrontado, Abalado e Enfeitiçado. No nível 12 você passa a receber vantagem em Aterrorizado e Desorientado, além dos que foram mencionados.\n\n[Pré-Requisitos: O Escolhido e Nível 8]'},
  {id:'hb_o_maior_honrado', name:'O Maior Honrado', homebrew:true, prereqText:'O Escolhido', originalText:'Você é o mais honrado entre os céus e a terra, uma rara exceção entre os mortais, alguém cuja existência transcende o comum e redefine o que significa ser humano. Você recebe +2 em testes de acerto e dano; nos níveis 4, 8, 12, 16 e 20 você recebe +1 em ambos de novo.\n\n[Pré-Requisito: O Escolhido]'},
  {id:'hb_cavaleiro_da_tavola_redonda', name:'Cavaleiro da Távola Redonda', homebrew:true, prereqText:'O Escolhido', originalText:'Você figura entre os Cavaleiros mais importantes da história, talvez o maior de todos. O treinamento implacável que o moldou elevou seu corpo e sua mente a um nível extraordinário. Você pode escolher um grupo de armas: esse grupo recebe um aumento de 1 nível em seus ataques. Sempre que subir de treinamento, recebe-se +1 nível.\n\n[Pré-Requisito: O Escolhido]'},
  {id:'hb_o_grande_lorde', name:'O Grande Lorde', homebrew:true, prereqText:'O Escolhido, treinado em Uniforme Médio, e não ter O Grande Duque', originalText:'Abençoado por um dom singular, seu treinamento supera em rigor e completude o de qualquer outro cavaleiro. Enquanto estiver utilizando Uniforme Médio, você recebe RDG adicional igual a seu bônus de treinamento.\n\n[Pré-Requisito: O Escolhido, ter treinamento em Uniforme Médio e não pode ter escolhido o talento O Grande Duque]'},
  {id:'hb_o_grande_duque', name:'O Grande Duque', homebrew:true, prereqText:'O Escolhido, treinado em Uniforme Médio, e não ter O Grande Lorde', originalText:'Ao contrário do Grande Lorde, seu treinamento foi levado a um extremo desumano. Enquanto estiver utilizando Uniforme Médio, você recebe metade de seu bônus de Treinamento em todos os Testes de Resistência. No nível 10, passa a ser seu Treinamento completo.\n\n[Pré-Requisito: O Escolhido, ter treinamento em Uniforme Médio e não pode ter escolhido o talento O Grande Lorde]'}
];
const TOCADO_POR_DEUS_STYLE = {
  name:'Tocado por Deus', concept:'Novo Estilo das Sombras — inspirado em Sir Galahad (homebrew)',
  originalText:'Você é o cavaleiro mais abençoado de sua geração. O olhar de Deus recaiu sobre ti, reconhecendo em sua alma a pureza necessária para erguer o seu Cálice, honra concedida a pouquíssimos mortais. Como prova desse favor divino, você recebe acesso aos artefatos de grau Excalibur e Dama Do Lago, sacrificando uma técnica de estilo ao receber acesso. Diferente de quaisquer relíquias comuns, esses itens não são uma mera ferramenta, mas extensão de sua própria graça: vinculados ao seu espírito, evoluem junto de você. Além disso, sua técnica de estilo se baseia na aptidão de Controle e Leitura, aumentando os valores conforme você aumenta o nível nessa aptidão.'
};
const TOCADO_POR_DEUS_TECHNIQUES = [
  {id:'hb_crux_rubra', name:'Crux Rubra', originalText:'Ampliando o poder da sua armadura, enquanto seu domínio simples estiver ativo, você e seus aliados dentro da área recebem um bônus de Defesa igual à metade do seu bônus de treinamento, multiplicado pelo seu nível de Controle e Leitura.'},
  {id:'hb_punicao_divina', name:'Punição Divina', originalText:'Você pune os desonrados e aqueles que trilham caminhos vis. Enquanto seu domínio simples estiver ativo, você pode gastar 2 PE para cada ponto que possua em Controle e Leitura para desencadear uma sequência de ataques. O número de ataques realizados é igual ao seu nível em Controle e Leitura; esses ataques causam o dano da arma aplicada no domínio. Para que esses ataques ocorram, a criatura alvo deve se deslocar ao menos 1,5 metros dentro do seu domínio simples. Além disso, você recebe metade de seu bônus de treinamento nos acertos dessa técnica de estilo, aplicado novamente para cada ponto em Controle e Leitura.'},
  {id:'hb_o_santificado', name:'O Santificado', originalText:'Sua presença evoca a de um mártir sagrado. Como uma reação, você entra na frente de um ataque que um aliado receberia, recebendo o dano com +3 de RD contra o ataque para cada ponto de Controle e Leitura que você tiver. Essa técnica de estilo não precisa estar com o domínio simples ativo para funcionar.'},
  {id:'hb_cavaleiro_piedoso', name:'Cavaleiro Piedoso', originalText:'Você demonstra uma piedade absoluta até mesmo diante de seus inimigos. Enquanto o seu domínio simples estiver ativo, seus ataques corpo a corpo aumentam em 2 níveis por ponto de Controle e Leitura. Esse estilo também pode ser empregado fora do domínio simples como uma Ação Comum: ao fazê-lo, você gasta 2 PE por nível de Controle e Leitura para ampliar os níveis mencionados. Escolha um único alvo; o alcance é igual ao seu deslocamento base + 1,5 m para cada nível na aptidão de Controle e Leitura.'},
  {id:'hb_conexao_com_jose', name:'Conexão Com José', originalText:'Você mantém uma ligação profunda com os anjos e, em momentos específicos, suas orações invocam suas graças. Enquanto seu domínio simples estiver ativo, você recebe um bônus de acerto igual à metade do seu bônus de treinamento e reduz sua margem de crítico em 2. Para cada ponto em Controle e Leitura, esses benefícios são aplicados novamente, acumulando-se.'},
  {id:'hb_impetus_divinus', name:'Impetus Divinus', originalText:'Você executa um iai divino, concentrando energia celestial em sua lâmina. Como uma Ação Comum, com alcance de até seu deslocamento + 1,5 m para cada ponto em Controle e Leitura e utilizando 3 PE para cada ponto que utilizar, você pode forçar um inimigo a realizar um teste de Reflexo contra sua CD de Aptidão (atributo Sabedoria ou Destreza, à sua escolha). Em caso de falha, o alvo sofre o dano de sua arma, acrescido de dados extras iguais à metade do seu bônus de treinamento, valor que aumenta novamente para cada ponto que você possua em Controle e Leitura. Não pode ser usada em conjunto com o domínio simples; manifesta um corte em linha reta que causa dano radiante no lugar do dano da arma (ou de energia reversa, se você possuir Canalizar Energia Reversa). Com Ação Completa, os dados extras de dano aumentam pelo bônus de treinamento completo para cada ponto em Controle e Leitura.'},
  {id:'hb_aura_do_escolhido', name:'Aura do Escolhido', originalText:'Você é o escolhido para encontrar o tão almejado Graal e ocupar o Assento Perigoso. Ao adotar seu domínio simples, você pode imbuí-lo com essa técnica de estilo: enquanto a mantiver ativa, você recebe os efeitos da aptidão Cura em Grupo, exceto pelo alcance (que passa a ser o do seu domínio simples), com +2 níveis adicionais para cada ponto que possua em Controle e Leitura. Requer possuir as aptidões Energia Reversa e Cura em Grupo.'}
];
const ESCOLHIDO_ARTIFACTS = [
  {id:'hb_excalibur', name:'Excalibur, A Espada de Empunhadura Vermelha', type:'weapon', category:'Arma', damage:'1d8', critical:'19-20', cost:0, spaces:1, properties:['Versátil (1d10)','Modular Pf'], group:'Espada', grade:'4º Grau',
    originalText:'A lendária Excalibur é o símbolo da autoridade sobre toda a Grã-Bretanha, destinada apenas a quem provar ser digno de reinar ao retirá-la da rocha. Entregue pela Dama do Lago, ela representa destino e soberania.\n\nGrau 4º: +1, sem benefício adicional.\nGrau 3º: +2, [Adaptada - Destreza].\nGrau 2º: +3, [Sintonizada - Radiante ou Energia Reversa].\nGrau 1º: +4, [Potente] e [Destruidora].\nGrau Especial: +5, [Espada Prometida].\n\nEspada Prometida (Grau Especial): enquanto estiver empunhando a espada, todos os ataques realizados com ela têm seu nível aumentado em um valor igual à metade do seu modificador de Destreza. Além disso, a arma recebe permanentemente o encantamento Afiada.'},
  {id:'hb_dama_do_lago', name:'Dama Do Lago', type:'uniform', defenseBonus:4, cost:0, spaces:1, burden:0, category:'Revestimento Médio (-2 em Furtividade)', grade:'4º Grau',
    originalText:'Uma armadura lendária concedida pela própria Dama do Lago, criada como extensão direta de seu poder. Revestimento Médio: +4 na Defesa e -2 em Furtividade.\n\nGrau 4º: [Propulsor].\nGrau 3º: [Blindado].\nGrau 2º: [Material Pesado].\nGrau 1º: [Estimulante] e [Distorcivo].\nGrau Especial: [Santuário].\n\nSantuário (Grau Especial): sempre que for atingido por um ataque, você recebe +2 em Defesa de forma cumulativa, até um máximo de +6. Além disso, no início do combate, você recebe Pontos de Vida Temporários iguais a 1/3 de seus pontos de vida máximo; esses pontos não são acumuláveis — para obter mais, deve primeiro reduzir os atuais a 0.'}
];
const ESCOLHIDO_VOWS = [
  {id:'hb_filho_do_adulterio', name:'Restrição Congênita — Filho do Adultério', originalText:'Você foi tocado pela graça de Jesus Cristo, mas carrega também a sombra do pecado de seu pai. Bênção e maldição entrelaçadas na mesma alma.\n\nMalefícios:\n• Força e Constituição travadas permanentemente em 4, sem poder aumentá-las.\n• Só pode receber aptidão nos níveis pares, em vez de todo nível.\n• Incapaz de utilizar qualquer outra Arma e Uniforme além da Excalibur e da Dama do Lago (são destruídos ao toque).\n• Quando o Domínio Simples for desfeito, fica incapaz de utilizá-lo durante duas rodadas.\n\nBenefícios:\n• Sabedoria ou Destreza tem o máximo aumentado para 24 e recebe +4 no atributo escolhido.\n• Todo nível ímpar (exceto o 1º) recebe 3 de RD geral.\n• A Excalibur recebe 1 nível de dano adicional.\n• As Técnicas de Estilo do Domínio Simples podem gastar 2 PE adicionais para efeitos.'},
  {id:'hb_codigo_de_cavaleiro', name:'Voto Próprio Permanente — Código de Cavaleiro', originalText:'Você foi consagrado como cavaleiro da Távola Redonda, jurando viver segundo seu código de conduta.\n\nMalefícios:\n• Incapaz de mentir: se fizer, recebe 2d10 de dano Psíquico irredutível.\n• Incapaz de reduzir um humano a 0 pontos de vida: ele fica automaticamente com 1 PV.\n• Ao adquirir a técnica O Santificado, é obrigado a usá-la para proteger um aliado atacado sempre que puder agir; se deixar de fazê-lo (fora do caso de já ter gasto a reação para benefício próprio), recebe 2d8 de dano direto na Integridade, irredutível.\n\nBenefícios:\n• Recebe 1 ponto de energia amaldiçoada todo nível, incluso o primeiro.\n• Recebe seu bônus de treinamento adicionado a testes de Presença, exceto Enganação.\n• A técnica O Santificado adiciona +4 de RD em vez de +3.\n• Recebe Defesa igual à metade do seu bônus de treinamento.'}
];
function escolhidoHpBonus(c){ if(!escolhidoId(c.originId)) return 0; const lvl=Number(c.level||1); return lvl<=9 ? lvl : 9+(lvl-9)*2; }
function empenhoImplacavelTier(c){ const entries=semTecnicaBonusEntitlement(c); return entries.length?entries[entries.length-1]:null; }
function empenhoSkills(c){ return getSelectedArrayChoice(c,'empenhoSkills'); }
function empenhoAttackOrRes(c){ return c.choices?.empenhoAttackOrRes||''; }
function semTecnicaId(id){ return id===ORIGIN.SEM_TECNICA || normText(id)==='sem_tecnica'; }
function fetoId(id){ return id===ORIGIN.FETO || normText(id)==='feto_amaldicoado_hibrido'; }
function mutanteId(id){ return id===ORIGIN.MUTANTE || normText(id)==='corpo_amaldicoado_mutante'; }
function selectedAnatomies(c){ return Array.isArray(c.choices?.anatomyFeatures)?c.choices.anatomyFeatures:[]; }
function anatomyEntitlement(c){ return fetoId(c.originId) ? 1 + Math.floor(Number(c.level||1)/5) : 0; }
function hasAnatomy(c,id){ return selectedAnatomies(c).includes(id); }
function originAuraAptitudes(){ return (rules.aptitudes||[]).filter(a=>aptitudeCategory(a)==='Aura'); }
function semTecnicaBonusEntitlement(c){ const lvl=Number(c.level||1); const entries=[]; if(lvl>=3) entries.push({level:3, skillBonus:1, skillCount:2, attackOrResBonus:1}); if(lvl>=13) entries.push({level:13, skillBonus:2, skillCount:2, attackOrResBonus:1}); if(lvl>=17) entries.push({level:17, skillBonus:3, skillCount:2, attackOrResBonus:2}); return entries; }
function semTecnicaExtraClassFeatureLimit(c){ const lvl=Number(c.level||1); return (lvl>=6?1:0)+(lvl>=15?1:0)+(lvl>=19?1:0); }
function semTecnicaChoiceTalentAptLimit(c){ const lvl=Number(c.level||1); return 1+(lvl>=10?1:0); }
function empenhoGrantChoice(c,key){ return c.choices?.empenhoGrantChoice?.[key] || 'talent'; }
function empenhoTalentGrantCount(c){
  if(!(semTecnicaId(c.originId)||escolhidoId(c.originId))) return 0;
  const lvl=Number(c.level||1); let n=0;
  if(lvl>=1 && empenhoGrantChoice(c,'lvl1')==='talent') n+=1;
  if(lvl>=10 && empenhoGrantChoice(c,'lvl10')==='talent') n+=1;
  if(lvl>=19) n+=1;
  return n;
}
function empenhoAptitudeGrantCount(c){
  if(!(semTecnicaId(c.originId)||escolhidoId(c.originId))) return 0;
  const lvl=Number(c.level||1); let n=0;
  if(lvl>=1 && empenhoGrantChoice(c,'lvl1')==='aptitude') n+=1;
  if(lvl>=10 && empenhoGrantChoice(c,'lvl10')==='aptitude') n+=1;
  return n;
}
function originOnlyTalentBonus(c){
  const org=origin(c); let n=0;
  if(org?.id===ORIGIN.INATO){ n+=1; if(Number(c.level||1)>=4) n+=1; }
  n+=empenhoTalentGrantCount(c);
  return n;
}
function escolhidoVowIds(c){ return getSelectedArrayChoice(c,'escolhidoVows'); }
function hasEscolhidoVow(c,id){ return escolhidoId(c.originId) && escolhidoVowIds(c).includes(id); }
function hasMediumUniform(c){ return (c.inventory?.items||[]).some(i=>i.type==='uniform' && /médio|medio/i.test(i.category||'')); }
function escolhidoTalentRequirementStatus(c,talent){
  if(!talent?.homebrew) return {ok:true, problems:[]};
  const problems=[];
  if(!escolhidoId(c.originId)){ problems.push('Origem O Escolhido'); return {ok:false, problems}; }
  const names=selectedTalentNames(c).map(normText);
  if(talent.id==='hb_ancestral_de_nascien' && Number(c.level||1)<8) problems.push('Nível 8');
  if((talent.id==='hb_o_grande_lorde'||talent.id==='hb_o_grande_duque') && !hasMediumUniform(c)) problems.push('Treinado em Uniforme Médio');
  if(talent.id==='hb_o_grande_lorde' && names.some(n=>n.includes('grande duque'))) problems.push('Já possui O Grande Duque');
  if(talent.id==='hb_o_grande_duque' && names.some(n=>n.includes('grande lorde'))) problems.push('Já possui O Grande Lorde');
  return {ok:problems.length===0, problems};
}
function originFixedSkills(c){ const out=[]; if(c.originId===ORIGIN.HERDADO) out.push(...herdadoClanTrainedSkills(c)); if(semTecnicaId(c.originId)) out.push(...(c.choices?.semTecnicaSkills||[])); if(escolhidoId(c.originId)) out.push(...getSelectedArrayChoice(c,'escolhidoSkills')); if(fetoId(c.originId) && hasAnatomy(c,'olhos_sombrios')) out.push('percepcao'); if(hasTalentByName(c,'Tempestade De Ideias') && c.choices?.tempestadeSkill) out.push(c.choices.tempestadeSkill); return [...new Set(out)].filter(Boolean); }
function originMasterSkills(c){ const out=[]; if(c.originId===ORIGIN.HERDADO) out.push(...herdadoClanMasterSkills(c)); return [...new Set(out)].filter(Boolean); }
function originBonusConfig(c){
  const id=c.originId;
  if(id===ORIGIN.INATO || id===ORIGIN.DERIVADO || fetoId(id)) return {mode:'split', text:'+2 em um atributo e +1 em outro atributo.'};
  if(id===ORIGIN.HERDADO) return {mode:'herdado', text:'Bônus, perícias e herança definidos pelo clã escolhido.'};
  if(id===ORIGIN.RESTRINGIDO) return {mode:'pool', title:'Restringido', pool:2, maxPer:2, allowed:PHYSICAL_ATTRS, fixed:{strength:1,dexterity:1,constitution:1}, text:'+1 em Força, Destreza e Constituição. Além disso, distribua 2 pontos entre atributos físicos.'};
  if(semTecnicaId(id)) return {mode:'pool', title:'Sem Técnica', pool:4, maxPer:3, allowed:ATTRS.map(a=>a[0]), fixed:{}, text:'Distribua 4 pontos entre seus atributos, máximo de 3 pontos no mesmo atributo.'};
  if(escolhidoId(id)) return {mode:'pool', title:'O Escolhido (Homebrew)', pool:4, maxPer:3, allowed:ATTRS.map(a=>a[0]), fixed:{}, text:'Distribua 4 pontos entre seus atributos, máximo de 3 pontos no mesmo atributo.'};
  if(mutanteId(id)) return {mode:'pool', title:'Corpo Amaldiçoado Mutante', pool:2, maxPer:2, allowed:ATTRS.map(a=>a[0]), fixed:{}, text:'Distribua 2 pontos adicionais entre seus atributos.'};
  return {mode:'none'};
};
function originBonusValue(c,k){
  const cfg=originBonusConfig(c); let v=Number(cfg.fixed?.[k]||0);
  if(cfg.mode==='split'){
    const b2=c.choices?.originBonuses?.b2 ?? c.choices?.originBonuses?.plus2;
    const b1=c.choices?.originBonuses?.b1 ?? c.choices?.originBonuses?.plus1;
    if(b2===k) v+=2; if(b1===k) v+=1;
  } else if(cfg.mode==='herdado'){
    const clan=herdadoClan(c); if(clan){
      if(clan.id==='zenin'){
        if(c.choices?.originBonuses?.b2===k) v+=2; if(c.choices?.originBonuses?.b1===k) v+=1;
      } else {
        const main=c.choices?.herdadoClanBonusMain; if(main===k) v+=2; else if(clan.attrs.includes(k)) v+=1;
      }
    }
  } else if(cfg.mode==='pool') v += Number(originBonusAllocation(c)[k]||0);
  return v;
};
function originBonusResolved(c){
  const cfg=originBonusConfig(c); if(cfg.mode==='none') return false;
  if(cfg.mode==='split'){
    const b2=c.choices?.originBonuses?.b2 ?? c.choices?.originBonuses?.plus2;
    const b1=c.choices?.originBonuses?.b1 ?? c.choices?.originBonuses?.plus1;
    return !!b2 && !!b1 && b2!==b1;
  }
  if(cfg.mode==='herdado'){
    const clan=herdadoClan(c); if(!clan) return false;
    if(clan.id==='zenin') return !!c.choices?.originBonuses?.b2 && !!c.choices?.originBonuses?.b1 && c.choices.originBonuses.b2!==c.choices.originBonuses.b1;
    return !!c.choices?.herdadoClanBonusMain && clan.attrs.includes(c.choices.herdadoClanBonusMain);
  }
  if(cfg.mode==='pool'){
    const entries=Object.entries(originBonusAllocation(c));
    return originBonusSpent(c)===cfg.pool && entries.every(([k,v])=>cfg.allowed.includes(k) && Number(v)>=0 && Number(v)<=cfg.maxPer);
  }
  return false;
};
function specializationFixedSkills(c){ return specTrainingConfig(c).skillFixed||[]; }
function selectedTrainedSkills(c){ return [...new Set([...(c.choices.skills||[]), ...originFixedSkills(c), ...specializationFixedSkills(c)])]; };
function selectedMasterSkills(c){ return [...new Set([...(c.choices.masterSkills||[]), ...originMasterSkills(c)])]; };
function selectedSkillCount(c){ return (c.choices.skills||[]).length; };
function masterSkillLimit(c){ let n=0; if(Number(c.level||1)>=10) n+=1; if(hasTalentByName(c,'Tempestade De Ideias')) n+=1; n+=extraSkillMasterCount(c); return n; };
function talentLimit(c){
  const base=Math.max(0, Number(c.level||1)-1);
  const featuresSelected=(c.choices?.mundaneFeatures||[]).length;
  const sharedRemaining=Math.max(0, base-featuresSelected);
  return originOnlyTalentBonus(c) + sharedRemaining;
};
function aptitudeLimit(c){
  if(c.isRestricted || c.originId===ORIGIN.RESTRINGIDO) return 0;
  const lvl=Number(c.level||1);
  let n = hasEscolhidoVow(c,'hb_filho_do_adulterio') ? Math.floor(lvl/2) : Math.max(0, lvl-1);
  if(c.originId===ORIGIN.DERIVADO) n+=1;
  n+=empenhoAptitudeGrantCount(c);
  if((semTecnicaId(c.originId)||escolhidoId(c.originId)) && lvl>=4) n+=1;
  return n;
};
function originExtraHp(c){
  let hp=0; if(c.originId===ORIGIN.HERDADO) hp+=herdadoExtraHp(c); if(fetoId(c.originId)&&hasAnatomy(c,'desenvolvimento_exagerado')) hp+=Number(c.level||1); hp+=escolhidoHpBonus(c); return hp;
}
function originExtraPe(c){ let n=c.originId===ORIGIN.HERDADO ? herdadoExtraEnergy(c) : 0; if(hasEscolhidoVow(c,'hb_codigo_de_cavaleiro')) n+=Number(c.level||1); return n; }
function escolhidoVowRd(c){ if(!hasEscolhidoVow(c,'hb_filho_do_adulterio')) return 0; const lvl=Number(c.level||1); let count=0; for(let l=3; l<=lvl; l+=2) count++; return count*3; }
function escolhidoTalentRd(c){ if(!hasMediumUniform(c) || !hasTalentByName(c,'O Grande Lorde')) return 0; return trainingBonus(Number(c.level||1)); }
function damaDoLagoItem(c){ return (c.inventory?.items||[]).find(i=>i.name==='Dama Do Lago'); }
function hasSantuario(c){ const item=damaDoLagoItem(c); return !!item && item.grade==='Grau Especial'; }
function santuarioDefenseBonus(c){ return hasSantuario(c) ? Number(c.combat?.santuarioStacks||0)*2 : 0; }
function escolhidoVowDefenseBonus(c){ return hasEscolhidoVow(c,'hb_codigo_de_cavaleiro') ? Math.floor(trainingBonus(Number(c.level||1))/2) : 0; }
function flatAttackBonus(c){ let n=0; if(hasTalentByName(c,'O Maior Honrado')){ n+=2; n+=[4,8,12,16,20].filter(l=>Number(c.level||1)>=l).length; } if((semTecnicaId(c.originId)||escolhidoId(c.originId)) && empenhoAttackOrRes(c)==='attack'){ const tier=empenhoImplacavelTier(c); if(tier) n+=tier.attackOrResBonus; } return n; }
function flatDamageBonus(c){ let n=0; if(hasTalentByName(c,'O Maior Honrado')){ n+=2; n+=[4,8,12,16,20].filter(l=>Number(c.level||1)>=l).length; } return n; }
function originMovementBonus(c){ let m=0; if(c.originId===ORIGIN.RESTRINGIDO) m+=3; if(fetoId(c.originId)&&hasAnatomy(c,'pernas_extras')) m+=4.5; return m; }
function originInitiativeBonus(c){ return fetoId(c.originId)&&hasAnatomy(c,'instinto_sanguinario') ? trainingBonus(c.level) : 0; }
function originAttentionBonus(c){ let a=0; if(fetoId(c.originId)&&hasAnatomy(c,'instinto_sanguinario')) a+=trainingBonus(c.level); if(restringidoIsSpec(c)&&restringidoHasGift(c,'percepcao_aguçada')) a+=Math.floor(Number(c.level||1)/2); return a; }

// =====================================================
// v5.5 — Restringido: "Restrito pelos Céus" (especialização) e "Físico Abençoado" (origem)
// mecânicas completas: Estamina, CD, Defesa, Versatilidade, Esquiva, Dádivas do Céu, Arsenal Amaldiçoado
// =====================================================
function restringidoIsSpec(c){ return c.specializationId==='restringido'; }
const RESTRINGIDO_HEAVENLY_GIFTS = [
  {id:'agilidade_eximia', name:'Agilidade Exímia', attr:'dexterity', originalText:'Uma leveza anormal e agilidade extrema são traços do seu corpo. Sempre que fizer um teste de perícia ou resistência usando destreza, você recebe um bônus de +2, além de receber 3 metros adicionais de movimento e sempre ignorar terreno difícil.'},
  {id:'fisico_robusto', name:'Físico Robusto', attr:'constitution', originalText:'Seu corpo é naturalmente mais robusto e resistente a todo dano que seja causado nele. Você recebe redução de dano contra todo tipo, cujo valor é igual a metade do seu nível de personagem, além de receber um bônus de +2 em testes de perícia ou resistência usando constituição.'},
  {id:'forca_devastadora', name:'Força Devastadora', attr:'strength', originalText:'Você foi dotado com uma força extrema, a qual permite que seus golpes sejam ainda mais potentes, assim como a capacidade física dos seus músculos. A distância de todo pulo ou salto que realizar aumenta em 3 metros, a distância padrão que você empurra com a ação Empurrar aumenta em 4,5 metros e recebe +2 em testes de perícia usando Força.'},
  {id:'indulgente_a_feiticaria', name:'Indulgente a Feitiçaria', attr:null, originalText:'Seu corpo recusa a energia amaldiçoada e, consequentemente, as técnicas. Você recebe Redução de Dano contra danos provindos de técnicas ou aptidões amaldiçoadas igual à metade do seu nível de personagem e um bônus de +1 em TRs de Vontade contra efeitos dessas mesmas fontes. No nível 10, o bônus em TRs aumenta em +1 e, no nível 15, passa a contar também para Fortitude e Reflexos.'},
  {id:'mente_afiada', name:'Mente Afiada', attr:'intelligence', originalText:'Você tem uma mente afiada que o permite desenvolver habilidades facilmente. Você se torna treinado em duas perícias adicionais e se torna mestre em uma perícia. Você também recebe um bônus de +2 em testes de perícia ou resistência usando inteligência.'},
  {id:'percepcao_aguçada', name:'Percepção Aguçada', attr:'wisdom', originalText:'Sua percepção e seus instintos são aguçados ao máximo, permitindo-o perceber cada detalhe dos seus arredores. Sua atenção aumenta em um valor igual a metade do seu nível de personagem e você recebe um bônus de +3 em rolagens de percepção. Você também recebe um bônus de +2 em testes de perícia ou resistência usando sabedoria.'},
  {id:'reposicao_sanguinaria', name:'Reposição Sanguinária', attr:null, originalText:'Você consegue repor o seu vigor a partir do sangue derramado. Sempre que um inimigo no qual você causou dano for morto, você recupera 3 pontos de estamina. Você não pode exceder a quantidade de pontos que possuía no início do combate.'},
  {id:'semblante_cativante', name:'Semblante Cativante', attr:'presence', originalText:'Um semblante mais cativante e chamativo foi lhe concedido, apurando seu carisma e presença. Sempre que realizar um teste de perícia utilizando Presença, caso você tire um resultado inferior a metade do seu valor de Presença, você pode optar por tratar o resultado como metade do seu valor de Presença. Além disso, você se torna mestre em uma perícia de Presença à sua escolha e recebe um bônus de +2 em testes de perícia usando Presença.'},
  {id:'vigor_infindavel', name:'Vigor Infindável', attr:null, originalText:'Você foi dotado de um vigor amplo e infindável e consegue o repor ao triunfar. Seus pontos de vida máximos aumentam em um valor igual ao seu nível de personagem e, a cada 2 níveis, você recebe 1 ponto de estamina máximo adicional.'}
];
function restringidoGiftIds(c){ return getSelectedArrayChoice(c,'heavenlyGifts'); }
function restringidoHasGift(c,id){ return restringidoIsSpec(c) && restringidoGiftIds(c).includes(id); }
function restringidoGiftLimit(c){ if(!restringidoIsSpec(c)) return 0; return Math.min(RESTRINGIDO_HEAVENLY_GIFTS.length, Math.floor(Number(c.level||1)/4)); }
function restringidoGiftAttrBonus(c,attrKey){ if(!restringidoIsSpec(c) || !attrKey) return 0; const g=RESTRINGIDO_HEAVENLY_GIFTS.find(x=>x.attr===attrKey); return (g && restringidoHasGift(c,g.id)) ? 2 : 0; }
function restringidoStaminaMax(c){ if(!restringidoIsSpec(c)) return 0; const lvl=Number(c.level||1); const extra=restringidoHasGift(c,'vigor_infindavel') ? Math.floor(lvl/2) : 0; return 4 + 4*lvl + extra; }
function restringidoHpGiftBonus(c){ return restringidoHasGift(c,'vigor_infindavel') ? Number(c.level||1) : 0; }
function restringidoRdFromGifts(c){ if(!restringidoIsSpec(c)) return {physical:0, technique:0}; const lvl=Number(c.level||1); const half=Math.max(0,Math.floor(lvl/2)); return {physical:restringidoHasGift(c,'fisico_robusto')?half:0, technique:restringidoHasGift(c,'indulgente_a_feiticaria')?half:0}; }
function restringidoEsquivaBonus(level){ const lvl=Number(level||1); if(lvl<3) return 0; return 1+(lvl>=9?1:0)+(lvl>=16?1:0); }
function restringidoImplementoCelesteBonus(level){ const lvl=Number(level||1); if(lvl<4) return 0; return 2+(lvl>=8?1:0)+(lvl>=16?1:0); }
function restringidoVersatilidadeBonus(c){ if(!restringidoIsSpec(c)) return 0; const lvl=Number(c.level||1); if(lvl<2) return 0; return lvl>=10?2:1; }
function restringidoMasterResistances(c){ if(!restringidoIsSpec(c) || Number(c.level||1)<9) return []; return ['fortitude','reflexes']; }
function restringidoDefenseAttrBonus(c){ if(!restringidoIsSpec(c)) return 0; const attr=c.choices?.restritoCeusDefAttr; if(!attr) return 0; return Math.min(Math.max(0,mod(finalAttr(c,attr))), Number(c.level||1)); }
const RESTRINGIDO_NON_ABILITY_TITLES = new Set(['Estilo Marcial','Nível Da Técnica Marcial Custo','Criando Técnicas Marciais','Arsenal Amaldiçoado','Treinamento Arsenal Amaldiçoado','Dádivas Do Céu','Equipamentos']);
const RESTRINGIDO_ARSENAL_TABLE = {
  2:'Uma ferramenta de terceiro grau e duas de quarto grau.',
  3:'Uma ferramenta de segundo grau e três de terceiro grau.',
  4:'Duas ferramentas de primeiro grau e duas de segundo grau.',
  5:'Uma ferramenta de grau especial e três de primeiro grau.',
  6:'Duas ferramentas de grau especial e duas de primeiro grau.'
};
function resistanceAttrKey(resId){ const abbr=RESISTANCES.find(r=>r[0]===resId)?.[2]; const found=ATTRS.find(a=>a[2]===abbr); return found?found[0]:'constitution'; }
function skillBonus(c,s){ const av=finalAttr(c,s.attribute); const trained=selectedTrainedSkills(c).includes(s.id); const master=selectedMasterSkills(c).includes(s.id); const tb=trainingBonus(c.level); const lvlHalf=Math.floor(Number(c.level||1)/2); let extra=0; if(fetoId(c.originId)&&hasAnatomy(c,'olhos_sombrios')&&s.id==='percepcao') extra+=2; if(fetoId(c.originId)&&hasAnatomy(c,'bracos_extras')&&s.id==='prestidigitacao') extra+=2; if(fetoId(c.originId)&&hasAnatomy(c,'corpo_especializado')&&c.choices?.corpoEspecializadoSkill===s.id) extra+=2; extra+=restringidoVersatilidadeBonus(c); extra+=restringidoGiftAttrBonus(c,s.attribute); if(restringidoIsSpec(c)&&s.id==='percepcao'&&restringidoHasGift(c,'percepcao_aguçada')) extra+=3; if((semTecnicaId(c.originId)||escolhidoId(c.originId)) && empenhoSkills(c).includes(s.id)){ const tier=empenhoImplacavelTier(c); if(tier) extra+=tier.skillBonus; } if(hasEscolhidoVow(c,'hb_codigo_de_cavaleiro') && s.attribute==='presence' && s.id!=='enganacao') extra+=tb; return mod(av)+lvlHalf+(trained?tb:0)+(master?Math.floor(tb/2):0)+extra; };
function resistanceBonus(c,resId){ const attrKey=resistanceAttrKey(resId); const av=finalAttr(c,attrKey); const trained=(c.choices.resistances||[]).includes(resId); const master=restringidoMasterResistances(c).includes(resId); const tb=trainingBonus(c.level); const lvlHalf=Math.floor(Number(c.level||1)/2); let extra=restringidoGiftAttrBonus(c,attrKey); if(restringidoIsSpec(c)&&resId==='reflexes') extra+=restringidoEsquivaBonus(c.level); if(restringidoIsSpec(c)&&restringidoHasGift(c,'indulgente_a_feiticaria')){ const lvl=Number(c.level||1); if(resId==='will') extra+=1+(lvl>=10?1:0); if((resId==='fortitude'||resId==='reflexes') && lvl>=15) extra+=2; } if((semTecnicaId(c.originId)||escolhidoId(c.originId)) && empenhoAttackOrRes(c)===resId){ const tier=empenhoImplacavelTier(c); if(tier) extra+=tier.attackOrResBonus; } if(hasTalentByName(c,'O Grande Duque') && hasMediumUniform(c)) extra += Number(c.level||1)>=10 ? tb : Math.floor(tb/2); return mod(av)+lvlHalf+(trained?tb:0)+(master?Math.floor(tb/2):0)+extra; };

function InatoOriginPanel({c,dispatch}){ return <div className="choiceBlock"><h3>Origem Inato</h3><OriginBonusPanelBase c={c} dispatch={dispatch}/><div className="notice"><b>Talento Natural:</b> libera 1 talento no 1º nível. A partir do 4º nível, uma única vez, pode escolher receber um talento adicional ao subir de nível.</div><Field label="Marca Registrada — Feitiço adicional com custo -1 PE"><input value={c.choices?.marcaRegistradaSpell||''} onChange={e=>dispatch({type:'choice',key:'marcaRegistradaSpell',value:e.target.value})} placeholder="Nome do feitiço registrado"/></Field></div>; }
function DerivadoOriginPanel({c,dispatch}){ const aura=originAuraAptitudes(); return <div className="choiceBlock"><h3>Origem Derivado</h3><OriginBonusPanelBase c={c} dispatch={dispatch}/><Field label="Aptidão Amaldiçoada de Aura concedida pela origem"><Select value={c.choices?.derivadoAuraAptitude||''} onChange={v=>dispatch({type:'choice',key:'derivadoAuraAptitude',value:v})}><option value="">Escolha</option>{aura.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field><Field label="Desenvolvimento Inesperado — atributo foco"><Select value={c.choices?.[DERIVADO_LIMIT_ATTR_KEY]||''} onChange={v=>dispatch({type:'choice',key:DERIVADO_LIMIT_ATTR_KEY,value:v})}><option value="">Escolha</option>{ATTRS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</Select></Field><div className="notice"><b>Energia Antinatural:</b> 1 vez por dia, como Ação Bônus em combate, recupera PE igual ao dobro do bônus de treinamento: {trainingBonus(c.level)*2} PE.</div></div>; }
function RestringidoOriginPanel({c,dispatch}){ return <div className="choiceBlock"><h3>Origem Restringido</h3><OriginBonusPanelBase c={c} dispatch={dispatch}/><div className="notice"><b>Físico Abençoado:</b> +3m de deslocamento, imunidade a doenças mundanas, vantagem contra venenos e acesso obrigatório à especialização Restringido.</div><div className="notice"><b>Ápice Corporal Humano:</b> FOR, DES e CON têm limite 30. A cada 6 níveis, escolha um desses atributos para +2.</div><AttributeLimitControls c={c} dispatch={dispatch}/><div className="notice"><b>Resiliência Imediata:</b> {trainingBonus(c.level)} uso(s) por descanso longo; reduz dano em {Math.max(1,Math.floor(Number(c.level||1)/2))*5} ou evita desmembramento.</div></div>; }
function FetoOriginPanel({c,dispatch}){ const sel=selectedAnatomies(c), max=anatomyEntitlement(c); return <div className="choiceBlock"><h3>Origem Feto Amaldiçoado Híbrido</h3><OriginBonusPanelBase c={c} dispatch={dispatch}/><div className="notice"><b>Herança Maldita:</b> cura recebida por energia reversa é reduzida pela metade. Se obtiver habilidade de cura de energia reversa, pode usar tratando energia reversa como energia amaldiçoada e gastando 2 PE.</div><LimitedChoiceGrid title={`Características de Anatomia (${sel.length}/${max})`} items={ANATOMY_FEATURES.map(a=>({id:a.id,name:a.name,originalText:a.text}))} selected={sel} limit={max} onChange={arr=>dispatch({type:'choice',key:'anatomyFeatures',value:arr.slice(0,max)})}/>{hasAnatomy(c,'corpo_especializado')&&<Field label="Corpo Especializado — escolha a perícia"><Select value={c.choices?.corpoEspecializadoSkill||''} onChange={v=>dispatch({type:'choice',key:'corpoEspecializadoSkill',value:v})}><option value="">Escolha</option>{trainableSkills().map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>}<div className="notice"><b>Vigor Maldito:</b> {1+(Number(c.level)>=4?1:0)+(Number(c.level)>=8?1:0)+(Number(c.level)>=12?1:0)} uso(s) por descanso longo; cura base {5+(Number(c.level)>=4?5:0)+(Number(c.level)>=8?5:0)+(Number(c.level)>=12?5:0)} + mod. Constituição por uso gasto.</div></div>; }
function SemTecnicaOriginPanel({c,dispatch}){ const chosen=c.choices?.semTecnicaSkills||[]; const freeChoiceLimit=semTecnicaChoiceTalentAptLimit(c); return <div className="choiceBlock"><h3>Origem Sem Técnica</h3><OriginBonusPanelBase c={c} dispatch={dispatch}/><LimitedChoiceGrid title={`Estudos Dedicados — perícias treinadas (${chosen.length}/2)`} items={trainableSkills().map(s=>({...s,originalText:SKILL_HELP[s.id]}))} selected={chosen} limit={2} onChange={arr=>dispatch({type:'choice',key:'semTecnicaSkills',value:arr.slice(0,2)})}/><div className="notice"><b>Restrição:</b> não possui técnica nem acesso a Feitiços e não pode ter a especialização Especialista em Técnicas.</div><div className="notice"><b>Empenho Implacável:</b> escolhas de talento/aptidão por origem disponíveis: {freeChoiceLimit}. Habilidades de especialização adicionais por origem: {semTecnicaExtraClassFeatureLimit(c)}.</div>{Number(c.level)>=4&&<div className="notice"><b>Novo Estilo da Sombra:</b> adicione ao Perfil Amaldiçoado como equivalente à técnica e receba Domínio Simples. Técnicas de Estilo: {1+[8,12,16,20].filter(l=>Number(c.level)>=l).length}.</div>}<EmpenhoGrantPicker c={c} dispatch={dispatch}/><EmpenhoImplacavelPicker c={c} dispatch={dispatch}/></div>; }
function EmpenhoGrantPicker({c,dispatch}){
  if(!(semTecnicaId(c.originId)||escolhidoId(c.originId))) return null;
  const lvl=Number(c.level||1); const grants=c.choices?.empenhoGrantChoice||{};
  const setGrant=(key,value)=>dispatch({type:'choiceObject',key:'empenhoGrantChoice',id:key,value});
  return <div className="choiceBlock"><h4>Empenho Implacável — talento ou aptidão amaldiçoada por concessão</h4><p className="muted">Cada concessão vale como <b>um talento OU uma aptidão</b>, nunca os dois. Escolha o destino de cada concessão liberada.</p><div className="grid2">
    <Field label="Concessão do 1º nível"><Select value={grants.lvl1||'talent'} onChange={v=>setGrant('lvl1',v)}><option value="talent">Talento</option><option value="aptitude">Aptidão Amaldiçoada</option></Select></Field>
    {lvl>=10&&<Field label="Concessão do 10º nível"><Select value={grants.lvl10||'talent'} onChange={v=>setGrant('lvl10',v)}><option value="talent">Talento</option><option value="aptitude">Aptidão Amaldiçoada</option></Select></Field>}
  </div></div>;
}
function EmpenhoImplacavelPicker({c,dispatch}){
  const tier=empenhoImplacavelTier(c); if(!tier) return null;
  const skills=empenhoSkills(c); const attackOrRes=empenhoAttackOrRes(c);
  return <div className="choiceBlock"><h4>Empenho Implacável — bônus atual: +{tier.skillBonus} em 2 perícias, +{tier.attackOrResBonus} em ataque ou TR</h4>
    <LimitedChoiceGrid title={`Perícias que recebem o bônus (${skills.length}/2)`} items={trainableSkills().map(s=>({...s,originalText:SKILL_HELP[s.id]}))} selected={skills} limit={2} onChange={arr=>dispatch({type:'choice',key:'empenhoSkills',value:arr.slice(0,2)})}/>
    <Field label="Ataque ou Teste de Resistência que recebe o bônus"><Select value={attackOrRes} onChange={v=>dispatch({type:'choice',key:'empenhoAttackOrRes',value:v})}><option value="">Escolha</option><option value="attack">Jogadas de Ataque (aplique manualmente)</option>{RESISTANCES.map(([id,name])=><option key={id} value={id}>{name}</option>)}</Select></Field>
  </div>;
}
function EscolhidoOriginPanel({c,dispatch}){
  const skills=getSelectedArrayChoice(c,'escolhidoSkills'); const hpBonus=escolhidoHpBonus(c);
  return <div className="choiceBlock"><h3>Origem Homebrew — O Escolhido</h3>
    <div className="notice warnNotice"><b>Conteúdo homebrew (não-oficial):</b> baseado no material "Abençoado pelos Céus", de @Vai Wilson Vai. Estruturalmente é uma variante temática de Sem Técnica.</div>
    <OriginBonusPanelBase c={c} dispatch={dispatch}/>
    <div className="notice"><b>Aquele Abençoado por Deus:</b> +{hpBonus} PV adicional total pelo nível atual (+1/nível até o 9º, +2/nível a partir do 10º). Você também se torna treinado em 2 perícias adicionais, escolhidas abaixo.</div>
    <LimitedChoiceGrid title={`Perícias adicionais de "Aquele Abençoado por Deus" (${skills.length}/2)`} items={trainableSkills().map(s=>({...s,originalText:SKILL_HELP[s.id]}))} selected={skills} limit={2} onChange={arr=>dispatch({type:'choice',key:'escolhidoSkills',value:arr.slice(0,2)})}/>
    <div className="notice"><b>Restrição:</b> não possui técnica amaldiçoada nem acesso a Feitiços e não pode ter a especialização Especialista em Técnicas (mesma restrição de Sem Técnica).</div>
    <div className="notice"><b>Empenho Implacável:</b> idêntico ao de Sem Técnica — escolhas de talento/aptidão por origem disponíveis: {semTecnicaChoiceTalentAptLimit(c)}. Habilidades de especialização adicionais por origem: {semTecnicaExtraClassFeatureLimit(c)}.</div>
    {Number(c.level)>=4&&<div className="notice"><b>Novo Estilo da Sombra — Tocado por Deus:</b> disponível na aba Técnicas. Técnicas de Estilo conhecidas: {1+[8,12,16,20].filter(l=>Number(c.level)>=l).length}. Você também libera talentos exclusivos de O Escolhido em Perfil Mundano.</div>}
    <EmpenhoGrantPicker c={c} dispatch={dispatch}/>
    <EmpenhoImplacavelPicker c={c} dispatch={dispatch}/>
  </div>;
}
function MutanteOriginPanel({c,dispatch}){ const cores=c.choices?.mutantCores||['Núcleo 1','Núcleo 2','Núcleo 3']; return <div className="choiceBlock"><h3>Origem Corpo Amaldiçoado Mutante</h3><OriginBonusPanelBase c={c} dispatch={dispatch}/><div className="notice"><b>Forma de Vida Sintética:</b> imune a dano venenoso e à condição envenenado; não recebe efeitos de refeições nem de itens do tipo Medicina.</div><div className="notice"><b>Mutação Abrupta:</b> inicia com três núcleos. Alternar núcleo ativo em combate é Ação Bônus.</div><div className="grid3">{[0,1,2].map(i=><Field key={i} label={`Núcleo ${i+1}`}><input value={cores[i]||''} onChange={e=>{ const next=[...cores]; next[i]=e.target.value; dispatch({type:'choice',key:'mutantCores',value:next}); }}/></Field>)}</div><Field label="Núcleo Primário"><Select value={c.choices?.mutantPrimaryCore||''} onChange={v=>dispatch({type:'choice',key:'mutantPrimaryCore',value:v})}><option value="">Escolha</option>{cores.map((x,i)=><option key={i} value={x||`Núcleo ${i+1}`}>{x||`Núcleo ${i+1}`}</option>)}</Select></Field></div>; }
function OriginBonusPanelBase({c,dispatch}){ const cfg=originBonusConfig(c); if(cfg.mode==='split'){ return <div><p className="muted">{cfg.text}</p><div className="grid2"><Field label="+2 em atributo"><Select value={c.choices.originBonuses?.b2||''} onChange={v=>dispatch({type:'choiceObject',key:'originBonuses',id:'b2',value:v})}><option value="">—</option>{ATTRS.map(([k,l])=><option key={k} value={k} disabled={c.choices.originBonuses?.b1===k}>{l}</option>)}</Select></Field><Field label="+1 em atributo"><Select value={c.choices.originBonuses?.b1||''} onChange={v=>dispatch({type:'choiceObject',key:'originBonuses',id:'b1',value:v})}><option value="">—</option>{ATTRS.map(([k,l])=><option key={k} value={k} disabled={c.choices.originBonuses?.b2===k}>{l}</option>)}</Select></Field></div></div>; } const alloc=originBonusAllocation(c), spent=originBonusSpent(c), remaining=Math.max(0,cfg.pool-spent); return <div><p className="muted">{cfg.text}</p>{Object.keys(cfg.fixed||{}).length>0&&<div className="notice">Bônus fixos: {Object.entries(cfg.fixed).map(([k,v])=>`${ATTR_LABEL[k]} +${v}`).join(', ')}</div>}<div className={remaining>0?'notice warnNotice':'notice'}><b>Distribuição:</b> {spent}/{cfg.pool}. Restantes: {remaining}.</div><div className="attrIncreaseGrid">{ATTRS.filter(([k])=>cfg.allowed.includes(k)).map(([k,l])=>{ const current=Number(alloc[k]||0); const canAdd=spent<cfg.pool && current<cfg.maxPer; return <div key={k} className="attrIncCard"><b>{l}</b><strong>+{current}</strong><div className="row"><button disabled={current<=0} onClick={()=>dispatch({type:'choiceObject',key:'originBonusAlloc',id:k,value:Math.max(0,current-1)})}>−</button><button disabled={!canAdd} onClick={()=>dispatch({type:'choiceObject',key:'originBonusAlloc',id:k,value:current+1})}>+</button></div></div>})}</div></div>; }
function OriginBonusPanel({c,dispatch}){
  if(!c.originId) return <div className="notice">Escolha uma origem para liberar os bônus corretos.</div>;
  if(c.originId===ORIGIN.INATO) return <InatoOriginPanel c={c} dispatch={dispatch}/>;
  if(c.originId===ORIGIN.HERDADO) return <HerdadoOriginPanel c={c} dispatch={dispatch}/>;
  if(c.originId===ORIGIN.DERIVADO) return <DerivadoOriginPanel c={c} dispatch={dispatch}/>;
  if(c.originId===ORIGIN.RESTRINGIDO) return <RestringidoOriginPanel c={c} dispatch={dispatch}/>;
  if(fetoId(c.originId)) return <FetoOriginPanel c={c} dispatch={dispatch}/>;
  if(semTecnicaId(c.originId)) return <SemTecnicaOriginPanel c={c} dispatch={dispatch}/>;
  if(escolhidoId(c.originId)) return <EscolhidoOriginPanel c={c} dispatch={dispatch}/>;
  if(mutanteId(c.originId)) return <MutanteOriginPanel c={c} dispatch={dispatch}/>;
  return <OriginBonusPanelBase c={c} dispatch={dispatch}/>;
};
function validation(c){
  const tasks=[]; const add=(id,label,ok,tab,reason)=>tasks.push({id,label,ok,tab,reason}); const cfg=specTrainingConfig(c);
  const skillAllowed=trainableSkills().map(s=>s.id).filter(id=>!cfg.skillForbidden.includes(id)); const invalidSkills=(c.choices.skills||[]).filter(id=>!skillAllowed.includes(id)); const invalidRes=(c.choices.resistances||[]).filter(id=>!cfg.resAllowed.includes(id));
  const skillMax=skillLimit(c), resMax=resistanceLimit(c), talentMax=talentLimit(c), aptMax=aptitudeLimit(c), aptLvlMax=aptitudeLevelPointLimit(c); const sCount=effectiveSkillCount(c); const baseChosen=baseSkillChosenCount(c,cfg); const masterMax=masterSkillLimit(c); const invalidMasters=(c.choices.masterSkills||[]).filter(id=>!selectedTrainedSkills(c).includes(id)); const invalidAptitudes=(c.choices.aptitudes||[]).map(id=>rules.aptitudes.find(a=>a.id===id)).filter(Boolean).filter(a=>!aptitudeRequirementStatus(c,a).ok); const unmastered=c.inventory.items.filter(i=>i.equipped && ((i.type==='weapon'&&!hasWeaponMastery(c,i))||(i.type==='shield'&&!hasShieldMastery(c,i)))); const over=attributeOvercapProblems(c);
  add('rolls','Rolar atributos 4d6 descartando o menor',!!latestRollSet(c),'Criação Guiada','Atributos começam vazios.'); add('assign','Distribuir os 6 resultados rolados',ATTRS.every(([k])=>c.attributes.assigned[k]),'Criação Guiada','Cada atributo deve receber um resultado.'); add('attrCap','Respeitar limite de atributo 20',over.length===0,'Criação Guiada',over.length?`Sem mecânica suficiente para: ${over.map(x=>`${x.label} bruto ${x.raw}, limite ${x.cap}`).join('; ')}.`:'Mecânicas reconhecidas aplicadas.');
  add('origin','Escolher Origem',!!c.originId,'Criação Guiada'); add('originBonus','Resolver bônus da Origem',originBonusResolved(c),'Criação Guiada','Cada Origem tem sua própria regra de bônus.');
  if(c.originId===ORIGIN.HERDADO){ const clan=herdadoClan(c); add('herdadoClan','Herdado: escolher clã',!!clan,'Criação Guiada','Clã Gojo, Inumaki, Kamo ou Zenin.'); add('herdadoClanTraining','Herdado: resolver Treinamentos de Clã',herdadoClanTrainingResolved(c),'Criação Guiada','Escolha 2 perícias treinadas do clã ou 1 perícia especialista/mestre.'); }
  if(c.originId===ORIGIN.DERIVADO){ add('derivedAura','Derivado: escolher Aptidão Amaldiçoada de Aura',!!c.choices?.derivadoAuraAptitude,'Criação Guiada','Energia Antinatural concede uma aptidão de Aura respeitando requisitos.'); add('derivedLimitAttr','Derivado: escolher atributo de Desenvolvimento Inesperado',!!c.choices?.[DERIVADO_LIMIT_ATTR_KEY],'Criação Guiada','Esse atributo recebe +1 e +1 limite a cada 4 níveis.'); }
  if(c.originId===ORIGIN.RESTRINGIDO){ add('restrictedSpec','Restringido: usar especialização Restringido',c.specializationId==='restringido','Criação Guiada','Restringido é preso à especialização de mesmo nome.'); add('restrictedApex','Restringido: Ápice Corporal conforme nível',getSelectedArrayChoice(c,'restringidoApexAttrs').length<=Math.floor(Number(c.level||1)/6),'Criação Guiada','Escolha até 1 atributo físico a cada 6 níveis.'); }
  if(restringidoIsSpec(c)) add('restrictedGifts',`Restringido: Dádivas do Céu (${restringidoGiftIds(c).length}/${restringidoGiftLimit(c)})`,restringidoGiftIds(c).length===restringidoGiftLimit(c),'Perfil Restrito','Uma Dádiva do Céu a cada 4 níveis (4, 8, 12, 16, 20).');
  if(fetoId(c.originId)){ add('fetoAnatomy',`Feto Híbrido: Características de Anatomia (${selectedAnatomies(c).length}/${anatomyEntitlement(c)})`,selectedAnatomies(c).length===anatomyEntitlement(c),'Criação Guiada','Recebe 1 no nível 1 e +1 a cada 5 níveis.'); if(hasAnatomy(c,'corpo_especializado')) add('fetoCorpoEspecializado','Corpo Especializado: escolher perícia',!!c.choices?.corpoEspecializadoSkill,'Criação Guiada'); }
  if(semTecnicaId(c.originId)){ add('semTechSpec','Sem Técnica: não pode escolher Especialista em Técnicas',c.specializationId!=='especialista_tecnica','Criação Guiada','Sem Técnica não possui técnica nem acesso a Feitiços.'); add('semTechSkills',`Sem Técnica: Estudos Dedicados (${(c.choices?.semTecnicaSkills||[]).length}/2)`,(c.choices?.semTecnicaSkills||[]).length===2,'Criação Guiada','Escolha 2 perícias treinadas pela origem.'); }
  if(escolhidoId(c.originId)){ add('escolhidoSpec','O Escolhido: não pode escolher Especialista em Técnicas',c.specializationId!=='especialista_tecnica','Criação Guiada','O Escolhido não possui técnica amaldiçoada nem acesso a Feitiços.'); add('escolhidoSkills',`O Escolhido: perícias de "Aquele Abençoado por Deus" (${getSelectedArrayChoice(c,'escolhidoSkills').length}/2)`,getSelectedArrayChoice(c,'escolhidoSkills').length===2,'Criação Guiada','Escolha 2 perícias treinadas adicionais.'); const talentNames=selectedTalentNames(c).map(normText); const hasLorde=talentNames.some(n=>n.includes('grande lorde')); const hasDuque=talentNames.some(n=>n.includes('grande duque')); add('escolhidoLordeDuque','O Escolhido: O Grande Lorde e O Grande Duque são mutuamente exclusivos',!(hasLorde&&hasDuque),'Perfil Mundano','Escolha apenas um dos dois talentos.'); add('escolhidoLordeDuqueUniform','O Escolhido: Grande Lorde/Grande Duque exigem treinamento em Uniforme Médio',!(hasLorde||hasDuque) || hasMediumUniform(c),'Registro e Inventário','Equipe um uniforme de categoria Médio (ex.: Dama Do Lago).'); const hasAncestral=talentNames.some(n=>n.includes('ancestral de nascien')); add('escolhidoAncestral','O Escolhido: Ancestral de Nascien exige nível 8',!hasAncestral || Number(c.level||1)>=8,'Perfil Mundano','Pré-requisito: O Escolhido e Nível 8.'); if(hasEscolhidoVow(c,'hb_filho_do_adulterio')) add('escolhidoVowAttr','Voto Filho do Adultério: escolher Sabedoria ou Destreza para o bônus',!!c.choices?.filhoAdulterioAttr,'Técnicas','Esse atributo tem o máximo elevado para 24 e recebe +4.'); }
  if(mutanteId(c.originId)){ add('mutantCore','Mutante: escolher Núcleo Primário',!!c.choices?.mutantPrimaryCore,'Criação Guiada','Começa com três núcleos e escolhe um como primário.'); }
  add('spec','Escolher Especialização',!!c.specializationId,'Criação Guiada'); add('cd','Escolher atributo de CD',!!c.cdAttribute && cfg.cdAttributes.includes(c.cdAttribute),'Criação Guiada', c.cdAttribute && !cfg.cdAttributes.includes(c.cdAttribute) ? `${ATTR_LABEL[c.cdAttribute]} não é um atributo-chave válido para esta especialização.` : `Atributos-chave permitidos: ${cfg.cdAttributes.map(k=>ATTR_LABEL[k]).join(', ')}.`); add('res',`Escolher resistências permitidas (${(c.choices.resistances||[]).length}/${resMax})`,(c.choices.resistances||[]).length===resMax && invalidRes.length===0,'Criação Guiada', invalidRes.length?`Inválidas: ${invalidRes.map(resistanceName).join(', ')}`:cfg.notes); const choiceGroupsOk=(cfg.skillChoiceGroups||[]).every(g=>choiceGroupChosenCount(c,g)>=g.count); add('skills',`Escolher perícias treinadas da especialização (${sCount}/${skillMax})`,sCount===skillMax && invalidSkills.length===0 && baseChosen>=cfg.skillBaseNeed && choiceGroupsOk,'Criação Guiada', invalidSkills.length?`Inválidas: ${invalidSkills.map(skillName).join(', ')}`:`Grupo obrigatório: ${baseChosen}/${cfg.skillBaseNeed}.${(cfg.skillChoiceGroups||[]).length?' '+cfg.skillChoiceGroups.map(g=>`Escolha obrigatória ${g.options.map(skillName).join(' ou ')}: ${choiceGroupChosenCount(c,g)}/${g.count}.`).join(' '):''}${cfg.skillFixed.length?` Fixas de graça (não gastam limite): ${cfg.skillFixed.map(skillName).join(', ')}.`:''} Perícias de origem não gastam esse limite.`);
  add('masterSkill',`Perícia mestre (${(c.choices.masterSkills||[]).length}/${masterMax})`,masterMax===0 || ((c.choices.masterSkills||[]).length===masterMax && invalidMasters.length===0),'Criação Guiada','Escolha perícias treinadas para se tornarem Mestre quando o nível/talento liberar.'); if((c.choices.skills||[]).includes('oficio')) add('oficio-detail','Informar os Ofícios treinados.',selectedOffices(c).length>=1,'Criação Guiada','Selecione os ofícios disponíveis.'); add('talents',`Talentos dentro do limite (${(c.choices.talents||[]).length}/${talentMax})`,(c.choices.talents||[]).length<=talentMax,'Perfil Mundano','Talentos ficam bloqueados quando o limite é atingido.'); add('classFeatures',`Habilidades de classe dentro do limite (${(c.choices.mundaneFeatures||[]).length}/${classFeatureChoiceLimit(c)})`,(c.choices.mundaneFeatures||[]).length<=classFeatureChoiceLimit(c),'Perfil Mundano','Cada level up dá 1 habilidade de especialização OU 1 talento — os dois disputam o mesmo limite.'); add('equip1','Escolher 2 equipamentos iniciais de custo 1 pagos/gratuitos de escolha',(c.inventory.items.filter(i=>Number(i.cost)===1&&!i.freeStarter).length)>=2,'Registro e Inventário','Itens gratuitos da especialização/uniforme inicial não contam neste limite.'); add('uniform','Equipar uniforme comum/inicial',c.inventory.items.some(i=>i.type==='uniform'),'Registro e Inventário'); add('kit','Escolher 1 kit de ferramentas',c.inventory.items.some(i=>i.type==='kit'),'Registro e Inventário'); add('masteryWarn','Usar apenas equipamentos com maestria',unmastered.length===0,'Registro e Inventário',unmastered.length?`Sem maestria: ${unmastered.map(i=>i.name).join(', ')}`:cfg.masteryText); add('tech','Escolher/cadastrar Técnica ou origem sem técnica/restrita',c.isRestricted || c.originId===ORIGIN.RESTRINGIDO || semTecnicaId(c.originId) || c.technique.name || c.technique.id,'Perfil Amaldiçoado'); add('apt',`Aptidões escolhidas (${(c.choices.aptitudes||[]).length}/${aptMax})`,c.isRestricted || ((c.choices.aptitudes||[]).length<=aptMax && invalidAptitudes.length===0),'Perfil Amaldiçoado', invalidAptitudes.length?`Aptidões sem pré-requisito: ${invalidAptitudes.map(a=>a.name).join(', ')}`:'Limite considera origem.'); add('aptLevels',`Níveis de Aptidão distribuídos (${aptitudeLevelTotal(c)}/${aptLvlMax})`,c.isRestricted || aptitudeLevelTotal(c)<=aptLvlMax,'Perfil Amaldiçoado','Em todo nível par, aumenta 1 nível de aptidão; níveis 10 e 20 adicionam +1.'); return tasks;
};



// =====================================================
// v5.4 — Especializações revisadas: dados estruturados do livro
// =====================================================
function currentSpecRuleV54(c){ const sp=specialization(c); return sp?.specializationRules || rules.specializationRules?.[sp?.id] || {}; }
function specBaseFeaturesV54(sp){ return Array.isArray(sp?.baseFeatures) ? sp.baseFeatures.map(f=>({id:f.id,title:f.title||f.name,level:f.minLevel||1,text:f.text||f.originalText||'',options:f.options||[]})) : []; }
function specClassFeaturesV54(sp){ return Array.isArray(sp?.classFeatures) ? sp.classFeatures.map(f=>({id:f.id,title:f.title||f.name,level:f.minLevel||2,text:f.text||f.originalText||'',prereq:f.prereq||''})) : []; }
function parseClassFeaturesByLevel(sp){
  if(!sp) return {base:[], choicesByLevel:[], tables:[]};
  const base=specBaseFeaturesV54(sp);
  const by={};
  for(const f of specClassFeaturesV54(sp)){ if(RESTRINGIDO_NON_ABILITY_TITLES.has(f.title)) continue; const lvl=Number(f.level||2); if(!by[lvl]) by[lvl]=[]; by[lvl].push(f); }
  const choicesByLevel=Object.keys(by).map(Number).sort((a,b)=>a-b).map(level=>({level,title:`Habilidades de ${level}º nível`,abilities:by[level]}));
  const table=sp.levelTable||{};
  const tableText=Object.entries(table).map(([lvl,gain])=>`${lvl}º ${gain}`).join('\n');
  const tables=tableText?[{id:`${sp.id}_table_structured`,title:'Tabela de ganhos por nível',text:tableText}]:[];
  return {base, choicesByLevel, tables};
};
function specTrainingConfig(c){
  const sr=currentSpecRuleV54(c); const allSkills=trainableSkills().map(s=>s.id);
  return {resAllowed:sr.resAllowed||['astucia','fortitude','integrity','reflexes','will'],resMax:sr.resMax??1,resFixed:sr.resFixed||[],skillAllowed:allSkills.filter(id=>!(sr.skillForbidden||[]).includes(id)),skillBaseAllowed:sr.skillBaseAllowed||[],skillBaseNeed:sr.skillBaseNeed||0,skillAnyNeed:sr.skillAnyNeed??0,skillForbidden:sr.skillForbidden||[],skillFixed:sr.skillFixed||[],skillChoiceGroups:sr.skillChoiceGroups||[],masterMax:masterSkillLimit(c),masteryText:(sr.masteries||[]).join(', ')||'Sem maestrias cadastradas.',cdAttributes:sr.cdAttributes||ATTRS.map(a=>a[0]),energyAddsAttribute:!!sr.energyAddsAttribute,hasEnergy:!sr.stamina,notes:`${specialization(c)?.name||'Especialização'}: ${sr.resFixed?.length?'resistências fixas':'escolha resistência permitida'}; ${sr.skillFixed?.length?`${sr.skillFixed.length} perícia(s) fixa(s) + `:''}${sr.skillBaseNeed||0} perícia(s) do grupo obrigatório${(sr.skillChoiceGroups||[]).length?` + ${sr.skillChoiceGroups.map(g=>`${g.count} de (${g.options.map(skillName).join(' ou ')})`).join(' + ')}`:''} + ${sr.skillAnyNeed||0} perícia(s) livres.`};
};
function choiceGroupChosenCount(c,group){ return (c.choices.skills||[]).filter(id=>group.options.includes(id)).length; }
function skillLimit(c){ const cfg=specTrainingConfig(c); const choiceTotal=(cfg.skillChoiceGroups||[]).reduce((a,g)=>a+(g.count||0),0); return cfg.skillBaseNeed + choiceTotal + cfg.skillAnyNeed + extraSkillSlots(c); };
function reclampSkillsAfter(c){
  const allowedIds=trainableSkills().map(s=>s.id);
  const newSkillMax=skillLimit(c);
  const newMasterMax=masterSkillLimit(c);
  return {...c, choices:{...c.choices,
    skills:clampSelection(c.choices.skills||[], allowedIds, newSkillMax),
    masterSkills:clampSelection(c.choices.masterSkills||[], allowedIds, newMasterMax)
  }};
}
function resistanceLimit(c){ return specTrainingConfig(c).resMax; };
function specializationEnergyBonusV54(c){ const sr=currentSpecRuleV54(c); if(!sr.energyAddsAttribute) return 0; const k=c.energyAttribute||c.cdAttribute||sr.cdAttributes?.[0]; return Math.max(0, mod(finalAttr(c,k))); }
function hpDieMax(hitDie){ const m=String(hitDie||'d8').match(/d(\d+)/i); return m?Number(m[1]):8; }
function hpGainForLevel(c,level,hpPer,dieMax){
  const g=c.hpGains?.[level];
  if(g?.mode==='min') return 1;
  if(g?.mode==='roll') return Math.max(1, Math.min(dieMax, Number(g.value)||1));
  return hpPer;
}
function calc(c){
  const lvl=Number(c.level)||1, con=mod(finalAttr(c,'constitution')), dex=mod(finalAttr(c,'dexterity'));
  const sp=specialization(c); const sr=currentSpecRuleV54(c); const uniform=c.inventory.items.find(i=>i.type==='uniform'&&i.equipped); const shield=c.inventory.items.find(i=>i.type==='shield'&&i.equipped);
  const hpBase=sr.hpBase||sp?.hpBase||10, hpPer=sr.hpPerLevel||sp?.hpPerLevel||5, pePer=sr.energyPerLevel??sp?.energyPerLevel??0;
  const hitDie=sr.hitDie||sp?.hitDie||'d8', dieMax=hpDieMax(hitDie);
  let hpDiceSum=0; for(let l=2;l<=lvl;l++) hpDiceSum += hpGainForLevel(c,l,hpPer,dieMax) + Math.max(0,con);
  const hpMax=Math.max(1,hpBase+con+hpDiceSum + accessoryBonus(c,'hp') + originExtraHp(c) + restringidoHpGiftBonus(c));
  const peMax=(sr.stamina||c.isRestricted||c.originId===ORIGIN.RESTRINGIDO)?0:Math.max(0,pePer*lvl + specializationEnergyBonusV54(c) + accessoryBonus(c,'pe') + originExtraPe(c));
  const staminaMax=restringidoStaminaMax(c);
  const movement=9 + accessoryBonus(c,'movement') + originMovementBonus(c);
  const esquivaBonus=restringidoIsSpec(c)?restringidoEsquivaBonus(lvl):0;
  const defense=10+dex+Math.floor(lvl/2)+(uniform?.defenseBonus||0)+accessoryBonus(c,'defense')+esquivaBonus+restringidoDefenseAttrBonus(c)+escolhidoVowDefenseBonus(c)+santuarioDefenseBonus(c);
  const skillMap=Object.fromEntries(rules.skills.map(s=>[s.id, skillBonus(c,s)]));
  const resMap=Object.fromEntries(RESISTANCES.map(r=>[r[0], resistanceBonus(c,r[0])]));
  const attention=10+(skillMap.percepcao||0)+accessoryBonus(c,'attention')+originAttentionBonus(c);
  const cd=c.cdAttribute?(10+Math.floor(lvl/2)+mod(finalAttr(c,c.cdAttribute))+trainingBonus(lvl)+accessoryBonus(c,'cd')+(restringidoIsSpec(c)?restringidoImplementoCelesteBonus(lvl):0)):null;
  const restringidoRd=restringidoRdFromGifts(c);
  return {level:lvl,tb:trainingBonus(lvl),hpMax,peMax,staminaMax,soulMax:hpMax,movement,defense,attention,cd,initiative:dex+accessoryBonus(c,'initiative')+originInitiativeBonus(c),rd:(shield?.rd||0)+restringidoRd.physical+escolhidoVowRd(c)+escolhidoTalentRd(c),rdTechnique:restringidoRd.technique,attackBonus:flatAttackBonus(c),damageBonus:flatDamageBonus(c),skillMap,resMap};
};
function levelTasks(c,to){
  const tasks=[]; const sp=specialization(c); const table=sp?.levelTable||{}; const sr=currentSpecRuleV54(c);
  for(let lvl=Number(c.level||1)+1; lvl<=to; lvl++){
    tasks.push(`Nível ${lvl}: adicionar 1 dado de vida (${sr.hitDie||sp?.hitDie||'dado da especialização'}) e recalcular PV máximo.`);
    tasks.push(`Nível ${lvl}: recalcular PE/Estamina, Defesa, Atenção, limites de perícia, talentos e aptidões.`);
    if(!(c.isRestricted||c.originId===ORIGIN.RESTRINGIDO)) tasks.push(`Nível ${lvl}: receber 1 Aptidão Amaldiçoada, respeitando pré-requisitos.`);
    if(table[String(lvl)]) tasks.push(`${sp?.name||'Especialização'}, tabela de nível ${lvl}: ${table[String(lvl)]}.`);
    if(lvl%4===0) tasks.push(`Nível ${lvl}: distribuir +2 pontos de atributo.`);
    if([5,9,13,17].includes(lvl)) tasks.push(`Nível ${lvl}: bônus de treinamento aumenta para ${trainingBonus(lvl)}.`);
    if(lvl===10) tasks.push('Nível 10: escolher 1 perícia treinada para se tornar Mestre.');
    if(c.originId===ORIGIN.DERIVADO && lvl%4===0) tasks.push(`Derivado, nível ${lvl}: Desenvolvimento Inesperado concede +1 ponto e +1 limite no atributo escolhido.`);
    if(c.originId===ORIGIN.RESTRINGIDO && lvl%6===0) tasks.push(`Restringido, nível ${lvl}: Ápice Corporal concede +2 em Força, Destreza ou Constituição.`);
    if(fetoId(c.originId) && lvl%5===0) tasks.push(`Feto Amaldiçoado Híbrido, nível ${lvl}: recebe outra Característica de Anatomia.`);
    if(semTecnicaId(c.originId)||escolhidoId(c.originId)){ const label=escolhidoId(c.originId)?'O Escolhido':'Sem Técnica'; if([3,13,17].includes(lvl)) tasks.push(`${label}, nível ${lvl}: aplicar bônus de Empenho Implacável em 2 perícias e em jogada de ataque ou TR.`); if([6,15,19].includes(lvl)) tasks.push(`${label}, nível ${lvl}: recebe habilidade de especialização adicional.`); if([1,10].includes(lvl)) tasks.push(`${label}, nível ${lvl}: recebe talento ou aptidão amaldiçoada à escolha.`); if(lvl===4) tasks.push(`${label}, nível 4: recebe Novo Estilo da Sombra${escolhidoId(c.originId)?' ("Tocado por Deus")':''} e Domínio Simples.`); if([8,12,16,20].includes(lvl)) tasks.push(`Novo Estilo da Sombra, nível ${lvl}: recebe técnica de estilo adicional.`); }
    if(c.originId===ORIGIN.HERDADO){ if(c.choices?.herdadoClan==='gojo' && lvl%2===0) tasks.push(`Clã Gojo, nível ${lvl}: +1 PE máximo adicional.`); if(c.choices?.herdadoClan==='kamo') tasks.push(`Clã Kamo, nível ${lvl}: +1 PV máximo adicional.`); if(['gojo','zenin'].includes(c.choices?.herdadoClan) && [5,10,15,20].includes(lvl)) tasks.push(`Clã ${herdadoClan(c)?.name||''}, nível ${lvl}: escolha adicional ligada a feitiço/foco do clã.`); }
  }
  tasks.push('Focos/Bônus de Interlúdio não são ganho automático de nível; o mestre/admin deve conceder manualmente.'); return [...new Set(tasks)];
};

createRoot(document.getElementById('root')).render(<App/>);