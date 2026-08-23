-- Replace legacy online-gateway values. Existing non-COD payment records become SAFEPAY
-- so the application schema remains consistent after the provider migration.
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('SAFEPAY', 'COD');
ALTER TABLE "Payment"
  ALTER COLUMN "method" TYPE "PaymentMethod"
  USING (CASE WHEN "method"::text = 'COD' THEN 'COD' ELSE 'SAFEPAY' END)::"PaymentMethod";
DROP TYPE "PaymentMethod_old";
