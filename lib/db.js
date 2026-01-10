import prisma from "./prisma";

export async function upsertPrediction(predictionData) {
  if (predictionData?.status !== "succeeded") {
    return;
  }

  const prediction = {
    uuid: predictionData.id,
    input: predictionData.input,
    output: predictionData.output,
    status: predictionData.status,
    created_at: predictionData.created_at,
    started_at: predictionData.started_at,
    completed_at: predictionData.completed_at,
    version: predictionData.version,
    metrics: predictionData.metrics,
    error: predictionData.error,
  };

  try {
    await prisma.prediction.upsert({
      where: {
        uuid: prediction.uuid,
      },
      update: prediction,
      create: prediction,
    });

    } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

export async function getRecentPredictions() {
  const predictions = await prisma.prediction.findMany({
    orderBy: [
      {
        id: "asc",
      },
    ],
    select: {
      uuid: true,
      input: true,
      output: true,
    },
    take: 1000,
  });
  return predictions;
}
