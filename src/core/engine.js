import { ATTRIBUTES, RESISTANCES, SKILLS, SPECIALIZATIONS, ORIGINS, WEAPONS, UNIFORMS, SHIELDS, KITS } from '../data/rules.js';

export function id() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 12);
}

export function mod(value) {
  if (typeof value !== 'number') return 0;
  return Math.floor((value - 10) / 2);
}

export function fmt(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function roll4d6DropLowest() {
  const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  const dropped = Math.min(...dice);
  return { id: id(), dice, dropped, total: dice.reduce((a,b)=>a+b,0) - dropped };
}

export function rollSet() {
  return Array.from({ length: 6 }, () => roll4d6DropLowest());
}

export function createEmptyCharacter() {
  return {
    id: id(),
    identity: {
      name: '', playerName: '', age: '', height: '', weight: '', sex: '', imageUrl: '',
      personalityTraits: '', ideals: '', bonds: '', complications: '', innateDomain: '',
    },
    level: 1,
    grade: '',
    credits: 5,
    firstRollFreeUsed: false,
    rollHistory: [],
    activeRolls: [],
    assigned: {},
    originBonuses: {},
    originId: '',
    specializationId: '',
    cdAttribute: '',
    energyAttribute: '',
    selectedChoices: {},
    trainedSkills: [],
    trainedResistances: [],
    talents: [],
    technique: {
      id: '', name: '', baseFunction: '', rawText: '', passives: [], actives: [], domain: '', status: 'draft'
    },
    aptitudes: [],
    vows: [],
    restricted: { enabled: false, foundation: '', passives: [], actives: [], gifts: [] },
    inventory: { money: 0, maxSpaces: 8, items: [] },
    combat: { hpCurrent: null, hpTemp: 0, energyCurrent: null, energyTemp: 0, soulCurrent: null, conditions: [], log: [] },
    interlude: { focusAvailable: 0, tracks: {} },
    summons: [],
    notes: '',
  };
}

export function getOrigin(character) {
  return ORIGINS.find(o => o.id === character.originId);
}

export function getSpec(character) {
  return SPECIALIZATIONS.find(s => s.id === character.specializationId);
}

export function finalAttribute(character, key) {
  const base = character.assigned[key];
  if (typeof base !== 'number') return undefined;
  return base + (character.originBonuses[key] || 0);
}

export function trainingBonus(level) {
  // Placeholder isolated. Can be replaced when exact table is extracted.
  return Math.max(2, Math.ceil(level / 4) + 1);
}

export function calcHpMax(character) {
  const spec = getSpec(character);
  if (!spec) return 0;
  const con = mod(finalAttribute(character, 'constitution'));
  return Math.max(1, spec.hpBase + con + Math.max(0, character.level - 1) * (spec.hpPerLevel + con));
}

export function calcEnergyMax(character) {
  const spec = getSpec(character);
  if (!spec || spec.usesStamina) return 0;
  const attrBonus = spec.energyAttributeOptions?.length && character.energyAttribute ? mod(finalAttribute(character, character.energyAttribute)) : 0;
  return Math.max(0, (spec.energyBase || 0) + attrBonus + Math.max(0, character.level - 1) * (spec.energyPerLevel || 0));
}

export function calcDefense(character) {
  const dex = mod(finalAttribute(character, 'dexterity'));
  const half = Math.floor(character.level / 2);
  let bonus = 0;
  for (const item of character.inventory.items || []) {
    if (item.equipped && item.type === 'uniform') bonus += item.defenseBonus || 0;
    if (item.equipped && item.type === 'shield') bonus += item.defenseBonus || 0;
  }
  return 10 + dex + half + bonus;
}

export function calcInitiative(character) {
  return mod(finalAttribute(character, 'dexterity'));
}

export function calcMovement(character) {
  return 9;
}

export function skillBonus(character, skillId) {
  const skill = SKILLS.find(s => s.id === skillId);
  if (!skill) return 0;
  return mod(finalAttribute(character, skill.attribute)) + (character.trainedSkills.includes(skillId) ? trainingBonus(character.level) : 0);
}

export function resistanceBonus(character, resId) {
  const res = RESISTANCES.find(r => r.id === resId);
  if (!res) return 0;
  return mod(finalAttribute(character, res.attribute)) + (character.trainedResistances.includes(resId) ? trainingBonus(character.level) : 0);
}

export function calcAttention(character) {
  return 10 + skillBonus(character, 'percepcao');
}

export function calcInventorySpaces(character) {
  return (character.inventory.items || []).reduce((sum, item) => sum + (item.spaces || 0) * (item.quantity || 1), 0);
}

export function calcDerived(character) {
  const hpMax = calcHpMax(character);
  const energyMax = calcEnergyMax(character);
  return {
    hpMax,
    energyMax,
    soulMax: hpMax,
    defense: calcDefense(character),
    attention: calcAttention(character),
    initiative: calcInitiative(character),
    movement: calcMovement(character),
    trainingBonus: trainingBonus(character.level),
    spacesUsed: calcInventorySpaces(character),
  };
}

export function assignRoll(character, attributeKey, rollId) {
  const next = structuredClone(character);
  for (const key of ATTRIBUTES.map(a=>a.id)) {
    if (next.assigned[key] && next.rollAssignments?.[key] === rollId) delete next.assigned[key];
  }
  next.rollAssignments = next.rollAssignments || {};
  if (!rollId) {
    delete next.rollAssignments[attributeKey];
    delete next.assigned[attributeKey];
    return next;
  }
  const roll = next.activeRolls.find(r => r.id === rollId);
  if (!roll) return next;
  for (const [attr, usedId] of Object.entries(next.rollAssignments)) {
    if (usedId === rollId) {
      delete next.rollAssignments[attr];
      delete next.assigned[attr];
    }
  }
  next.rollAssignments[attributeKey] = rollId;
  next.assigned[attributeKey] = roll.total;
  return next;
}

export function setOriginBonus(character, bonusKey, attr) {
  const next = structuredClone(character);
  const origin = getOrigin(next);
  if (!origin) return next;
  next.originBonusChoices = next.originBonusChoices || {};
  next.originBonusChoices[bonusKey] = attr;
  next.originBonuses = {};
  const used = new Set();
  for (const [idx, bonus] of origin.attributeBonusRule.bonuses.entries()) {
    const selected = next.originBonusChoices[`bonus_${idx}`];
    if (!selected) continue;
    if (!origin.attributeBonusRule.stackSame && used.has(selected)) continue;
    used.add(selected);
    next.originBonuses[selected] = (next.originBonuses[selected] || 0) + bonus;
  }
  return next;
}

export function performAttributeRoll(character) {
  const next = structuredClone(character);
  const free = !next.firstRollFreeUsed;
  if (!free && next.credits <= 0) return { character: next, ok: false, message: 'Sem créditos para reroll.' };
  const rolls = rollSet();
  next.activeRolls = rolls;
  next.rollHistory.unshift({ id: id(), date: new Date().toISOString(), rolls, free, cost: free ? 0 : 1 });
  next.firstRollFreeUsed = true;
  if (!free) next.credits -= 1;
  next.assigned = {};
  next.rollAssignments = {};
  return { character: next, ok: true, message: free ? 'Rolagem gratuita realizada.' : 'Reroll realizado. 1 crédito gasto.' };
}

export function addCatalogItem(character, catalogType, itemId) {
  const catalogs = { weapon: WEAPONS, uniform: UNIFORMS, shield: SHIELDS, kit: KITS };
  const source = catalogs[catalogType]?.find(i => i.id === itemId);
  if (!source) return character;
  const next = structuredClone(character);
  next.inventory.items.push({ ...source, id: id(), ruleId: source.id, type: catalogType, quantity: 1, equipped: catalogType === 'uniform' });
  return next;
}

export function toggleEquipped(character, itemId) {
  const next = structuredClone(character);
  const item = next.inventory.items.find(i => i.id === itemId);
  if (!item) return next;
  if (item.type === 'uniform' && !item.equipped) {
    next.inventory.items.forEach(i => { if (i.type === 'uniform') i.equipped = false; });
  }
  item.equipped = !item.equipped;
  return next;
}

export function removeItem(character, itemId) {
  const next = structuredClone(character);
  next.inventory.items = next.inventory.items.filter(i => i.id !== itemId);
  return next;
}

export function missingTasks(character) {
  const tasks = [];
  if (!character.activeRolls?.length) tasks.push({ id: 'roll', text: 'Rolar os 6 valores de atributo.', tab: 'Criação' });
  if (ATTRIBUTES.some(a => typeof character.assigned[a.id] !== 'number')) tasks.push({ id: 'assign', text: 'Distribuir todos os valores rolados.', tab: 'Criação' });
  if (!character.originId) tasks.push({ id: 'origin', text: 'Escolher Origem.', tab: 'Criação' });
  const origin = getOrigin(character);
  if (origin?.attributeBonusRule) {
    const expected = origin.attributeBonusRule.bonuses.length;
    const selected = Object.keys(character.originBonusChoices || {}).length;
    if (selected < expected) tasks.push({ id: 'origin-bonus', text: `Escolher bônus de atributos da Origem (${selected}/${expected}).`, tab: 'Criação' });
  }
  if (!character.specializationId) tasks.push({ id: 'spec', text: 'Escolher Especialização.', tab: 'Criação' });
  const spec = getSpec(character);
  if (spec && !character.cdAttribute) tasks.push({ id: 'cd', text: 'Escolher atributo de CD da Especialização.', tab: 'Criação' });
  if (spec?.energyAttributeOptions?.length && !spec.usesStamina && !character.energyAttribute) tasks.push({ id: 'energy-attr', text: 'Escolher atributo de energia da Especialização.', tab: 'Criação' });
  if (spec) {
    for (const choice of spec.skillChoices || []) {
      const count = choice.type === 'resistance' ? character.trainedResistances.filter(x => choice.options === 'any' || choice.options.includes(x)).length : character.trainedSkills.filter(x => choice.options === 'any' || choice.options.includes(x)).length;
      if (count < choice.quantity) tasks.push({ id: choice.id, text: `${choice.label}: ${count}/${choice.quantity}.`, tab: 'Criação' });
    }
  }
  if (!character.inventory.items.some(i => i.type === 'uniform')) tasks.push({ id: 'uniform', text: 'Escolher uniforme inicial.', tab: 'Inventário' });
  if (!character.inventory.items.some(i => i.type === 'kit')) tasks.push({ id: 'kit', text: 'Escolher 1 kit de ferramentas.', tab: 'Inventário' });
  const cost1 = character.inventory.items.filter(i => i.cost === 1).reduce((s,i)=>s+(i.quantity||1),0);
  if (cost1 < 2) tasks.push({ id: 'equip-cost1', text: `Escolher 2 equipamentos de custo 1 (${cost1}/2).`, tab: 'Inventário' });
  if (origin && origin.grantsTechnique && !character.technique.name) tasks.push({ id: 'technique', text: 'Escolher ou cadastrar Técnica Amaldiçoada.', tab: 'Perfil Amaldiçoado' });
  if (origin?.restricted && !character.restricted.foundation) tasks.push({ id: 'restricted', text: 'Escolher Fundamento Marcial do Perfil Restrito.', tab: 'Perfil Restrito' });
  return tasks;
}

export function generateSmartCharacter(character, build = 'auto') {
  let next = structuredClone(character);
  if (!next.activeRolls.length) next = performAttributeRoll(next).character;
  const rolls = [...next.activeRolls].sort((a,b)=>b.total-a.total);
  const spec = build === 'auto' ? SPECIALIZATIONS[Math.floor(Math.random()*SPECIALIZATIONS.length)] : SPECIALIZATIONS.find(s=>s.id===build) || SPECIALIZATIONS[0];
  next.specializationId = spec.id;
  next.cdAttribute = spec.cdAttributes[0];
  if (spec.energyAttributeOptions?.length) next.energyAttribute = spec.energyAttributeOptions[0];
  const origin = ORIGINS.find(o => spec.id === 'restringido' ? o.id === 'restringido' : o.id === 'inato') || ORIGINS[0];
  next.originId = origin.id;
  next.restricted.enabled = origin.restricted;
  next.assigned = {}; next.rollAssignments = {};
  spec.priorityAttributes.forEach((attr, idx) => {
    if (rolls[idx]) { next.assigned[attr] = rolls[idx].total; next.rollAssignments[attr] = rolls[idx].id; }
  });
  next.originBonusChoices = { bonus_0: spec.priorityAttributes[0], bonus_1: spec.priorityAttributes[1] };
  next.originBonuses = { [spec.priorityAttributes[0]]: 2, [spec.priorityAttributes[1]]: 1 };
  next.trainedResistances = spec.skillChoices?.find(c=>c.type==='resistance')?.options?.slice(0,1) || [];
  const wantedSkills = [];
  for (const choice of spec.skillChoices || []) {
    if (choice.type !== 'skill') continue;
    const opts = choice.options === 'any' ? SKILLS.map(s=>s.id) : choice.options;
    for (const opt of opts) if (!wantedSkills.includes(opt) && wantedSkills.length < 6) wantedSkills.push(opt);
  }
  next.trainedSkills = wantedSkills;
  if (!next.inventory.items.length) {
    next = addCatalogItem(next, 'uniform', 'uniforme_comum');
    next = addCatalogItem(next, 'weapon', spec.id === 'especialista_combate' ? 'katana' : 'punhos');
    next = addCatalogItem(next, 'kit', 'kit_medico');
  }
  if (origin.grantsTechnique) {
    next.technique.name = build === 'auto' ? 'Técnica Amaldiçoada Pendente' : `Técnica de ${spec.label}`;
    next.technique.baseFunction = 'Preencha/cadastre o funcionamento base conforme a técnica aprovada.';
  }
  return next;
}
