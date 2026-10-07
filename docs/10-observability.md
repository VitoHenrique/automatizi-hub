# Observabilidade

Toda execução deve ter correlation id, agent id, company id, versão, início, fim, resultado, duração, custo quando disponível e erro sanitizado.

## Saúde
Health score deve considerar sucesso, latência, volume, falhas, integrações e ausência de dados. Explique por que um agente está em atenção ou crítico.

## Alertas
Alertas têm severidade, condição, estado, responsável, timestamps, acknowledgement, resolução e vínculo opcional a incidente.

Logs não podem conter secrets, tokens completos ou dados pessoais desnecessários.
