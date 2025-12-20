import { Suspense } from "react";
import { getQueueMetrics } from "../../actions/queue";
import { QueueDashboard } from "./queue-dashboard";

export const dynamic = "force-dynamic";

export default async function QueuesPage() {
  const data = await getQueueMetrics();

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Queue Processing</h1>
        <p className="text-muted-foreground">
          Monitor and manage document processing jobs.
        </p>
      </div>

      <Suspense fallback={<div>Loading queue metrics...</div>}>
        <QueueDashboard initialData={data} />
      </Suspense>
    </div>
  );
}
