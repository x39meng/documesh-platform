"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Button } from "@repo/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { ScrollArea } from "@repo/ui/components/scroll-area";
import { retryJob, cleanQueue } from "../../actions/queue";
import { toast } from "sonner";
import { RefreshCw, Trash2, PlayCircle } from "lucide-react";

type Job = {
  id: string;
  name: string;
  data: Record<string, unknown>;
  progress: number;
  failedReason?: string;
  timestamp: number;
  finishedOn?: number;
};

type QueueData = {
  counts: {
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    waiting: number;
  };
  jobs: {
    failed: Job[];
    completed: Job[];
    active: Job[];
    delayed: Job[];
    waiting: Job[];
  };
};

export function QueueDashboard({ initialData }: { initialData: QueueData }) {
  const [activeTab, _setActiveTab] =
    useState<keyof QueueData["jobs"]>("failed");
  const [isRetrying, setIsRetrying] = useState(false);

  const setActiveTab = (tab: keyof QueueData["jobs"]) => {
    _setActiveTab(tab);
  };

  const handleRetry = async (jobId: string) => {
    setIsRetrying(true);
    try {
      const res = await retryJob(jobId);
      if (res.success) {
        toast.success("Job retried successfully");
      } else {
        toast.error("Failed to retry job");
      }
    } catch {
      toast.error("Error retrying job");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleClean = async (status: "completed" | "failed") => {
    if (!confirm(`Are you sure you want to clear all ${status} jobs?`)) return;
    try {
      await cleanQueue(status);
      toast.success(`Cleared ${status} jobs`);
    } catch {
      toast.error("Failed to clear jobs");
    }
  };

  const currentJobs = initialData.jobs[activeTab] || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {(
          Object.keys(initialData.counts) as Array<
            keyof typeof initialData.counts
          >
        ).map((status) => (
          <Card
            key={status}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${
              activeTab === status ? "border-primary" : ""
            }`}
            onClick={() => setActiveTab(status as keyof QueueData["jobs"])}
          >
            <CardHeader className="pb-2">
              <CardDescription className="capitalize">{status}</CardDescription>
              <CardTitle className="text-2xl">
                {initialData.counts[status]}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="capitalize">{activeTab} Jobs</CardTitle>
            <CardDescription>Viewing {currentJobs.length} jobs</CardDescription>
          </div>
          <div className="flex gap-2">
            {(activeTab === "completed" || activeTab === "failed") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClean(activeTab)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>File Key</TableHead>
                  <TableHead>Time</TableHead>
                  {activeTab === "failed" && <TableHead>Error</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentJobs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No jobs found in this state.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">
                        {job.id}
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {(job.data.fileKey as string) || "Unknown File"}
                      </TableCell>
                      <TableCell>
                        {new Date(job.timestamp).toLocaleString()}
                      </TableCell>
                      {activeTab === "failed" && (
                        <TableCell className="text-destructive max-w-[300px] truncate">
                          {job.failedReason}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        {activeTab === "failed" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isRetrying}
                            onClick={() => handleRetry(job.id)}
                          >
                            <PlayCircle className="w-4 h-4 mr-1" />
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
