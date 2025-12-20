import { getSubmissions } from "@/actions/ingest";
import { SubmissionList } from "@/components/dashboard/submission-list";

// Force dynamic because we fetch user-specific data
export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const submissions = await getSubmissions();

  return <SubmissionList initialSubmissions={submissions} />;
}
