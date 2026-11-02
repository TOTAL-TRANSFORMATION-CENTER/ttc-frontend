-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE IF NOT EXISTS "family" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "status" TEXT,
    "location" VARCHAR,
    "region" TEXT,
    "address" VARCHAR,
    "inactive_reason" VARCHAR,
    "password" VARCHAR,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6),
    "created_by" UUID,

    CONSTRAINT "family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "members" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID,
    "name" VARCHAR NOT NULL,
    "is_head" BOOLEAN NOT NULL DEFAULT false,
    "age" INTEGER,
    "gender" TEXT,
    "blood_group" VARCHAR,
    "dob" DATE,
    "status" TEXT,
    "inactive_reason" VARCHAR,
    "marital_status" TEXT,
    "is_looking_for_alliance" BOOLEAN NOT NULL DEFAULT false,
    "dom" DATE,
    "occupation" VARCHAR,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "church_role" VARCHAR,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "last_modified" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "email" VARCHAR,
    "phone" VARCHAR,
    "created_by" UUID,
    "modified_by" UUID,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "admin" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "member_id" UUID NOT NULL,
    "password" VARCHAR NOT NULL,
    "role" VARCHAR(50) DEFAULT 'Admin',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_reset" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),
    "modified_by" UUID,
    "last_modified" TIMESTAMPTZ(6) NOT NULL DEFAULT timezone('utc'::text, now()),

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "admin_member_id_key" ON "admin"("member_id");

-- AddForeignKey (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_member_family'
    ) THEN
        ALTER TABLE "members" ADD CONSTRAINT "fk_member_family" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_member'
    ) THEN
        ALTER TABLE "admin" ADD CONSTRAINT "fk_admin_member" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;
