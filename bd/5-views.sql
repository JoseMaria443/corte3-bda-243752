CREATE OR REPLACE VIEW v_mascotas_vacunacion_pendiente
WITH (security_invoker = true)
AS
WITH ultima_vacuna AS (
    SELECT
        mascota_id,
        MAX(fecha_aplicacion) AS fecha_ultima_vacuna
    FROM vacunas_aplicadas
    GROUP BY mascota_id
)
SELECT
    m.id AS mascota_id,
    m.nombre AS nombre_mascota,
    m.especie,
    d.id AS dueno_id,
    d.nombre AS nombre_dueno,
    d.telefono AS telefono_dueno,
    uv.fecha_ultima_vacuna,
    CASE
        WHEN uv.fecha_ultima_vacuna IS NULL THEN NULL
        ELSE CURRENT_DATE - uv.fecha_ultima_vacuna
    END AS dias_desde_ultima_vacuna,
    CASE
        WHEN uv.fecha_ultima_vacuna IS NULL THEN 'NUNCA_VACUNADA'
        WHEN (CURRENT_DATE - uv.fecha_ultima_vacuna) > 365 THEN 'VENCIDA'
        ELSE 'AL_DIA'
    END AS estado_vacunacion
FROM mascotas m
INNER JOIN duenos d ON d.id = m.dueno_id
LEFT JOIN ultima_vacuna uv ON uv.mascota_id = m.id
WHERE uv.fecha_ultima_vacuna IS NULL
   OR (CURRENT_DATE - uv.fecha_ultima_vacuna) > 365;
