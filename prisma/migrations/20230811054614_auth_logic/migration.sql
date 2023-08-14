-- CreateEnum
CREATE TYPE "OAUTH_PROVIDER" AS ENUM ('GOOGLE', 'MICROSOFT');

-- CreateTable
CREATE TABLE "User" (
    "user_uuid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_uuid")
);

-- CreateTable
CREATE TABLE "BasicAccount" (
    "basic_account_uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "BasicAccount_pkey" PRIMARY KEY ("basic_account_uuid")
);

-- CreateTable
CREATE TABLE "OauthAccount" (
    "oauth_account_uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "provider" "OAUTH_PROVIDER" NOT NULL,
    "access_token" TEXT NOT NULL,

    CONSTRAINT "OauthAccount_pkey" PRIMARY KEY ("oauth_account_uuid")
);

-- CreateTable
CREATE TABLE "Individual" (
    "individual_uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,

    CONSTRAINT "Individual_pkey" PRIMARY KEY ("individual_uuid")
);

-- CreateTable
CREATE TABLE "Company" (
    "company_uuid" TEXT NOT NULL,
    "user_uuid" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("company_uuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "BasicAccount_user_uuid_key" ON "BasicAccount"("user_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "OauthAccount_user_uuid_key" ON "OauthAccount"("user_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "OauthAccount_access_token_key" ON "OauthAccount"("access_token");

-- CreateIndex
CREATE UNIQUE INDEX "Individual_user_uuid_key" ON "Individual"("user_uuid");

-- CreateIndex
CREATE UNIQUE INDEX "Company_user_uuid_key" ON "Company"("user_uuid");

-- AddForeignKey
ALTER TABLE "BasicAccount" ADD CONSTRAINT "BasicAccount_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "User"("user_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OauthAccount" ADD CONSTRAINT "OauthAccount_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "User"("user_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Individual" ADD CONSTRAINT "Individual_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "User"("user_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_user_uuid_fkey" FOREIGN KEY ("user_uuid") REFERENCES "User"("user_uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
