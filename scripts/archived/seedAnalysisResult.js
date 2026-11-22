import prisma from "../lib/prismaClient.js";

async function seed() {
  try {
    const result = await prisma.analysisResult.create({
      data: {
        userId: "7e5dc12f-4c87-4e2f-a4cd-66c412e77f1a", // استخدم UUID الذي أعطيتني
        imageUrl: "/uploads/test.jpg",
        prediction: "Pneumonia",
        confidence: 0.85,
        explanation: "Mock analysis",
        heatmapUrl: "/mock/heatmaps/sample.png",
        modelVersion: "mock-v1",
        inferenceTimeMs: 600,
      },
    });
    console.log("Inserted:", result);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
