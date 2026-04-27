-- Funcion opcional para escenarios donde se requiera SQL dinamico seguro.
-- Ejemplo: setear rol desde backend sin concatenacion insegura.
CREATE OR REPLACE FUNCTION fn_set_local_role_safe(p_role_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_role_name NOT IN ('rol_admin', 'rol_recepcion', 'rol_veterinario') THEN
        RAISE EXCEPTION 'Rol no permitido: %', p_role_name;
    END IF;

    EXECUTE format('SET LOCAL ROLE %I', p_role_name);
END;
$$;
