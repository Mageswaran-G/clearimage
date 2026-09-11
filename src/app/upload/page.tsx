import { WorkflowHeader } from "@/components/layout/workflow-header";
import { UploadFlow } from "@/components/upload/upload-flow";

export default function UploadPage() {
  return (
    <>
      <WorkflowHeader currentStep="upload" />
      <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center px-[18px] py-10 md:px-8 md:py-16">
        <h1 className="mb-2 text-center font-display text-[26px] font-extrabold tracking-tight text-graphite md:text-[clamp(26px,3.6vw,32px)]">
          Upload an image
        </h1>
        <p className="mb-8 text-center text-[15px] text-text-secondary md:mb-10">
          Format, metadata, and visible marks will be inspected.
        </p>
        <UploadFlow />
      </main>
    </>
  );
}
