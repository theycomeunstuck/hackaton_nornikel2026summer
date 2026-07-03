import { useEffect, useMemo, useState } from "react";
import type {
  UploadProcessingStep,
  UploadProcessingStepStatus,
} from "../../shared/mock/upload.mock";
import { uploadProcessingSteps } from "../../shared/mock/upload.mock";
import { StatusBadge } from "../../shared/ui/StatusBadge";

type ProcessingPipelineProps = {
  canStart: boolean;
  onComplete: () => void;
  onReset?: () => void;
};

type StepState = UploadProcessingStep & {
  status: UploadProcessingStepStatus;
};

function createInitialSteps(): StepState[] {
  return uploadProcessingSteps.map((step) => ({
    ...step,
    status: "pending",
  }));
}

function getStatusTone(status: UploadProcessingStepStatus) {
  if (status === "done") {
    return "success";
  }

  if (status === "running") {
    return "info";
  }

  if (status === "failed") {
    return "danger";
  }

  return "neutral";
}

export function ProcessingPipeline({ canStart, onComplete, onReset }: ProcessingPipelineProps) {
  const [steps, setSteps] = useState<StepState[]>(createInitialSteps);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);

  const doneCount = useMemo(
    () => steps.filter((step) => step.status === "done").length,
    [steps],
  );
  const progress = Math.round((doneCount / steps.length) * 100);

  useEffect(() => {
    if (!isProcessing || activeStepIndex === null) {
      return undefined;
    }

    if (activeStepIndex >= steps.length) {
      setIsProcessing(false);
      setActiveStepIndex(null);
      onComplete();
      return undefined;
    }

    setSteps((currentSteps) =>
      currentSteps.map((step, index) => ({
        ...step,
        status: index < activeStepIndex ? "done" : index === activeStepIndex ? "running" : "pending",
      })),
    );

    const timeoutId = window.setTimeout(() => {
      setSteps((currentSteps) =>
        currentSteps.map((step, index) => ({
          ...step,
          status: index <= activeStepIndex ? "done" : step.status,
        })),
      );
      setActiveStepIndex((currentIndex) => (currentIndex === null ? null : currentIndex + 1));
    }, 520);

    return () => window.clearTimeout(timeoutId);
  }, [activeStepIndex, isProcessing, onComplete, steps.length]);

  const handleStart = () => {
    setSteps(createInitialSteps());
    setIsProcessing(true);
    setActiveStepIndex(0);
    onReset?.();
  };

  return (
    <div className="rounded border border-white/75 bg-white/72 p-5 shadow-glass backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ice-600">
            Processing pipeline
          </p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">
            От документа к evidence index
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Pipeline показывает, как файл превращается в chunks, claims, entities,
            source references и graph relations.
          </p>
        </div>
        <button
          type="button"
          disabled={!canStart || isProcessing}
          onClick={handleStart}
          className="rounded bg-ice-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-ice-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        >
          {isProcessing ? "Обработка..." : "Запустить обработку"}
        </button>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">Progress</span>
          <span className="text-slate-500">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded bg-slate-100">
          <div className="h-full rounded bg-ice-500 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`grid grid-cols-[42px_minmax(0,1fr)_110px] items-center gap-4 rounded border p-3 ${
              step.status === "running"
                ? "border-ice-200 bg-ice-50"
                : step.status === "done"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded bg-graphite-900 text-xs font-semibold text-white">
              {index + 1}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-950">{step.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{step.description}</p>
            </div>
            <div className="flex justify-end">
              <StatusBadge label={step.status} tone={getStatusTone(step.status)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
