-- Dar permiso a roles para acceder a vistas
GRANT SELECT ON v_mascotas_vacunacion_pendiente TO rol_veterinario, rol_recepcion, rol_admin, api_backend;
