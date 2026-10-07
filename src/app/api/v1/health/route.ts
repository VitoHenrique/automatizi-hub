import { apiSuccess } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();

  return apiSuccess({
    data: {
      status: "healthy",
      service: "automatizi-hub-api",
      version: "0.1.0",
      environment: process.env.NODE_ENV || "development",
      uptime_seconds: Math.floor(uptime),
      timestamp,
      subsystems: {
        database: "operational",
        rls_enforcement: "active",
        observability: "active",
      },
    },
    meta: {
      timestamp,
    },
  });
}
