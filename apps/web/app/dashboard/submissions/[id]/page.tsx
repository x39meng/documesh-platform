import { getSubmission, getFileUrl } from "@/actions/ingest";
import { SubmissionDetail } from "@/components/dashboard/submission-detail";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SubmissionDetailPage(props: PageProps) {
  const params = await props.params;
  const submission = await getSubmission(params.id);

  if (!submission) {
    redirect("/dashboard/submissions");
  }

  let pdfUrl = null;
  if (submission.fileKey) {
    try {
      pdfUrl = await getFileUrl(submission.fileKey);
    } catch (e) {
      console.error("Failed to get PDF URL", e);
    }
  }

  return <SubmissionDetail detail={submission} pdfUrl={pdfUrl} />;
}
