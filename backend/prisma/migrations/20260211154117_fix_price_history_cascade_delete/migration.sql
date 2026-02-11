-- DropForeignKey
ALTER TABLE "price_history" DROP CONSTRAINT "price_history_product_id_fkey";

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
