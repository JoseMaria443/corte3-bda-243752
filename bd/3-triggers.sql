CREATE OR REPLACE FUNCTION fn_trg_historial_cita()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_mascota_nombre VARCHAR(50);
    v_vet_nombre VARCHAR(100);
BEGIN
    SELECT nombre INTO v_mascota_nombre
    FROM mascotas
    WHERE id = NEW.mascota_id;

    SELECT nombre INTO v_vet_nombre
    FROM veterinarios
    WHERE id = NEW.veterinario_id;

    INSERT INTO historial_movimientos (tipo, referencia_id, descripcion)
    VALUES (
        'CITA_AGENDADA',
        NEW.id,
        format(
            'Cita agendada para %s con %s el %s',
            COALESCE(v_mascota_nombre, 'Mascota desconocida'),
            COALESCE(v_vet_nombre, 'Veterinario desconocido'),
            to_char(NEW.fecha_hora, 'DD/MM/YYYY HH24:MI')
        )
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_historial_cita ON citas;

CREATE TRIGGER trg_historial_cita
AFTER INSERT ON citas
FOR EACH ROW
EXECUTE FUNCTION fn_trg_historial_cita();
