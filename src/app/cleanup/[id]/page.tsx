import { WorkflowHeader } from "@/components/layout/workflow-header";
import { PageContainer } from "@/components/layout/page-container";
import { ImageFrame } from "@/components/ui/image-frame";
import { PrimaryButton } from "@/components/ui/primary-button";

/**
 * Cleanup route foundation.
 * Phase 0 only: structure and navigation. Real cleanup logic lands in a
 * later phase.
 */
export default async function CleanupPage({
  params,
}: PageProps<"/cleanup/[id]">) {
  const { id } = await params;

  return (
    <>
      <WorkflowHeader currentStep="cleanup" />
      <main className="flex-1">
        <PageContainer className="py-8">
          <h1 className="font-display mt-6 text-2xl font-semibold text-graphite">
            Cleanup
          </h1>
          <p className="font-mono text-xs text-text-secondary">
            image id: {id}
          </p>
          <div className="mt-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
            <ImageFrame>
              <span className="font-mono text-xs text-text-secondary">
                Before
              </span>
            </ImageFrame>
            <ImageFrame>
              <span className="font-mono text-xs text-text-secondary">
                After
              </span>
            </ImageFrame>
          </div>
          <PrimaryButton className="mt-6" disabled>
            Clean image
          </PrimaryButton>
        </PageContainer>
      </main>
    </>
  );
}
