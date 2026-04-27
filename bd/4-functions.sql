CREATE OR REPLACE FUNCTION fn_total_facturado(
    p_mascota_id INT,
    p_anio INT
)
RETURNS NUMERIC(12, 2)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_citas NUMERIC(12, 2);
    v_total_vacunas NUMERIC(12, 2);
BEGIN
    IF p_anio IS NULL OR p_anio < 1900 OR p_anio > 3000 THEN
        RAISE EXCEPTION 'El anio % no es valido', p_anio;
    END IF;

    SELECT COALESCE(SUM(costo), 0)
    INTO v_total_citas
    FROM citas
    WHERE mascota_id = p_mascota_id
      AND estado = 'COMPLETADA'
      AND EXTRACT(YEAR FROM fecha_hora) = p_anio;

    SELECT COALESCE(SUM(costo_cobrado), 0)
    INTO v_total_vacunas
    FROM vacunas_aplicadas
    WHERE mascota_id = p_mascota_id
      AND EXTRACT(YEAR FROM fecha_aplicacion) = p_anio;

    RETURN v_total_citas + v_total_vacunas;
END;
$$;
