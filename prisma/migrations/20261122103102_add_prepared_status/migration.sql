-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'PREPARED';

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "provider" SET DEFAULT 'PAYME';
