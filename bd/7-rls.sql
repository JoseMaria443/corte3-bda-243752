ALTER TABLE mascotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacunas_aplicadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_mascotas_admin_recepcion ON mascotas;
DROP POLICY IF EXISTS p_mascotas_veterinario ON mascotas;
DROP POLICY IF EXISTS p_vacunas_admin ON vacunas_aplicadas;
DROP POLICY IF EXISTS p_vacunas_recepcion ON vacunas_aplicadas;
DROP POLICY IF EXISTS p_vacunas_veterinario ON vacunas_aplicadas;
DROP POLICY IF EXISTS p_citas_admin_recepcion ON citas;
DROP POLICY IF EXISTS p_citas_veterinario ON citas;

-- Admin y recepcion ven todo en tablas operativas.
CREATE POLICY p_mascotas_admin_recepcion
ON mascotas
FOR ALL
TO rol_admin, rol_recepcion
USING (true)
WITH CHECK (true);

CREATE POLICY p_citas_admin_recepcion
ON citas
FOR ALL
TO rol_admin, rol_recepcion
USING (true)
WITH CHECK (true);

CREATE POLICY p_vacunas_admin
ON vacunas_aplicadas
FOR ALL
TO rol_admin
USING (true)
WITH CHECK (true);

-- Recepción ve todas las vacunas aplicadas para que la vista funcione
CREATE POLICY p_vacunas_recepcion
ON vacunas_aplicadas
FOR SELECT
TO rol_recepcion
USING (true);

-- CRITICO: veterinario solo ve/modifica filas de mascotas que atiende
CREATE POLICY p_mascotas_veterinario
ON mascotas
FOR SELECT
TO rol_veterinario
USING (
    EXISTS (
        SELECT 1
        FROM vet_atiende_mascota vam
        WHERE vam.mascota_id = mascotas.id
          AND vam.vet_id = NULLIF(current_setting('app.current_vet_id', true), '')::INT
          AND vam.activa = TRUE
    )
);

CREATE POLICY p_vacunas_veterinario
ON vacunas_aplicadas
FOR ALL
TO rol_veterinario
USING (
    EXISTS (
        SELECT 1
        FROM vet_atiende_mascota vam
        WHERE vam.mascota_id = vacunas_aplicadas.mascota_id
          AND vam.vet_id = NULLIF(current_setting('app.current_vet_id', true), '')::INT
          AND vam.activa = TRUE
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM vet_atiende_mascota vam
        WHERE vam.mascota_id = vacunas_aplicadas.mascota_id
          AND vam.vet_id = NULLIF(current_setting('app.current_vet_id', true), '')::INT
          AND vam.activa = TRUE
    )
);

CREATE POLICY p_citas_veterinario
ON citas
FOR ALL
TO rol_veterinario
USING (
    EXISTS (
        SELECT 1
        FROM vet_atiende_mascota vam
        WHERE vam.mascota_id = citas.mascota_id
          AND vam.vet_id = NULLIF(current_setting('app.current_vet_id', true), '')::INT
          AND vam.activa = TRUE
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM vet_atiende_mascota vam
        WHERE vam.mascota_id = citas.mascota_id
          AND vam.vet_id = NULLIF(current_setting('app.current_vet_id', true), '')::INT
          AND vam.activa = TRUE
    )
);
