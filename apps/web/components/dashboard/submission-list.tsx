"use client";

import { useState } from "react";
import Link from "next/link";
import { type PublicSubmission } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { Button } from "@repo/ui/components/button";
import { UploadDialog } from "@/components/upload-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  Search,
  Plus,
  Filter,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@repo/ui/utils";

interface SubmissionListProps {
  initialSubmissions: PublicSubmission[];
}

export function SubmissionList({ initialSubmissions }: SubmissionListProps) {
  const router = useRouter();
  const [submissions] = useState(initialSubmissions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = submissions.filter((s) => {
    const matchesSearch = s.documentType
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-success" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Submissions</h1>
        <UploadDialog
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          }
          onSuccess={() => {
            router.refresh(); // Reload data
          }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-background border rounded-lg pl-9 pr-4 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                statusFilter !== "all" &&
                  "border-primary text-primary bg-primary/5"
              )}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <DropdownMenuRadioItem value="all">
                All Submissions
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="completed">
                Completed
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="processing">
                Processing
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="failed">
                Failed
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card overflow-hidden flex-1 flex flex-col">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((sub) => {
                  // Extract Data Helpers
                  const data = sub.finalData as any;
                  const candidateName =
                    data?.personalInfo?.name || "Unknown Candidate";
                  const candidateEmail = data?.personalInfo?.email || "";

                  // Parse Filename (Remove UUID prefix)
                  const fileName =
                    sub.fileKey.split("/").pop()?.slice(37) || sub.fileKey;

                  return (
                    <TableRow
                      key={sub.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() =>
                        router.push(`/dashboard/submissions/${sub.id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            {candidateName.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {candidateName}
                            </span>
                            {candidateEmail && (
                              <span className="text-xs text-muted-foreground">
                                {candidateEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-sm max-w-[200px] truncate"
                        title={fileName}
                      >
                        {fileName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(sub.status)}
                          <span className="capitalize text-sm">
                            {sub.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Link href={`/dashboard/submissions/${sub.id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
