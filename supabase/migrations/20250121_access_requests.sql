-- ============================================
-- MIGRACIÓN: Listas Compartidas y Solicitudes de Acceso
-- ============================================
-- Esta migración crea las tablas necesarias para la funcionalidad de listas compartidas

-- Crear tabla para solicitudes de acceso a listas compartidas
CREATE TABLE IF NOT EXISTS list_access_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  list_name TEXT NOT NULL DEFAULT 'Mi Lista Personal',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE
);

-- Crear tabla para listas compartidas aprobadas
CREATE TABLE IF NOT EXISTS shared_list_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  list_name TEXT NOT NULL DEFAULT 'Mi Lista Personal',
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_owner_id, member_id)
);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_list_access_requests_owner ON list_access_requests(list_owner_id);
CREATE INDEX IF NOT EXISTS idx_list_access_requests_requester ON list_access_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_list_access_requests_status ON list_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_shared_list_access_owner ON shared_list_access(list_owner_id);
CREATE INDEX IF NOT EXISTS idx_shared_list_access_member ON shared_list_access(member_id);

-- Habilitar RLS
ALTER TABLE list_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_list_access ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para list_access_requests
DROP POLICY IF EXISTS "Users can view their own access requests" ON list_access_requests;
CREATE POLICY "Users can view their own access requests" ON list_access_requests
  FOR SELECT USING (auth.uid() = list_owner_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can create access requests" ON list_access_requests;
CREATE POLICY "Users can create access requests" ON list_access_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "List owners can update their requests" ON list_access_requests;
CREATE POLICY "List owners can update their requests" ON list_access_requests
  FOR UPDATE USING (auth.uid() = list_owner_id);

DROP POLICY IF EXISTS "List owners can delete their requests" ON list_access_requests;
CREATE POLICY "List owners can delete their requests" ON list_access_requests
  FOR DELETE USING (auth.uid() = list_owner_id);

-- Políticas RLS para shared_list_access
DROP POLICY IF EXISTS "Users can view their shared list access" ON shared_list_access;
CREATE POLICY "Users can view their shared list access" ON shared_list_access
  FOR SELECT USING (auth.uid() = list_owner_id OR auth.uid() = member_id);

DROP POLICY IF EXISTS "List owners can manage shared access" ON shared_list_access;
CREATE POLICY "List owners can manage shared access" ON shared_list_access
  FOR ALL USING (auth.uid() = list_owner_id);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_list_access_requests_updated_at ON list_access_requests;
CREATE TRIGGER update_list_access_requests_updated_at
  BEFORE UPDATE ON list_access_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para crear acceso compartido cuando se aprueba una solicitud
CREATE OR REPLACE FUNCTION approve_access_request()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo procesar si el status cambió a 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    -- Insertar en shared_list_access si no existe
    INSERT INTO shared_list_access (list_owner_id, member_id, list_name)
    VALUES (NEW.list_owner_id, NEW.requester_id, NEW.list_name)
    ON CONFLICT (list_owner_id, member_id) DO NOTHING;

    -- Actualizar approved_at
    NEW.approved_at = NOW();
  END IF;

  -- Si se rechaza, actualizar rejected_at
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    NEW.rejected_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para manejar aprobación automática
DROP TRIGGER IF EXISTS handle_access_request_approval ON list_access_requests;
CREATE TRIGGER handle_access_request_approval
  BEFORE UPDATE ON list_access_requests
  FOR EACH ROW EXECUTE FUNCTION approve_access_request();
