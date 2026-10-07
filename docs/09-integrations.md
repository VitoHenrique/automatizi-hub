# Integrações

## Primeiras integrações candidatas
Meta Ads, CRM próprio da DBX, WhatsApp, agenda e webhooks genéricos.

## Adaptadores
Cada integração deve ter adapter isolado, health check, status de conexão, última sincronização, erros recentes, retry com backoff e idempotência.

## Secrets
Tokens e credenciais são armazenados fora do banco público ou cifrados por mecanismo apropriado. A UI mostra apenas estado e metadados não sensíveis.

## Webhooks
Validar assinatura quando disponível, registrar evento bruto com retenção definida, deduplicar por event id e responder rapidamente; processamento pesado ocorre de forma assíncrona quando necessário.
