-- 1. Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updated_by" UUID,

    CONSTRAINT system_settings_pkey PRIMARY KEY ("key")
);

-- 2. Create attendance table
CREATE TABLE IF NOT EXISTS public.attendance (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "member_id" UUID NOT NULL,
    "family_id" UUID,
    "service" VARCHAR(50) NOT NULL,
    "attendance_date" DATE NOT NULL,
    "status" VARCHAR(20) DEFAULT 'PRESENT' NOT NULL,
    "submitted_via" VARCHAR(20) DEFAULT 'QR_PUBLIC' NOT NULL,
    "batch_id" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "created_by" UUID,

    CONSTRAINT attendance_pkey PRIMARY KEY ("id"),
    CONSTRAINT fk_attendance_member FOREIGN KEY ("member_id") REFERENCES public.members ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
    CONSTRAINT fk_attendance_family FOREIGN KEY ("family_id") REFERENCES public.family ("id") ON DELETE SET NULL ON UPDATE NO ACTION,
    CONSTRAINT unique_member_attendance_per_service UNIQUE ("member_id", "attendance_date", "service")
);

-- 3. Indexes for attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance ("attendance_date");
CREATE INDEX IF NOT EXISTS idx_attendance_family ON public.attendance ("family_id");

-- 4. Seed SERVICE category and initial portal setting
INSERT INTO public.system_settings ("key", "value", "description")
VALUES ('attendance_portal_mode', 'AUTOMATIC', 'Attendance portal mode: AUTOMATIC (Sundays 7am-12am IST), FORCE_OPEN, or FORCE_CLOSED')
ON CONFLICT ("key") DO NOTHING;

DO $$
DECLARE
  cat_id BIGINT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.categories WHERE code = 'SERVICE') THEN
    INSERT INTO public.categories (code, name, description) 
    VALUES ('SERVICE', 'Church Services', 'Sunday and weekday worship services')
    RETURNING id INTO cat_id;

    INSERT INTO public.category_values (category_id, code, label, sort_order) VALUES
    (cat_id, 'SERVICE_1', '1st Service (07:00 AM - 09:00 AM)', 1),
    (cat_id, 'SERVICE_2', '2nd Service (09:00 AM - 11:00 AM)', 2),
    (cat_id, 'SERVICE_3', '3rd Service (11:00 AM - 01:00 PM)', 3);
  END IF;
END $$;

