-- Agrega presupuesto mensual por categoría
ALTER TABLE categories ADD COLUMN IF NOT EXISTS monthly_budget numeric DEFAULT NULL;
