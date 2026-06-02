-- 001_init.sql
-- Damacana Sipariş Takip Sistemi - Veritabanı Şeması

-- Kullanıcı profilleri (auth.users ile bağlantılı)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('secretary', 'distributor')),
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Damacana markaları
CREATE TABLE IF NOT EXISTS public.brands (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- Siparişler
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  customer_phone TEXT,
  brand_id INTEGER REFERENCES public.brands(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'on_the_way', 'delivered', 'cancelled')),
  created_by UUID REFERENCES public.profiles(id),
  assigned_to UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_assigned_to ON public.orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_to_status ON public.orders(assigned_to, status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Sipariş durum logları
CREATE TABLE IF NOT EXISTS public.order_status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status TEXT CHECK (from_status IN ('pending', 'accepted', 'on_the_way', 'delivered', 'cancelled')),
  to_status TEXT NOT NULL CHECK (to_status IN ('pending', 'accepted', 'on_the_way', 'delivered', 'cancelled')),
  changed_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id ON public.order_status_logs(order_id);

ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları

-- Profiller: herkes kendi profilini görebilir, sekreterler herkesi görebilir
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Secretaries can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'secretary'
    )
  );

-- Markalar: herkes görebilir
CREATE POLICY "Everyone can view brands"
  ON public.brands FOR SELECT
  USING (true);

-- Siparişler: sekreterler tüm siparişleri görebilir, dağıtımcılar kendine atananları görebilir
CREATE POLICY "Secretaries can view all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'secretary'
    )
  );

CREATE POLICY "Distributors can view own orders"
  ON public.orders FOR SELECT
  USING (assigned_to = auth.uid());

CREATE POLICY "Secretaries can insert orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'secretary'
    )
  );

CREATE POLICY "Distributors can update own orders status"
  ON public.orders FOR UPDATE
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Status log politikaları
CREATE POLICY "Users can view status logs for their orders"
  ON public.order_status_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_id
      AND (orders.assigned_to = auth.uid() OR orders.created_by = auth.uid())
    )
  );

CREATE POLICY "Distributors can insert status logs"
  ON public.order_status_logs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('secretary', 'distributor')
    )
  );

-- Realtime ayarları
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Varsayılan markaları ekle
INSERT INTO public.brands (name) VALUES
  ('Nazlı'),
  ('Kaltun')
ON CONFLICT (name) DO NOTHING;
