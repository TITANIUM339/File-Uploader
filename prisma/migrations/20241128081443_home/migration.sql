/*
  Warnings:

  - A unique constraint covering the columns `[homeId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `homeId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "homeId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Home" (
    "id" SERIAL NOT NULL,
    "folder" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "Home_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_homeId_key" ON "User"("homeId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
