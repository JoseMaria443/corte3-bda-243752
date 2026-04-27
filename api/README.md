# API - Etapa 3 (Redis + Hardening)

## Lenguaje usado
Node.js con TypeScript.

## Arquitectura (hexagonal)
- `domain`: entidades y puertos.
- `application`: casos de uso.
- `infrastructure`: adaptadores de PostgreSQL y Redis.
- `interfaces/http`: controladores y rutas.

## Endpoints
- `GET /api/vacunas/pendientes` (requiere header `x-vet-id`)
- `POST /api/vacunas/aplicar` (requiere header `x-vet-id`)

## Cache-Aside
1. GET intenta leer en Redis.
2. Si hay dato, devuelve cache (`[CACHE HIT]`).
3. Si no hay, consulta PostgreSQL, guarda con TTL y devuelve (`[CACHE MISS]`).

## Invalidacion
- POST de vacuna aplicada borra la llave de cache del veterinario (`[CACHE INVALIDATE]`).

## TTL elegido: 600 segundos (10 min)
- Reduce carga sobre PostgreSQL para una consulta que se repite mucho.
- Mantiene frescura razonable para operacion clinica sin stale data prolongada.
- Ademas hay invalidacion activa en eventos de vacunacion para recortar ventana de inconsistencia.

## Seguridad (SQL Injection hardening)
- Toda entrada de usuario pasa por validacion con `zod`.
- Todas las consultas a PostgreSQL usan placeholders (`$1`, `$2`, ...).
- Nunca se concatena input del usuario dentro del SQL.
- El contexto RLS (`set_config`) tambien usa consulta parametrizada.

### Ataques bloqueados
- `OR '1'='1'`: se trata como string de parametro, no altera el `WHERE`.
- `; DROP TABLE ...`: no se ejecuta como segunda sentencia porque el valor entra como parametro del driver, no como SQL ejecutable.
