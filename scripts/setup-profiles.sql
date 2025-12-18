-- ============================================
-- SCRIPT: Configuración de Perfiles
-- ============================================
-- Este script configura la tabla profiles y sus políticas RLS

-- 1. Habilitar RLS en profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 3. Crear política para que TODOS puedan VER TODOS los perfiles
-- (necesario para que los usuarios vean información de propietarios de listas compartidas)
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- 4. Permitir que usuarios actualicen su propio perfil
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. Permitir que usuarios inserten su propio perfil
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. Verificar las políticas creadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'profiles';

