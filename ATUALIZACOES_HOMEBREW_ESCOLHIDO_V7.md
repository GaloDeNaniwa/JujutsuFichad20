# v7 — Homebrew "Abençoado pelos Céus": Origem O Escolhido + Novo Estilo da Sombra "Tocado por Deus"

Conteúdo extra, não-oficial, criado por @Vai Wilson Vai (inspirado em Sir Galahad das lendas
arturianas). Adicionado ao app claramente identificado como homebrew (avisos amarelos em
toda tela relevante), sem alterar `rules.json` (que continua sendo só o livro oficial extraído).
Estruturalmente é uma variante temática da origem **Sem Técnica**: mesmo bônus de atributo
(4 pontos, máx. 3 por atributo), mesmo Empenho Implacável, mesmo acesso a Novo Estilo da
Sombra + Domínio Simples no 4º nível — mas trocando "Estudos Dedicados" (2 perícias) pela
característica própria "Aquele Abençoado por Deus".

## Origem: O Escolhido (Homebrew)

- Disponível no seletor de Origem em Criação Guiada, com aviso de que é conteúdo homebrew.
- **Aquele Abençoado por Deus**: +1 PV/nível (+2/nível a partir do 10º) já somado ao PV máximo; +2 perícias treinadas adicionais com seletor próprio.
- **Empenho Implacável**: reaproveita a mesma mecânica de Sem Técnica — inclusive um problema pré-existente foi corrigido: o bônus de perícias/ataque-ou-TR do Empenho Implacável (níveis 3/13/17) nunca era de fato aplicado em nenhum cálculo (só aparecia como texto). Agora há um seletor de quais 2 perícias e qual TR/ataque recebem o bônus, aplicado em `skillBonus`/`resistanceBonus` — vale tanto para Sem Técnica quanto para O Escolhido.
- Habilidades de especialização extra (níveis 6/15/19) do Empenho Implacável também eram só texto e passaram a contar de verdade no limite de escolhas de Perfil Mundano (também corrigido para Sem Técnica).
- Restrição espelhada de Sem Técnica: não pode escolher Especialista em Técnicas.

## Talentos exclusivos (só aparecem com a origem O Escolhido)

Ancestral de Nascien (nível 8+), O Maior Honrado, Cavaleiro da Távola Redonda, O Grande Lorde e O Grande Duque (mutuamente exclusivos — validação avisa se os dois forem escolhidos). Aparecem misturados à lista normal de talentos em Perfil Mundano, com aviso de que são homebrew.

## Novo Estilo da Sombra "Tocado por Deus" (aba Técnicas)

Só aparece para personagens com a origem O Escolhido. Mostra:
- Funcionamento Básico do estilo (escala com o nível na aptidão Controle e Leitura, já mostrando o valor atual do personagem).
- As 7 Técnicas de Estilo (Crux Rubra, Punição Divina, O Santificado, Cavaleiro Piedoso, Conexão Com José, Impetus Divinus, Aura do Escolhido), cada uma com botão para adicionar diretamente como Ativa na Técnica do personagem.
- Os 2 artefatos arthurianos (Excalibur e Dama Do Lago) com tabela de graus e botão para adicionar ao inventário.
- Os 2 Votos Adicionais (Filho do Adultério; Código de Cavaleiro) como escolha opcional.

## Observação

Os números realmente calculáveis (PV, perícias adicionais, Empenho Implacável) foram automatizados. As técnicas de estilo em si (dano, alcance, gasto de PE condicional) ficam como texto de referência para o jogador aplicar manualmente durante o combate — mesmo padrão usado no resto do app para habilidades reativas/situacionais complexas.
