# Clinica Veterinaria - Corte 3 y 4

## Respuestas concisas (preguntas obligatorias)

### 1) Politica RLS aplicada en mascotas
Se aplico una politica para `rol_veterinario` que solo permite ver mascotas asignadas en `vet_atiende_mascota`, usando `app.current_vet_id` como contexto de sesion. Esto evita lectura transversal de pacientes entre veterinarios.

### 2) Vector de ataque del mecanismo de identidad RLS
El vector principal es la suplantacion de identidad por header (enviar un `x-vet-id` falso). Se mitiga validando rol/header en controlador, aplicando `SET LOCAL ROLE` seguro por whitelist y seteando `app.current_vet_id` dentro de transaccion, no de forma global.

### 3) SECURITY DEFINER
No se uso `SECURITY DEFINER` en procedures de negocio porque podria saltarse permisos del rol activo y ampliar superficie de escalada. Se prefirio control por rol + RLS + queries parametrizadas.

### 4) TTL de Redis y razon
TTL configurado: 600 segundos (10 minutos). Es un balance entre frescura y ahorro de carga para una vista de consulta frecuente; ademas la invalidacion por POST de vacuna reduce datos stale inmediatamente tras cambios criticos.

### 5) Endpoint critico y linea de proteccion
Endpoint critico: `GET /api/mascotas/buscar`. La linea `WHERE nombre ILIKE $1` con ejecucion parametrizada bloquea SQLi al tratar el input como dato y no como SQL ejecutable.

### 6) Si se revoca todo al veterinario excepto SELECT en mascotas
Se rompen al menos tres operaciones: consulta de vacunacion pendiente (sin permisos en vacunas/vista), aplicacion de vacunas (sin INSERT en `vacunas_aplicadas`) y evaluacion correcta de politicas si no puede leer tablas auxiliares requeridas por RLS.
