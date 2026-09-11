# v5.4 — Revisão completa das Especializações

Ajustes principais:

- Estruturadas as 6 especializações do livro:
  - Lutador
  - Especialista em Combate
  - Especialista em Técnica
  - Controlador
  - Suporte
  - Restringido
- Cada especialização agora possui:
  - PV inicial
  - PV por nível
  - dado de vida
  - PE por nível ou Estamina
  - atributos de CD permitidos
  - treinamentos e maestrias
  - resistências permitidas/fixas
  - perícias obrigatórias por grupo
  - perícias livres
  - pré-requisitos de multiclasse
  - tabela de ganhos por nível
  - habilidades automáticas/base
  - habilidades escolhíveis agrupadas por nível
- Perfil Mundano passa a usar dados estruturados em vez de texto solto.
- Habilidades automáticas com escolha usam seleção por opções detectadas no texto, sem campo livre.
- Level Up lê a tabela estruturada da especialização.
- Cálculo de PE agora considera especializações que somam atributo de técnica.
- Restringido usa Estamina/PE 0.
- Build testado com sucesso.
