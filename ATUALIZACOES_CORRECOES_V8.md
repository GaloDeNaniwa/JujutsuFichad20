# v8 — Correção de bugs, implementação completa do PDF "Abençoado pelos Céus" e otimização de código

## Bugs corrigidos

- **`talentLimit`/`aptitudeLimit` (Empenho Implacável — Sem Técnica e O Escolhido).** O grão "talento OU aptidão" dos níveis 1 e 10 estava sendo somado integralmente aos DOIS limites ao mesmo tempo, dando 2 escolhas extras onde a regra prevê 1 escolha por concessão. Agora existe um seletor explícito ("Empenho Implacável — talento ou aptidão amaldiçoada por concessão") em cada origem, e cada concessão conta só para o limite escolhido.
- **Talentos e habilidades de classe agora disputam o mesmo limite**, como o próprio texto do app já prometia ("Talentos competem com habilidades de classe..."), mas não acontecia de fato: origens sem bônus de talento próprio (Herdado, Derivado, Corpo Amaldiçoado Mutante, Feto Amaldiçoado Híbrido) simplesmente nunca conseguiam marcar nenhum talento. Agora talentos e habilidades de classe dividem o mesmo pool (nível − 1), e escolher um reduz o espaço do outro.
- **Talento Natural (Inato)** não liberava o talento adicional prometido a partir do 4º nível — corrigido.
- **Nível 19 de Empenho Implacável** não concedia o talento adicional (só a habilidade de especialização) — corrigido.
- **Excalibur (e qualquer item homebrew de origem)** aparecia com aviso falso de "sem maestria" mesmo sendo concedida automaticamente pela origem — corrigido.
- **Importar ficha (Admin)** substituía o estado inteiro sem normalizar nem confirmar, podendo corromper o save local com um JSON incompleto/antigo. Agora normaliza os personagens importados (mesmo processo usado ao carregar do localStorage) e pede confirmação antes de substituir.
- **Gerador de IDs (`uid`)** trocado para `crypto.randomUUID()` (com fallback), eliminando risco de colisão em chamadas rápidas em sequência (rolagens, itens).
- Pequenas correções de texto (typo em "Cavaleiro Piedoso": "por" no lugar de "para") e limpeza de um ternário morto em `inventoryMax`.
- **Remoção de código morto duplicado**: o arquivo `src/main.jsx` acumulava, por versões anteriores, 2 a 4 cópias de várias funções centrais (`calc`, `validation`, `specTrainingConfig`, `Creation`, `Mundane`, `WeaponCard`, `CombatSheet`, etc.) — só a última realmente rodava, as outras eram lixo silencioso que confundia qualquer edição futura. Foram removidas 35 definições mortas (~200 linhas), mantendo só a versão realmente usada de cada uma. Todas as mudanças foram verificadas com build + testes automatizados em navegador antes de entrar.
- **`src/core/engine.js` e `src/data/rules.js` removidos**: era um segundo "motor" de regras completo, porém incompleto e desatualizado, que não era importado por nenhuma parte do app (o app real usa só `src/data/rules.json` + a lógica em `main.jsx`). Mantê-lo só criava risco de alguém editar o lugar errado.

## Homebrew "Abençoado pelos Céus" — implementado corretamente

- **Votos Adicionais agora têm efeito mecânico real** (antes eram só texto):
  - *Filho do Adultério*: Força e Constituição travadas em 4; Sabedoria/Destreza (à escolha) com máximo 24 e +4; RD geral cumulativo (+3 a cada nível ímpar a partir do 3º); só recebe aptidão em nível par (já refletido no limite de Perfil Amaldiçoado).
  - *Código de Cavaleiro*: +1 PE máximo por nível (incluso o 1º); bônus de treinamento em testes de Presença (exceto Enganação); Defesa adicional igual à metade do bônus de treinamento — tudo somado automaticamente nos totais da ficha.
- **Talentos exclusivos de O Escolhido com pré-requisitos bloqueando de verdade** (antes só avisavam em uma lista de pendências): Ancestral de Nascien (nível 8), O Grande Lorde/O Grande Duque (exigem uniforme Médio equipado e são mutuamente exclusivos entre si).
- **O Grande Lorde** (RDG = bônus de treinamento com Uniforme Médio) e **O Grande Duque** (metade/depois bônus de treinamento completo em Testes de Resistência com Uniforme Médio) agora entram nos cálculos de RD/TR.
- **O Maior Honrado** e o bônus de "ataque" do Empenho Implacável agora aparecem como um bônus numérico (`+X` acerto / `+X` dano) na Ficha/Combate e em Valores — antes eram apenas "aplique manualmente" sem nenhum número calculado.
- **Aura do Escolhido** agora exige de fato as aptidões Energia Reversa e Cura Em Grupo para poder ser adicionada (botão fica bloqueado com aviso, igual ao padrão usado para aptidões normais).
- **Excalibur e Dama Do Lago** ganharam um seletor de **Grau** (4º ao Grau Especial) no card do item. A **Dama Do Lago em Grau Especial ("Santuário")** ganhou mecânica jogável na Ficha/Combate: registrar acerto sofrido acumula +2 de Defesa (até +6), zerar a pilha ao iniciar um novo combate, e aplicar o PV temporário (1/3 do PV máximo) com um clique.

## Otimização de código e experiência de criação de ficha

- Botão **"Ir"** de volta nas pendências (tanto na barra superior quanto na lista da Criação Guiada), levando direto para a aba onde a pendência precisa ser resolvida.
- **Tooltips** explicando "Atributo de CD" e "Atributo de Energia", com um botão **"Igual à CD"** para preencher Energia de uma vez, já que normalmente são o mesmo atributo.
- **Confirmação antes de trocar Origem/Especialização** quando já existem escolhas dependentes feitas, evitando perda acidental de bônus/resistências já configurados.
- **Memoização** da busca do Compêndio e da formatação de texto de regras (`RuleBox`), evitando recomputar listas grandes a cada tecla digitada.
