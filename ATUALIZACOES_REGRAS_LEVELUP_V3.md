# Atualizações — Regras, Level Up e Anti-burla v3

## Corrigido/refinado

- Tooltips de atributos agora explicam o uso real de cada atributo.
- Tooltips de resistências não usam mais texto genérico; explicam a função de cada resistência.
- Tooltips de perícias agora mostram para que cada perícia serve.
- A lista de perícias continua removendo Iniciativa das opções treináveis.
- Escolhas de resistências e perícias são exibidas já sanitizadas por Especialização.
- Campo de especialização de Ofício adicionado quando Ofício é treinado.
- Validação exige informar qual Ofício foi treinado.
- Técnica Amaldiçoada agora mostra prévia da imagem/print por link.
- Funcionamento Base também mostra prévia da imagem/print por link.
- Level Up agora usa a tabela de nível extraída do texto da Especialização quando disponível, em vez de assumir habilidade em todo nível de forma genérica.
- Level Up mantém as regras globais: dado de vida, PV/PE, aptidão por nível, atributos a cada 4 níveis, bônus de treinamento nos níveis 5/9/13/17 e perícia mestre no nível 10.
- Bônus/Focos de Interlúdio não são mais calculados por nível. Agora são concedidos manualmente pelo mestre/admin no modo local.
- Textos longos em modal foram formatados em parágrafos para melhorar leitura.

## Observação

Esta ainda é uma automação local. A etapa Supabase deve mover rolagem, créditos, concessão de interlúdio e aprovação de técnicas para o servidor.
