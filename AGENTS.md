# AGENTS.md — Regras do Automatizi HUB

## Missão
Construir e manter o Automatizi HUB: uma plataforma B2B multiempresa para operar empresas clientes, agentes de IA, integrações, métricas, alertas, tarefas e documentação.

## Estado inicial obrigatório do projeto
Este projeto está sendo criado do zero. O GitHub/repositório antigo e o projeto Supabase antigo foram excluídos pelo proprietário. Portanto:

- não existe código legado confiável para preservar;
- não existe banco antigo para migrar;
- não tente localizar, restaurar ou compatibilizar com a antiga central de tarefas;
- não espere encontrar tabelas, migrations, usuários, API keys ou integrações pré-existentes;
- crie um novo repositório e um novo projeto Supabase conforme esta documentação;
- trate esta documentação como a especificação inicial oficial;
- qualquer código encontrado no ambiente deve ser tratado como rascunho até ser validado.

O primeiro trabalho é a fundação limpa: inicializar a aplicação, configurar o novo Supabase, criar o schema inicial por migrations, autenticação, organização/tenant, RLS e seed controlado. Não há necessidade de executar limpeza, backup ou migração do sistema antigo.

## Ordem obrigatória antes de codar
1. Leia `PRODUCT.md`, `DESIGN.md` e os documentos relevantes em `docs/`.
2. Inspecione o diretório atual apenas para saber se está vazio ou contém arquivos novos.
3. Verifique decisões em `docs/15-decision-log.md`.
4. Declare escopo, arquivos que serão criados, variáveis de ambiente necessárias, riscos e critérios de aceitação.
5. Só então implemente.

## Regras inegociáveis
- Não misture empresa, agente, execução e tarefa usando prefixos de texto ou títulos mágicos.
- Use IDs e relacionamentos formais.
- Não altere ou apague dados sem confirmação explícita e backup/exportação verificável.
- Toda alteração de banco deve ser feita por migration versionada, idempotente e revisada.
- Nunca coloque credenciais, tokens ou secrets em código, documentação, logs ou commits.
- Autorização deve existir no servidor e no banco; RLS não é opcional.
- Separe `lifecycle_status`, `operational_health` e `progress`.
- Toda mutação deve validar organização, empresa, permissões e escopo.
- APIs devem ser versionadas, auditáveis e idempotentes quando aplicável.
- Não invente regras de negócio silenciosamente. Registre propostas e dúvidas.
- Não marque uma tarefa como concluída sem executar a verificação correspondente.

## Qualidade obrigatória
Antes de entregar uma fase, execute os scripts disponíveis para typecheck, lint, testes e build. Verifique acessibilidade, responsividade, estados de carregamento, vazio, erro e permissão. Atualize a documentação e o decision log quando houver mudança de arquitetura ou domínio.

## Forma de trabalho
Implemente em fases pequenas e verificáveis. Para cada fase informe: objetivo, mudanças, testes executados, resultado, pendências e riscos. Não implemente o sistema inteiro em uma única mudança.
