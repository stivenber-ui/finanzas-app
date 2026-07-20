-- Bienes patrimoniales (activos físicos no financieros: bicicleta, cama, electrodomésticos, etc.)
CREATE TABLE IF NOT EXISTS assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users ON DELETE CASCADE,
  name            text NOT NULL,
  category        text NOT NULL CHECK (category IN ('mueble', 'electrodomestico', 'tecnologia', 'vehiculo', 'ropa_accesorios', 'otro')),
  purchase_date   date,
  purchase_value  numeric,
  current_value   numeric NOT NULL CHECK (current_value >= 0),
  notes           text,
  archived_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assets_user_id_idx ON assets(user_id);

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_owner_select" ON assets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "assets_owner_insert" ON assets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "assets_owner_update" ON assets FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "assets_owner_delete" ON assets FOR DELETE USING (user_id = auth.uid());

CREATE TRIGGER assets_set_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
