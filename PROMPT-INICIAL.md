# Prompt para o agente de desenvolvimento

Você vai construir o Automatizi HUB seguindo integralmente os arquivos `AGENTS.md`, `PRODUCT.md`, `DESIGN.md` e `docs/*.md` deste pacote.

## Estado inicial confirmado
O projeto antigo foi encerrado deliberadamente: o repositório GitHub antigo foi deletado e o projeto Supabase antigo também foi deletado. Estamos começando o Automatizi HUB do zero.

Não há legado para migrar, dados antigos para preservar ou compatibilidade retroativa a manter. Não procure tabelas antigas, não tente restaurar o sistema anterior e não crie adaptadores para a antiga central de tarefas. Caso encontre arquivos remanescentes no diretório, trate-os como descartáveis até validação explícita.

O novo agente deve criar uma base limpa, um novo repositório e um novo projeto Supabase. A documentação deste pacote é a fonte oficial inicial de verdade.

Antes de implementar:
1. leia todos os documentos;
2. inspecione o diretório atual para confirmar o estado inicial;
3. apresente o diagnóstico da fundação nova e um plano por fases;
4. liste as variáveis de ambiente necessárias, sem pedir ou registrar secrets no chat;
5. crie a estrutura inicial do projeto e as migrations novas;
6. não tente migrar ou compatibilizar dados antigos;
7. não use credenciais reais em código ou documentação.

Depois, implemente somente a Fase 0 do roadmap. Não avance para as fases seguintes sem apresentar os testes, os riscos, as decisões e o resultado verificável da Fase 0.

O produto deve ser multiempresa desde o início, com autorização server-side, RLS, auditoria, estados de loading/erro/vazio, acessibilidade e responsividade. Empresas são o nível principal; agentes vivem dentro de empresas; tarefas, métricas, alertas, integrações e execuções devem possuir relacionamentos formais por ID.

Ao terminar cada etapa, informe:
- arquivos criados ou alterados;
- migrations executadas ou apenas preparadas;
- testes executados e saída real;
- critérios de aceitação atendidos;
- pendências e riscos;
- decisões que precisam entrar no decision log.

Não declare o produto pronto por possuir apenas uma interface visual. A entrega só é concluída quando comportamento, persistência, autorização e testes estiverem verificados.
