-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('business', 'design', 'education', 'marketing', 'engineering', 'sales');

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TemplateCategory" NOT NULL,
    "coverImageUrl" TEXT,
    "coverGradient" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "isMostPopular" BOOLEAN NOT NULL DEFAULT false,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "boardBackgroundType" TEXT NOT NULL DEFAULT 'color',
    "boardBackgroundValue" TEXT NOT NULL DEFAULT '#0079BF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateList" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateCard" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "position" DOUBLE PRECISION NOT NULL,
    "coverType" TEXT,
    "coverValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateLabel" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateCardLabel" (
    "cardId" TEXT NOT NULL,
    "labelId" TEXT NOT NULL,

    CONSTRAINT "TemplateCardLabel_pkey" PRIMARY KEY ("cardId","labelId")
);

-- CreateTable
CREATE TABLE "TemplateChecklist" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateChecklistItem" (
    "id" TEXT NOT NULL,
    "checklistId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "position" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Template_category_idx" ON "Template"("category");

-- CreateIndex
CREATE INDEX "Template_isFeatured_idx" ON "Template"("isFeatured");

-- CreateIndex
CREATE INDEX "TemplateList_templateId_position_idx" ON "TemplateList"("templateId", "position");

-- CreateIndex
CREATE INDEX "TemplateCard_listId_position_idx" ON "TemplateCard"("listId", "position");

-- CreateIndex
CREATE INDEX "TemplateLabel_templateId_idx" ON "TemplateLabel"("templateId");

-- CreateIndex
CREATE INDEX "TemplateCardLabel_labelId_idx" ON "TemplateCardLabel"("labelId");

-- CreateIndex
CREATE INDEX "TemplateChecklist_cardId_position_idx" ON "TemplateChecklist"("cardId", "position");

-- CreateIndex
CREATE INDEX "TemplateChecklistItem_checklistId_position_idx" ON "TemplateChecklistItem"("checklistId", "position");

-- AddForeignKey
ALTER TABLE "TemplateList" ADD CONSTRAINT "TemplateList_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateCard" ADD CONSTRAINT "TemplateCard_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TemplateList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateLabel" ADD CONSTRAINT "TemplateLabel_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateCardLabel" ADD CONSTRAINT "TemplateCardLabel_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "TemplateCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateCardLabel" ADD CONSTRAINT "TemplateCardLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "TemplateLabel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateChecklist" ADD CONSTRAINT "TemplateChecklist_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "TemplateCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateChecklistItem" ADD CONSTRAINT "TemplateChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "TemplateChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
