# Feiticeiros & Maldições — App de Ficha Automatizada

Versão reconstruída do zero com:

- Criação guiada real;
- Rolagem 4d6 descartando o menor;
- Créditos locais, com schema Supabase para produção;
- Catálogo completo de armas do livro;
- Uniformes, escudos, kits e itens especiais extraídos/estruturados;
- Inventário em cards de equipamento;
- Perfil Mundano automático/consultável;
- Perfil Amaldiçoado com aptidões, técnica, passivas, ativas, votos e domínio;
- Perfil Restrito;
- Ficha/Combate operacional;
- Level Up guiado;
- Compêndio pesquisável com texto extraído do PDF;
- Admin/revisão preparado.

## Rodar local

```powershell
npm install
npm run dev
```

## Build

```powershell
npm run build
```

## Supabase

O schema inicial está em `supabase/schema.sql`.

A versão atual roda offline/localStorage. Para produção, conecte as RPCs de rolagem/crédito ao Supabase.
