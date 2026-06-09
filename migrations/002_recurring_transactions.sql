-- Transacciones recurrentes (gastos/ingresos que se repiten periódicamente)
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type           text NOT NULL CHECK (type IN ('gasto', 'ingreso', 'transferencia')),
  amount         numeric NOT NULL CHECK (amount > 0),
  account_id     uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id  uuid REFERENCES accounts(id) ON DELETE SET NULL,
  category_id    uuid REFERENCES categories(id) ON DELETE SET NULL,
  goal_id        uuid REFERENCES goals(id) ON DELETE SET NULL,
  description    text,
  frequency      text NOT NULL CHECK (frequency IN ('semanal', 'mensual', 'bimestral', 'trimestral', 'semestral', 'anual')),
  day_of_month   integer CHECK (day_of_month BETWEEN 1 AND 28),
  next_date      date NOT NULL,
  end_date       date,
  active         boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- RLS: el usuario solo ve sus propias recurrentes (heredado de accounts)
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own recurring transactions"
  ON recurring_transactions
  FOR ALL
  USING (
    account_id IN (SELECT id FROM accounts)
  );
