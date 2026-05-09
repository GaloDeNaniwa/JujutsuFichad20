export const ATTRIBUTES = [
  { id: 'strength', label: 'Força', short: 'FOR', description: 'Poder muscular, físico e bruto. Usada para força bruta, dano com armas e feitos físicos.' },
  { id: 'dexterity', label: 'Destreza', short: 'DES', description: 'Agilidade, reflexos e rapidez. Usada para equilíbrio, esquiva, armas leves e acrobacias.' },
  { id: 'constitution', label: 'Constituição', short: 'CON', description: 'Resistência e vigor. Afeta PV, fortitude, venenos, males físicos e cansaço.' },
  { id: 'intelligence', label: 'Inteligência', short: 'INT', description: 'Raciocínio e intelecto. Usada em aprendizagem, assimilação de informação e perícias mentais.' },
  { id: 'wisdom', label: 'Sabedoria', short: 'SAB', description: 'Experiência, observação e ligação com o mundo. Afeta percepção, intuição e leitura do ambiente.' },
  { id: 'presence', label: 'Presença', short: 'PRE', description: 'Força de personalidade e influência. Usada para ser notado, convencer, intimidar ou se impor.' },
];

export const RESISTANCES = [
  { id: 'fortitude', label: 'Fortitude', attribute: 'constitution' },
  { id: 'reflexes', label: 'Reflexos', attribute: 'dexterity' },
  { id: 'will', label: 'Vontade', attribute: 'wisdom' },
];

export const SKILLS = [
  { id: 'acrobacia', label: 'Acrobacia', attribute: 'dexterity' },
  { id: 'atletismo', label: 'Atletismo', attribute: 'strength' },
  { id: 'furtividade', label: 'Furtividade', attribute: 'dexterity' },
  { id: 'percepcao', label: 'Percepção', attribute: 'wisdom' },
  { id: 'intuicao', label: 'Intuição', attribute: 'wisdom' },
  { id: 'investigacao', label: 'Investigação', attribute: 'intelligence' },
  { id: 'persuasao', label: 'Persuasão', attribute: 'presence' },
  { id: 'intimidacao', label: 'Intimidação', attribute: 'presence' },
  { id: 'enganacao', label: 'Enganação', attribute: 'presence' },
  { id: 'medicina', label: 'Medicina', attribute: 'intelligence' },
  { id: 'oficio', label: 'Ofício', attribute: 'intelligence' },
  { id: 'religiao', label: 'Religião', attribute: 'intelligence' },
  { id: 'historia', label: 'História', attribute: 'intelligence' },
  { id: 'sobrevivencia', label: 'Sobrevivência', attribute: 'wisdom' },
];

export const ORIGINS = [
  {
    id: 'inato',
    label: 'Inato',
    grantsTechnique: true,
    restricted: false,
    description: 'Origem com técnica inata. Concede bônus de atributos e recursos ligados à marca registrada da técnica.',
    attributeBonusRule: { bonuses: [2, 1], stackSame: false },
    features: [
      { id: 'inato-talento-natural', name: 'Talento Natural', mode: 'choice', choiceType: 'talent', quantity: 1, description: 'Escolha um talento permitido pela origem.' },
      { id: 'inato-marca-registrada', name: 'Marca Registrada', mode: 'automatic', description: 'Concede um feitiço adicional com custo reduzido conforme a regra da origem.' },
    ],
  },
  {
    id: 'herdado',
    label: 'Herdado',
    grantsTechnique: true,
    restricted: false,
    description: 'Origem ligada a técnica herdada, linhagem e tradições de clã/família.',
    attributeBonusRule: { bonuses: [2, 1], stackSame: false },
    features: [{ id: 'herdado-tecnica', name: 'Técnica Herdada', mode: 'automatic', description: 'Acesso a técnica herdada e características associadas.' }],
  },
  {
    id: 'derivado',
    label: 'Derivado',
    grantsTechnique: true,
    restricted: false,
    description: 'Origem derivada de uma manifestação peculiar de energia ou técnica.',
    attributeBonusRule: { bonuses: [2, 1], stackSame: false },
    features: [],
  },
  {
    id: 'restringido',
    label: 'Restringido',
    grantsTechnique: false,
    restricted: true,
    description: 'Caminho voltado ao corpo e às restrições. Ativa o Perfil Restrito no lugar do foco comum em técnica amaldiçoada.',
    attributeBonusRule: { bonuses: [2, 1], stackSame: false },
    features: [{ id: 'restringido-perfil', name: 'Perfil Restrito', mode: 'automatic', description: 'Libera Fundamento Marcial, técnicas marciais e Dádivas do Céu.' }],
  },
  {
    id: 'sem_tecnica',
    label: 'Sem Técnica',
    grantsTechnique: false,
    restricted: false,
    description: 'Personagem sem técnica inata. Deve compensar com talentos, ferramentas, armas, votos e outras escolhas.',
    attributeBonusRule: { bonuses: [2, 1], stackSame: false },
    features: [],
  },
  {
    id: 'feto_hibrido',
    label: 'Feto Amaldiçoado Híbrido',
    grantsTechnique: true,
    restricted: false,
    description: 'Origem híbrida com traços amaldiçoados. Precisa de validação detalhada no banco final.',
    attributeBonusRule: { bonuses: [2, 1], stackSame: false },
    features: [],
  },
  {
    id: 'corpo_mutante',
    label: 'Corpo Amaldiçoado Mutante',
    grantsTechnique: true,
    restricted: false,
    description: 'Origem de corpo amaldiçoado com características próprias. Precisa de validação detalhada no banco final.',
    attributeBonusRule: { bonuses: [2, 1], stackSame: false },
    features: [],
  },
];

export const SPECIALIZATIONS = [
  {
    id: 'lutador',
    label: 'Lutador',
    role: 'DPS/Tanker corporal',
    hpBase: 12,
    hpPerLevel: 7,
    hitDie: 'd12',
    energyBase: 4,
    energyPerLevel: 4,
    cdAttributes: ['strength', 'dexterity', 'constitution'],
    skillChoices: [
      { id: 'lutador-res', label: 'Teste de resistência', type: 'resistance', quantity: 1, options: ['fortitude', 'reflexes'] },
      { id: 'lutador-skill-core', label: 'Perícias físicas', type: 'skill', quantity: 2, options: ['acrobacia', 'atletismo', 'furtividade'] },
      { id: 'lutador-skill-free', label: 'Perícias quaisquer', type: 'skill', quantity: 2, options: 'any' },
    ],
    masteries: [{ id: 'lutador-armas', mode: 'automatic', label: 'Armas simples' }],
    features: [{ id: 'lutador-base', name: 'Habilidades Base de Lutador', description: 'Listagem automática das habilidades base do Lutador. Texto completo virá do banco extraído/revisado.' }],
    priorityAttributes: ['strength', 'constitution', 'dexterity', 'wisdom', 'intelligence', 'presence'],
  },
  {
    id: 'especialista_combate',
    label: 'Especialista em Combate',
    role: 'DPS com arma/versátil',
    hpBase: 12,
    hpPerLevel: 6,
    hitDie: 'd10',
    energyBase: 4,
    energyPerLevel: 4,
    cdAttributes: ['strength', 'dexterity', 'wisdom'],
    skillChoices: [
      { id: 'ec-res', label: 'Teste de resistência', type: 'resistance', quantity: 1, options: ['fortitude', 'reflexes'] },
      { id: 'ec-oficio', label: 'Perícias de Ofício', type: 'skill', quantity: 2, options: ['oficio'] },
      { id: 'ec-ath', label: 'Atletismo ou Acrobacia', type: 'skill', quantity: 1, options: ['atletismo', 'acrobacia'] },
      { id: 'ec-free', label: 'Perícias quaisquer', type: 'skill', quantity: 3, options: 'any' },
    ],
    masteries: [{ id: 'ec-armas', mode: 'automatic', label: 'Todas as armas e escudos' }],
    features: [
      { id: 'ec-repertorio', name: 'Repertório do Especialista', description: 'Escolha um estilo/repertório permitido. Texto completo virá do banco extraído/revisado.' },
      { id: 'ec-arte-combate', name: 'Arte do Combate', description: 'Recurso de Pontos de Preparo. Texto completo virá do banco extraído/revisado.' },
    ],
    priorityAttributes: ['strength', 'dexterity', 'constitution', 'wisdom', 'intelligence', 'presence'],
  },
  {
    id: 'especialista_tecnica',
    label: 'Especialista em Técnica',
    role: 'DPS/controle por técnica',
    hpBase: 10,
    hpPerLevel: 5,
    hitDie: 'd8',
    energyBase: 6,
    energyPerLevel: 6,
    energyAttributeOptions: ['intelligence', 'wisdom', 'presence'],
    cdAttributes: ['intelligence', 'wisdom', 'presence'],
    skillChoices: [
      { id: 'et-res', label: 'Teste de resistência', type: 'resistance', quantity: 1, options: ['will', 'reflexes'] },
      { id: 'et-free', label: 'Perícias quaisquer', type: 'skill', quantity: 4, options: 'any' },
    ],
    masteries: [{ id: 'et-kits', mode: 'choice', label: 'Escolha kits/treinamentos permitidos' }],
    features: [{ id: 'et-base', name: 'Habilidades Base de Especialista em Técnica', description: 'Texto completo virá do banco extraído/revisado.' }],
    priorityAttributes: ['intelligence', 'wisdom', 'constitution', 'dexterity', 'presence', 'strength'],
  },
  {
    id: 'controlador',
    label: 'Controlador',
    role: 'Controle/Invocações',
    hpBase: 10,
    hpPerLevel: 5,
    hitDie: 'd8',
    energyBase: 5,
    energyPerLevel: 5,
    energyAttributeOptions: ['intelligence', 'wisdom', 'presence'],
    cdAttributes: ['intelligence', 'wisdom', 'presence'],
    skillChoices: [{ id: 'ctrl-free', label: 'Perícias quaisquer', type: 'skill', quantity: 4, options: 'any' }],
    masteries: [],
    features: [{ id: 'ctrl-base', name: 'Habilidades Base de Controlador', description: 'Texto completo virá do banco extraído/revisado.' }],
    priorityAttributes: ['wisdom', 'intelligence', 'constitution', 'dexterity', 'presence', 'strength'],
  },
  {
    id: 'suporte',
    label: 'Suporte',
    role: 'Cura/buffs/defesa',
    hpBase: 10,
    hpPerLevel: 5,
    hitDie: 'd8',
    energyBase: 5,
    energyPerLevel: 5,
    energyAttributeOptions: ['intelligence', 'wisdom', 'presence'],
    cdAttributes: ['intelligence', 'wisdom', 'presence'],
    skillChoices: [{ id: 'sup-free', label: 'Perícias quaisquer', type: 'skill', quantity: 4, options: 'any' }],
    masteries: [],
    features: [{ id: 'sup-base', name: 'Habilidades Base de Suporte', description: 'Texto completo virá do banco extraído/revisado.' }],
    priorityAttributes: ['wisdom', 'presence', 'constitution', 'intelligence', 'dexterity', 'strength'],
  },
  {
    id: 'restringido',
    label: 'Restringido',
    role: 'Marcial sem PE',
    hpBase: 16,
    hpPerLevel: 8,
    hitDie: 'd12',
    usesStamina: true,
    cdAttributes: ['strength', 'dexterity', 'constitution'],
    skillChoices: [
      { id: 'rest-res', label: 'Teste de resistência', type: 'resistance', quantity: 1, options: ['fortitude', 'reflexes'] },
      { id: 'rest-free', label: 'Perícias quaisquer', type: 'skill', quantity: 4, options: 'any' },
    ],
    masteries: [{ id: 'rest-mastery', mode: 'choice', label: 'Maestrias restritas permitidas' }],
    features: [{ id: 'rest-base', name: 'Habilidades Base de Restringido', description: 'Texto completo virá do banco extraído/revisado.' }],
    priorityAttributes: ['strength', 'dexterity', 'constitution', 'wisdom', 'intelligence', 'presence'],
  },
];

export const WEAPONS = [
  { id: 'punhos', name: 'Ataque Desarmado', category: 'Corpo a Corpo', damage: '1', critical: '20', cost: 0, spaces: 0, properties: ['Natural'], group: 'Desarmado' },
  { id: 'espada_curta', name: 'Espada Curta', category: 'Arma', damage: '1d6', critical: '19-20', cost: 1, spaces: 1, properties: ['Leve'], group: 'Espada' },
  { id: 'katana', name: 'Katana', category: 'Arma', damage: '1d8', critical: '19-20', cost: 2, spaces: 1, properties: ['Versátil'], group: 'Espada' },
  { id: 'bastao', name: 'Bastão', category: 'Arma', damage: '1d6', critical: '20', cost: 1, spaces: 1, properties: ['Versátil'], group: 'Haste' },
  { id: 'faca', name: 'Faca', category: 'Arma', damage: '1d4', critical: '19-20', cost: 1, spaces: 1, properties: ['Leve', 'Arremesso'], group: 'Lâmina' },
  { id: 'martelo_guerra', name: 'Martelo de Guerra', category: 'Arma', damage: '1d10', critical: '20', cost: 2, spaces: 2, properties: ['Pesada'], group: 'Impacto' },
];

export const UNIFORMS = [
  { id: 'uniforme_comum', name: 'Uniforme Comum', defenseBonus: 0, cost: 0, spaces: 0, burden: 0, description: 'Uniforme padrão. Mantém o cálculo comum de Defesa.' },
  { id: 'uniforme_reforcado', name: 'Uniforme Reforçado', defenseBonus: 1, cost: 2, spaces: 1, burden: 0, description: 'Uniforme com proteção adicional.' },
];

export const SHIELDS = [
  { id: 'escudo_leve', name: 'Escudo Leve', defenseBonus: 1, rd: 0, cost: 1, spaces: 1, burden: 0, description: 'Escudo de proteção leve.' },
  { id: 'escudo_pesado', name: 'Escudo Pesado', defenseBonus: 2, rd: 1, cost: 2, spaces: 2, burden: 1, description: 'Escudo mais resistente, porém mais pesado.' },
];

export const KITS = [
  { id: 'kit_medico', name: 'Kit Médico', cost: 1, spaces: 1, description: 'Ferramentas de primeiros socorros e tratamento.' },
  { id: 'kit_investigacao', name: 'Kit de Investigação', cost: 1, spaces: 1, description: 'Ferramentas para análise de cenas e pistas.' },
  { id: 'kit_artesao', name: 'Kit de Artesão', cost: 1, spaces: 1, description: 'Ferramentas para criação e reparo.' },
];

export const CONDITIONS = [
  { id: 'caido', label: 'Caído', group: 'movimento', text: 'Texto completo será extraído/revisado do livro.' },
  { id: 'agarrado', label: 'Agarrado', group: 'movimento', text: 'Texto completo será extraído/revisado do livro.' },
  { id: 'cego', label: 'Cego', group: 'sensorial', text: 'Texto completo será extraído/revisado do livro.' },
  { id: 'surdo', label: 'Surdo', group: 'sensorial', text: 'Texto completo será extraído/revisado do livro.' },
  { id: 'amedrontado', label: 'Amedrontado', group: 'mental', text: 'Texto completo será extraído/revisado do livro.' },
  { id: 'envenenado', label: 'Envenenado', group: 'fisica', text: 'Texto completo será extraído/revisado do livro.' },
  { id: 'incapacitado', label: 'Incapacitado', group: 'fisica', text: 'Texto completo será extraído/revisado do livro.' },
];

export const COMBAT_ACTIONS = [
  { id: 'atacar', label: 'Atacar', type: 'Ação', blockedBy: ['incapacitado'] },
  { id: 'mover', label: 'Mover-se', type: 'Movimento', blockedBy: ['agarrado', 'incapacitado'] },
  { id: 'defender', label: 'Defender', type: 'Reação/Defesa', blockedBy: ['incapacitado'] },
  { id: 'usar_tecnica', label: 'Usar Técnica', type: 'Ação', blockedBy: ['incapacitado'] },
  { id: 'interagir', label: 'Interagir com Objeto', type: 'Livre/Interação', blockedBy: ['incapacitado'] },
];
