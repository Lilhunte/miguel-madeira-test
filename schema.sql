-- Supabase Schema for Car&Moto Solutions
-- This schema defines the structure for the 'vehicles' table, based on the data provided.
-- It includes the main table, a function and trigger for automatic timestamp updates, and column comments for clarity.

CREATE TABLE public.vehicles (
    id text PRIMARY KEY,
    title text NOT NULL,
    make text NOT NULL,
    model text NOT NULL,
    variant text,
    year integer,
    price_eur numeric(10, 2),
    mileage_km integer,
    engine_cc integer,
    power_cv integer,
    transmission text,
    fuel_type text,
    vin text,
    location text,
    status text NOT NULL DEFAULT 'available',
    description text,
    media jsonb,
    source_post_url text,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments to the columns for clarity
COMMENT ON TABLE public.vehicles IS 'Stores the inventory of cars and motorcycles for sale.';
COMMENT ON COLUMN public.vehicles.id IS 'Unique identifier for the vehicle (e.g., veh-001-bmw-m1000rr)';
COMMENT ON COLUMN public.vehicles.price_eur IS 'Price in Euros';
COMMENT ON COLUMN public.vehicles.mileage_km IS 'Mileage in kilometers';
COMMENT ON COLUMN public.vehicles.engine_cc IS 'Engine displacement in cubic centimeters';
COMMENT ON COLUMN public.vehicles.power_cv IS 'Engine power in horsepower (CV)';
COMMENT ON COLUMN public.vehicles.media IS 'JSON array of media objects, e.g., [{"type": "image", "url": "..."}]';

-- Supabase recommends a trigger to automatically update the 'updated_at' timestamp.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_vehicles_updated
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

--
-- ROW LEVEL SECURITY POLICIES
--
-- 1. Enable RLS on the table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for public read access
CREATE POLICY "Public vehicles are viewable by everyone."
ON public.vehicles FOR SELECT
USING (true);

-- 3. Create policies for authenticated users (admins) to manage data
CREATE POLICY "Admins can insert vehicles."
ON public.vehicles FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update vehicles."
ON public.vehicles FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete vehicles."
ON public.vehicles FOR DELETE
USING (auth.role() = 'authenticated');
