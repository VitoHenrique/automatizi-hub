# Arquitetura

## Princípios
Separação clara entre UI, domínio, serviços de aplicação, persistência e integrações externas. O Hermes acessa contratos de API, não banco irrestrito.

## Camadas
- Frontend: rotas, componentes, queries e formulários.
- Backend: autenticação, autorização, casos de uso, validação e auditoria.
- Database: PostgreSQL/Supabase, constraints, índices, RLS e migrations.
- Integration layer: adaptadores, webhooks, retries, idempotência e secrets.
- Observability: logs estruturados, métricas, eventos e alertas.

## Estado inicial
A implementação começa em ambiente limpo. O repositório GitHub antigo e o projeto Supabase antigo foram removidos. Não existe obrigação de compatibilidade com a aplicação anterior. O agente deve inicializar a estrutura atual, registrar a stack escolhida e criar o novo projeto por etapas verificáveis.

## Ambientes
Desenvolvimento, staging e produção devem ser distinguíveis. Configuração vem de variáveis de ambiente gerenciadas pelo ambiente, nunca de arquivos commitados. O primeiro ambiente pode ser desenvolvimento, mas sua configuração deve permitir evolução para staging e produção sem reescrever o domínio.

## Decisão arquitetural
Começar com um monólito modular bem separado; introduzir workers, filas e serviços independentes somente quando houver necessidade operacional comprovada.
