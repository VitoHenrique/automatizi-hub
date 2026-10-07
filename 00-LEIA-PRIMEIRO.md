# LEIA PRIMEIRO — Estado real do projeto

## Importante
O Automatizi HUB será criado do zero.

- O repositório GitHub antigo foi deletado.
- O projeto Supabase antigo foi deletado.
- Não existe banco antigo para migrar.
- Não existe schema antigo que precise ser preservado.
- Não existe aplicação antiga que precise ser mantida compatível.
- Não existem dados, usuários, API keys ou integrações antigas que devam ser reutilizados.

Este pacote é a especificação oficial inicial do novo projeto.

## O que você deve fazer
1. Inicializar uma aplicação nova.
2. Criar/configurar um novo projeto Supabase.
3. Definir as variáveis de ambiente necessárias sem expor secrets.
4. Criar migrations novas, começando pelo fundamento multiempresa.
5. Criar autenticação, organizações, memberships e RLS.
6. Criar seeds opcionais e controlados para a DBX Global.
7. Implementar por fases, começando pela Fase 0.

## O que você não deve fazer
- Não procurar ou restaurar o projeto antigo.
- Não tentar migrar tabelas antigas.
- Não criar compatibilidade com a antiga central de tarefas.
- Não assumir que existe banco, usuário ou integração configurado.
- Não apagar nada do projeto novo sem confirmação.

Se os demais documentos mencionarem “repositório atual”, “banco atual”, “legado”, “migração” ou “backup”, interprete essas referências como regras gerais de segurança, não como indicação de que exista um sistema antigo disponível. Neste projeto específico, o estado inicial é limpo.
