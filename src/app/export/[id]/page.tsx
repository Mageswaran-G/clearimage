import { WorkflowHeader } from "@/components/layout/workflow-header";
import { PageContainer } from "@/components/layout/page-container";
import { SecondaryButton } from "@/components/ui/secondary-button";

/**
 * Export / Download route foundation.
 * Phase 0 only: structure and navigation. Real export logic lands in a
 * later phase.
 */
export default async function ExportPage({
  params,
}: PageProps<"/export/[id]">) {
  const { id } = await params;

  return (
    <>
      <WorkflowHeader currentStep="export" />
      <main className="flex-1">
        <PageContainer className="py-8">
          <h1 className="font-display mt-6 text-2xl font-semibold text-graphite">
            Export
          </h1>
          <p className="font-mono text-xs text-text-secondary">
            image id: {id}
          </p>
          <SecondaryButton className="mt-6" disabled>
            Download
          </SecondaryButton>
        </PageContainer>
      </main>
    </>
  );
}
