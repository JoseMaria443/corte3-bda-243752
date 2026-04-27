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

-- Buenas practicas base para todos los roles de aplicacion.
REVOKE ALL ON SCHEMA public FROM rol_veterinario, rol_recepcion, rol_admin;
GRANT USAGE ON SCHEMA public TO rol_veterinario, rol_recepcion, rol_admin;

-- Reset de privilegios para aplicar minimo privilegio de forma explicita.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM rol_veterinario, rol_recepcion, rol_admin;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM rol_veterinario, rol_recepcion, rol_admin;

-- Recepcion: solo citas y lectura de mascotas/duenos.
GRANT SELECT, INSERT ON citas TO rol_recepcion;
GRANT SELECT ON mascotas, duenos TO rol_recepcion;
REVOKE ALL ON vacunas_aplicadas, inventario_vacunas FROM rol_recepcion;

-- Veterinario: lectura de historial medico y vacunas.
GRANT SELECT ON historial_movimientos, vacunas_aplicadas, inventario_vacunas TO rol_veterinario;

-- Requerido para operar consultas bajo RLS en las tablas protegidas.
GRANT SELECT ON mascotas, citas, vet_atiende_mascota TO rol_veterinario;

-- Admin: control total.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO rol_admin;
