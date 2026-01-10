-- CreateTable
CREATE TABLE "api_costs" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "cost" DECIMAL(10,6) NOT NULL,
    "request_data" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_costs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "api_costs_service_idx" ON "api_costs"("service");

-- CreateIndex
CREATE INDEX "api_costs_timestamp_idx" ON "api_costs"("timestamp");
