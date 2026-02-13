-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('LOCKED', 'STARTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'ACADEMY_TRACK_COMPLETE';

-- AlterEnum
ALTER TYPE "LogModule" ADD VALUE 'ACADEMY';

-- CreateTable
CREATE TABLE "AcademyTrack" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyModule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videoUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "ModuleStatus" NOT NULL DEFAULT 'DRAFT',
    "requiredModuleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyQuiz" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "passingScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyQuiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyQuestion" (
    "id" TEXT NOT NULL,
    "quizId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionType" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE',
    "options" JSONB NOT NULL,
    "correctOptionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyEnrollment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AcademyEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyModuleProgress" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'LOCKED',
    "videoWatched" BOOLEAN NOT NULL DEFAULT false,
    "quizScore" INTEGER,
    "quizPassed" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyModuleProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademyHuddleComment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademyHuddleComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AcademyTrack_tenantId_isPublished_idx" ON "AcademyTrack"("tenantId", "isPublished");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyTrack_tenantId_title_key" ON "AcademyTrack"("tenantId", "title");

-- CreateIndex
CREATE INDEX "AcademyModule_tenantId_trackId_idx" ON "AcademyModule"("tenantId", "trackId");

-- CreateIndex
CREATE INDEX "AcademyModule_requiredModuleId_idx" ON "AcademyModule"("requiredModuleId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyModule_trackId_order_key" ON "AcademyModule"("trackId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyQuiz_moduleId_key" ON "AcademyQuiz"("moduleId");

-- CreateIndex
CREATE INDEX "AcademyQuestion_quizId_idx" ON "AcademyQuestion"("quizId");

-- CreateIndex
CREATE INDEX "AcademyEnrollment_tenantId_userId_idx" ON "AcademyEnrollment"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "AcademyEnrollment_tenantId_trackId_idx" ON "AcademyEnrollment"("tenantId", "trackId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyEnrollment_userId_trackId_key" ON "AcademyEnrollment"("userId", "trackId");

-- CreateIndex
CREATE INDEX "AcademyModuleProgress_tenantId_userId_idx" ON "AcademyModuleProgress"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "AcademyModuleProgress_tenantId_moduleId_status_idx" ON "AcademyModuleProgress"("tenantId", "moduleId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AcademyModuleProgress_userId_moduleId_key" ON "AcademyModuleProgress"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "AcademyHuddleComment_tenantId_moduleId_createdAt_idx" ON "AcademyHuddleComment"("tenantId", "moduleId", "createdAt");

-- AddForeignKey
ALTER TABLE "AcademyTrack" ADD CONSTRAINT "AcademyTrack_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyModule" ADD CONSTRAINT "AcademyModule_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "AcademyTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyModule" ADD CONSTRAINT "AcademyModule_requiredModuleId_fkey" FOREIGN KEY ("requiredModuleId") REFERENCES "AcademyModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyQuiz" ADD CONSTRAINT "AcademyQuiz_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AcademyModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyQuestion" ADD CONSTRAINT "AcademyQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "AcademyQuiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyEnrollment" ADD CONSTRAINT "AcademyEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyEnrollment" ADD CONSTRAINT "AcademyEnrollment_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "AcademyTrack"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyModuleProgress" ADD CONSTRAINT "AcademyModuleProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyModuleProgress" ADD CONSTRAINT "AcademyModuleProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AcademyModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyHuddleComment" ADD CONSTRAINT "AcademyHuddleComment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "AcademyModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademyHuddleComment" ADD CONSTRAINT "AcademyHuddleComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
