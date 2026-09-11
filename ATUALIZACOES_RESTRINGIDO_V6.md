# v6 — Restringido completo ("Abençoado pelos Céus") + correções de fórmulas globais

## Correções globais (afetam todas as fichas, não só Restringido)

- **Bônus de Perícia estava sem "metade do nível do personagem".** A fórmula oficial (p.278) é `Modificador + Metade do Nível + Bônus de Treinamento (se treinado) + Outros`; o app somava só o modificador e o treinamento. Corrigido.
- **Bônus de perícia Mestre estava dobrando o bônus de treinamento.** A regra (p.283) é treinado + metade do bônus de treinamento (ex.: treinamento +2 → mestre +3), não o dobro. Corrigido.
- **Testes de Resistência (Fortitude, Reflexos, Vontade, Astúcia, Integridade) nunca tinham um bônus numérico calculado.** Agora há `resistanceBonus()`, um mapa de resistências em `calc()` e uma tabela nova em **Valores**.
- **CD (Classe de Dificuldade) não existia em lugar nenhum do app**, mesmo escolhendo o atributo de CD na criação. Agora é calculada (`10 + metade do nível + treinamento + atributo + outros`) e aparece em Ficha/Combate e Valores.
- Aba **Valores**: tabela de Perícias não excluía Iniciativa (perícia não treinável), Mestre não era diferenciado de Treinado, e não havia Iniciativa como estatística separada. Corrigido.

## Restringido — Origem "Físico Abençoado" + Especialização "Restrito pelos Céus"

- **Estamina** (recurso exclusivo do Restringido: 4 + 4×nível) agora é calculada, aparece em Ficha/Combate com barra própria (substitui PE, que é 0 para Restringido) e tem gasto/descanso curto/longo dedicados.
- **Restrito pelos Céus**: escolha de Força ou Constituição para somar (limitado ao nível) na Defesa, na nova aba Perfil Restrito.
- **Esquiva Sobre-humana** (+1 Defesa/Reflexos no 3º nível, +1 no 9º, +1 no 16º) agora é aplicada automaticamente.
- **Implemento Celeste** (+2 CD no 4º nível, +1 no 8º, +1 no 16º) agora é aplicada automaticamente.
- **Versatilidade** (+1 em todas as perícias no 2º nível, +2 no 10º) agora é aplicada automaticamente.
- **Teste de Resistência Mestre** (9º nível): Fortitude e Reflexos passam a mestre automaticamente.
- **Dádivas do Céu**: as 9 dádivas (Agilidade Exímia, Físico Robusto, Força Devastadora, Indulgente a Feitiçaria, Mente Afiada, Percepção Aguçada, Reposição Sanguinária, Semblante Cativante, Vigor Infindável) agora existem como lista própria e correta — antes a aba usava trechos genéricos de página do compêndio, sem nenhuma delas de verdade. Limite de escolha (1 a cada 4 níveis, até 5) agora é aplicado; as dádivas numéricas (bônus de +2 em testes por atributo, RD, PV, Estamina, Atenção) já entram nos cálculos.
- **Arsenal Amaldiçoado**: tabela calculada a partir do Bônus de Treinamento (linha atual destacada).
- **Estilo Marcial**: texto e tabela de custo em Estamina por nível de Técnica Marcial, com contagem automática de slots liberados por nível — usa o mesmo editor de Técnica/Passivas/Ativas do resto do app.
- Corrigido um bug de extração: "Estilo Marcial", "Arsenal Amaldiçoado", "Dádivas do Céu", "Equipamentos" etc. apareciam como se fossem habilidades escolhíveis concorrendo com as 53 "Habilidade de Restringido" reais em Perfil Mundano. Agora são excluídas dessa lista e mostradas como referência em Perfil Restrito.
- Origem Restringido (Físico Abençoado, Ápice Corporal Humano, Resiliência Imediata) já estava correta e foi apenas conferida — nenhuma mudança necessária lá.

## Observação sobre o escopo

Esta rodada cobriu, com verificação numérica em navegador (nível 12, Restringido): fórmulas globais de perícia/resistência/CD e todo o sistema mecânico do Restringido. As outras 5 especializações (Lutador, Especialista em Combate, Especialista em Técnica, Controlador, Suporte), as 7 origens, as 74 aptidões, os 51 talentos e os itens especiais têm dados bem estruturados no banco extraído, mas não passaram pelo mesmo nível de auditoria mecânica profunda desta rodada — ainda podem existir lacunas equivalentes (habilidades automáticas por nível não aplicadas a cálculos, por exemplo). Recomenda-se repetir esse processo por especialização.
