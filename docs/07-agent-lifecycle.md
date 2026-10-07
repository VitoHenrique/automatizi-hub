# Ciclo de vida do agente

## Estados
ideia → planejamento → diagnóstico → desenho → construção → integração → testes → operação_assistida → produção.

Estados auxiliares: pausado, bloqueado, arquivado.

## Transições
Transições devem ser explícitas, autorizadas e auditadas. Produção exige critérios de prontidão: documentação, integração validada, testes, responsável, plano de rollback e aprovação.

## Saúde
A saúde pode variar independentemente do ciclo: saudável, atenção, degradado, crítico, sem dados ou desconhecido.

## Versionamento
Mudanças relevantes geram AgentVersion. Promoção para produção deve ser rastreável e reversível.
