import { Logo } from "@/components/ui/logo";
import { workflowSteps, type WorkflowStepId } from "@/lib/workflow";

interface WorkflowHeaderProps {
  currentStep: WorkflowStepId;
}

/**
 * Dark header used on the Upload -> Inspect -> Clean -> Export screens.
 * Desktop shows the full 4-step strip; mobile shows a compact "NN/04" counter.
 * Distinct from LandingHeader, which only appears on the Landing page.
 */
export function WorkflowHeader({ currentStep }: WorkflowHeaderProps) {
  const currentIndex = workflowSteps.findIndex(
    (step) => step.id === currentStep,
  );
  const current = workflowSteps[currentIndex];
  const total = workflowSteps.length;

  return (
    <header className="border-b border-[#22232A] bg-graphite">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between px-[18px] py-3.5 md:px-8 md:py-[18px]">
        <Logo tone="light" />

        <nav
          aria-label="Workflow progress"
          className="hidden items-center gap-7 font-mono text-[11.5px] tracking-wide md:flex"
        >
          {workflowSteps.map((step, index) => (
            <span
              key={step.id}
              aria-current={index === currentIndex ? "step" : undefined}
              className={
                index === currentIndex
                  ? "border-b-[1.5px] border-teal pb-1 text-white"
                  : "text-[#4F5A5D]"
              }
            >
              {String(index + 1).padStart(2, "0")} {step.label.toUpperCase()}
            </span>
          ))}
        </nav>

        <span className="font-mono text-[11px] tracking-wide text-teal md:hidden">
          {String(currentIndex + 1).padStart(2, "0")}/
          {String(total).padStart(2, "0")} · {current.label.toUpperCase()}
        </span>
      </div>
    </header>
  );
}
