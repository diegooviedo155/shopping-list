-- CreateEnum
CREATE TYPE "public"."category" AS ENUM ('supermercado', 'verduleria', 'carniceria');

-- CreateEnum
CREATE TYPE "public"."item_status" AS ENUM ('este-mes', 'proximo-mes');

-- CreateTable
CREATE TABLE "public"."shopping_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "public"."category" NOT NULL,
    "status" "public"."item_status" NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_items_pkey" PRIMARY KEY ("id")
);
