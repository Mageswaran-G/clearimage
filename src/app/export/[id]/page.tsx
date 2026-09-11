import { WorkflowHeader } from "@/components/layout/workflow-header";
import { ExportView } from "@/components/export/export-view";

export default async function ExportPage({
  params,
}: PageProps<"/export/[id]">) {
  const { id } = await params;

  return (
    <>
      <WorkflowHeader currentStep="export" />
      <main className="flex flex-1 flex-col">
        <ExportView id={id} />
      </main>
    </>
  );
}
