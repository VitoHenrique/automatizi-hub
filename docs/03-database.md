# Banco de dados

## Estado inicial
O banco será criado do zero em um novo projeto Supabase. Não há schema anterior, dados legados, usuários antigos ou migrations que precisem ser reaproveitados. As primeiras migrations devem criar a fundação completa de forma ordenada e documentada.

## Requisitos
PostgreSQL com migrations versionadas, transacionais quando possível, idempotentes e com rollback documentado. Todas as tabelas tenant-owned devem ter `organization_id` e timestamps.

## Campos recomendados
IDs UUID, `created_at`, `updated_at`, `created_by` quando aplicável, status controlados por enums/check constraints, índices para tenant e filtros frequentes.

## RLS
Cada policy deve validar membership e escopo da organização. Empresas e agentes nunca podem ser lidos ou alterados por usuário de outra organização. Testes devem provar isolamento positivo e negativo.

## Integridade
Use foreign keys, unique constraints por tenant, check constraints e soft delete/archived status quando histórico for necessário. Não dependa somente da validação do frontend.

## Seeds
Seeds são seguros, identificáveis e separados de migrations estruturais. Devem criar a DBX e os agentes iniciais somente em ambiente explicitamente autorizado.
