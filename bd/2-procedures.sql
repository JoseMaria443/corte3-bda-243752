CREATE OR REPLACE PROCEDURE sp_agendar_cita(
    p_mascota_id INT,
    p_veterinario_id INT,
    p_fecha_hora TIMESTAMP,
    p_motivo TEXT,
    OUT p_cita_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_vet_activo BOOLEAN;
    v_vet_descanso VARCHAR(50);
    v_dia_semana_cita TEXT;
BEGIN
    -- Bloque transaccional interno: si algo falla, se revierte todo el bloque.
    BEGIN
        IF p_fecha_hora IS NULL THEN
            RAISE EXCEPTION 'La fecha y hora de la cita es obligatoria';
        END IF;

        SELECT EXISTS (
            SELECT 1
            FROM mascotas
            WHERE id = p_mascota_id
        )
        INTO STRICT v_vet_activo;

        IF NOT v_vet_activo THEN
            RAISE EXCEPTION 'La mascota con ID % no existe', p_mascota_id;
        END IF;

        SELECT activo, dias_descanso
        INTO v_vet_activo, v_vet_descanso
        FROM veterinarios
        WHERE id = p_veterinario_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'El veterinario con ID % no existe', p_veterinario_id;
        END IF;

        IF COALESCE(v_vet_activo, FALSE) = FALSE THEN
            RAISE EXCEPTION 'El veterinario con ID % no esta activo', p_veterinario_id;
        END IF;

        v_dia_semana_cita := trim(lower(to_char(p_fecha_hora, 'TMDay')));

        IF COALESCE(v_vet_descanso, '') <> ''
           AND v_dia_semana_cita = ANY(string_to_array(replace(lower(v_vet_descanso), ' ', ''), ',')) THEN
            RAISE EXCEPTION 'El veterinario con ID % descansa el dia %', p_veterinario_id, v_dia_semana_cita;
        END IF;

        IF EXISTS (
            SELECT 1
            FROM citas
            WHERE veterinario_id = p_veterinario_id
              AND fecha_hora = p_fecha_hora
              AND estado <> 'CANCELADA'
        ) THEN
            RAISE EXCEPTION 'Ya existe una cita para el veterinario % en %', p_veterinario_id, p_fecha_hora;
        END IF;

        INSERT INTO citas (mascota_id, veterinario_id, fecha_hora, motivo, estado)
        VALUES (p_mascota_id, p_veterinario_id, p_fecha_hora, p_motivo, 'AGENDADA')
        RETURNING id INTO p_cita_id;

    EXCEPTION
        WHEN OTHERS THEN
            RAISE;
    END;
END;
$$;
