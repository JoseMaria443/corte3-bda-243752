# Cuaderno de Ataques - Clinica Veterinaria

## Stack del frontend
HTML + CSS + JavaScript plano.

## Escenario de ataque 1: Boolean-based SQLi
- Input exacto usado en busqueda: `' OR '1'='1`
- Endpoint probado: `GET /api/mascotas/buscar?q=' OR '1'='1`
- Resultado: no se devolvieron todas las filas por bypass; el valor se trato como texto del ILIKE.
- Por que fallo tecnicamente:
  - La consulta usa placeholder `$1` en lugar de concatenar el input.
  - El driver `pg` envia el valor como parametro, por lo que no altera la estructura del SQL.
- Linea que bloqueo el intento:
  - `api/src/infrastructure/adapters/PostgresVacunacionRepository.ts:51` (`WHERE nombre ILIKE $1`)
  - `api/src/infrastructure/adapters/PostgresVacunacionRepository.ts:56` (`client.query(..., [`%${query}%`])`)

## Escenario de ataque 2: Stacked query
- Input exacto usado en busqueda: `Firulais'; DROP TABLE mascotas; --`
- Endpoint probado: `GET /api/mascotas/buscar?q=Firulais'; DROP TABLE mascotas; --`
- Resultado: no se ejecuto `DROP TABLE`; el payload se trato como cadena de busqueda.
- Por que fallo tecnicamente:
  - El uso de consultas parametrizadas impide que `;` abra una segunda sentencia SQL ejecutable.
  - El backend nunca concatena input dentro del SQL.
- Linea que bloqueo el intento:
  - `api/src/infrastructure/adapters/PostgresVacunacionRepository.ts:56` (query parametrizada)
  - `api/src/interfaces/http/schemas.ts:5` (esquema de validacion para `q`)

## Escenario de ataque 3: UNION SELECT
- Input exacto usado en busqueda: `' UNION SELECT 1, current_user, version(), now(), 99 --`
- Endpoint probado: `GET /api/mascotas/buscar?q=' UNION SELECT 1, current_user, version(), now(), 99 --`
- Resultado: no hubo union de resultados; el payload se trato como texto literal.
- Por que fallo tecnicamente:
  - El SQL fijo solo admite un parametro para `ILIKE` y el input nunca se interpreta como clausula SQL.
  - La validacion de rol y contexto reduce abuso de endpoints sensibles.
- Linea que bloqueo el intento:
  - `api/src/infrastructure/adapters/PostgresVacunacionRepository.ts:51`
  - `api/src/interfaces/http/controllers/vacunacionController.ts:71` (validacion de `q`)

## Demostracion RLS
Misma consulta para dos veterinarios distintos:
1. Selecciona rol `rol_veterinario` con `x-vet-id=1` y ejecuta `GET /api/mascotas/buscar?q=`.
2. Cambia solo `x-vet-id=2` y repite la misma consulta.
3. El conjunto de mascotas cambia porque PostgreSQL evalua las politicas RLS con `app.current_vet_id` por transaccion.

Lineas clave de implementacion:
- `api/src/infrastructure/adapters/PostgresVacunacionRepository.ts:110` (set_config de `app.current_vet_id`)
- `api/src/infrastructure/adapters/PostgresVacunacionRepository.ts:114` (set de rol seguro)
- `bd/7-rls.sql` (politicas sobre `mascotas`, `citas` y `vacunas_aplicadas`)

## Demostracion Redis
Flujo esperado con `GET /api/vacunas/pendientes`:
1. Primera carga: CACHE MISS.
   - No existe llave en Redis, se consulta PostgreSQL y se guarda en cache.
2. Segunda carga inmediata: CACHE HIT.
   - La respuesta sale de Redis con menor latencia.
3. POST de vacuna: invalidacion.
   - Al ejecutar `POST /api/vacunas/aplicar`, se borra la llave del owner (vet o rol), forzando MISS en la siguiente lectura.

Lineas clave de implementacion:
- `api/src/application/use-cases/GetVacunacionPendienteUseCase.ts:19` (lectura cache)
- `api/src/application/use-cases/GetVacunacionPendienteUseCase.ts:24` (fallback a BD)
- `api/src/application/use-cases/GetVacunacionPendienteUseCase.ts:25` (set TTL)
- `api/src/application/use-cases/AplicarVacunaUseCase.ts:17` (invalidacion cache)
- `api/src/interfaces/http/controllers/vacunacionController.ts:39-42` (logs HIT/MISS)
- `api/src/interfaces/http/controllers/vacunacionController.ts:118` (log invalidacion)
