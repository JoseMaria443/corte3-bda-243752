DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_veterinario') THEN
        CREATE ROLE rol_veterinario;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_recepcion') THEN
        CREATE ROLE rol_recepcion;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rol_admin') THEN
        CREATE ROLE rol_admin;
    END IF;
END $$;

-- Permitir que api_backend cambie de rol
GRANT rol_veterinario, rol_recepcion, rol_admin TO api_backend;

REVOKE ALL ON SCHEMA public FROM rol_veterinario, rol_recepcion, rol_admin;
GRANT USAGE ON SCHEMA public TO rol_veterinario, rol_recepcion, rol_admin;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM rol_veterinario, rol_recepcion, rol_admin;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM rol_veterinario, rol_recepcion, rol_admin;

-- Permisos para vistas
GRANT SELECT ON v_mascotas_vacunacion_pendiente TO rol_veterinario, rol_admin;

-- Permisos rol_recepcion
GRANT SELECT, INSERT, UPDATE ON citas TO rol_recepcion;
GRANT SELECT, INSERT, UPDATE ON mascotas, duenos TO rol_recepcion;
GRANT SELECT ON vacunas_aplicadas TO rol_recepcion;
GRANT USAGE ON SEQUENCE citas_id_seq, mascotas_id_seq, duenos_id_seq TO rol_recepcion;

-- Permisos rol_veterinario
GRANT SELECT ON historial_movimientos, inventario_vacunas, vacunas_aplicadas TO rol_veterinario;
GRANT INSERT, UPDATE ON vacunas_aplicadas TO rol_veterinario;
GRANT SELECT ON mascotas, duenos, vet_atiende_mascota TO rol_veterinario;
GRANT SELECT, INSERT, UPDATE ON citas TO rol_veterinario;
GRANT USAGE ON SEQUENCE vacunas_aplicadas_id_seq, citas_id_seq TO rol_veterinario;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO rol_admin;
