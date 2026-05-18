-- CreateTable
CREATE TABLE "split_bill_items" (
    "id" TEXT NOT NULL,
    "splitBillId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "unitPrice" DECIMAL(15,2) NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "split_bill_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "split_bill_item_assignments" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,

    CONSTRAINT "split_bill_item_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "split_bill_items_splitBillId_idx" ON "split_bill_items"("splitBillId");

-- CreateIndex
CREATE UNIQUE INDEX "split_bill_item_assignments_itemId_participantId_key" ON "split_bill_item_assignments"("itemId", "participantId");

-- AddForeignKey
ALTER TABLE "split_bill_items" ADD CONSTRAINT "split_bill_items_splitBillId_fkey" FOREIGN KEY ("splitBillId") REFERENCES "split_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "split_bill_item_assignments" ADD CONSTRAINT "split_bill_item_assignments_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "split_bill_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "split_bill_item_assignments" ADD CONSTRAINT "split_bill_item_assignments_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "split_bill_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
