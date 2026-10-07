# Segurança e autorização

## Modelo
Organização é o tenant. Usuários recebem membership com papéis: owner, admin, operator, analyst, client_viewer e service_agent. Permissões podem ter escopo global, empresa ou agente.

## Regras
- Autentique toda operação protegida.
- Autorize no servidor antes de ler ou escrever.
- RLS deve reforçar o isolamento.
- API keys têm escopo, expiração, rotação e hash armazenado.
- Secrets ficam em secret manager/variáveis protegidas e nunca são retornados em respostas.
- Registre ações sensíveis em audit events.
- Rate limit, validação de payload e proteção contra replay são obrigatórios para webhooks.

Nunca reutilize credenciais expostas anteriormente.
