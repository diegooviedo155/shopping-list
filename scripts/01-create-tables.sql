-- Updated table structure to match Prisma schema with camelCase mapping
CREATE TABLE IF NOT EXISTS shopping_items (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('supermercado', 'verduleria', 'carniceria')),
  status TEXT NOT NULL CHECK (status IN ('este-mes', 'proximo-mes')),
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_shopping_items_status ON shopping_items(status);
CREATE INDEX IF NOT EXISTS idx_shopping_items_category ON shopping_items(category);
CREATE INDEX IF NOT EXISTS idx_shopping_items_order ON shopping_items(status, order_index);

-- Enable Row Level Security
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can restrict this later with user authentication)
CREATE POLICY "Allow all operations on shopping_items" ON shopping_items
  FOR ALL USING (true);

-- Added sample data for testing
INSERT INTO shopping_items (name, category, status, completed, order_index) VALUES
  ('Leche', 'supermercado', 'este-mes', false, 0),
  ('Pan', 'supermercado', 'este-mes', false, 1),
  ('Tomates', 'verduleria', 'este-mes', false, 0),
  ('Lechuga', 'verduleria', 'este-mes', true, 1),
  ('Carne molida', 'carniceria', 'este-mes', false, 0),
  ('Arroz', 'supermercado', 'proximo-mes', false, 0),
  ('Zanahorias', 'verduleria', 'proximo-mes', false, 0)
ON CONFLICT (id) DO NOTHING;
