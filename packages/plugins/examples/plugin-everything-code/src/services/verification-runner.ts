import type { PluginContext } from "@paperclipai/plugin-sdk";
import { STREAM_CHANNELS } from "../constants.js";

export interface VerifyStep {
  name: string;
  status: "pending" | "running" | "passed" | "failed";
  message?: string;
}

export interface VerifyResult {
  passed: boolean;
  steps: VerifyStep[];
  iterations: number;
}

const DEFAULT_STEPS: ReadonlyArray<string> = [
  "lint",
  "typecheck",
  "unit-tests",
  "integration-tests",
  "security-scan",
];

export class VerificationRunner {
  constructor(private readonly ctx: PluginContext) {}

  async run(opts: {
    companyId: string;
    objective: string;
    maxIterations?: number;
    runStep?: (step: string) => Promise<{ passed: boolean; message?: string }>;
  }): Promise<VerifyResult> {
    const steps: VerifyStep[] = DEFAULT_STEPS.map((name) => ({ name, status: "pending" }));
    const maxIterations = Math.max(1, opts.maxIterations ?? 1);
    this.ctx.streams.open(STREAM_CHANNELS.verifyLog, opts.companyId);
    this.ctx.streams.emit(STREAM_CHANNELS.verifyLog, {
      type: "start",
      objective: opts.objective,
      steps: steps.map((s) => s.name),
    });

    let iter = 0;
    let allPassed = false;
    while (iter < maxIterations) {
      iter++;
      let failedThisIter = false;
      for (const step of steps) {
        step.status = "running";
        this.ctx.streams.emit(STREAM_CHANNELS.verifyLog, {
          type: "step-start",
          iteration: iter,
          name: step.name,
        });
        const result = opts.runStep
          ? await opts.runStep(step.name)
          : { passed: true, message: "stub: no-op runner" };
        step.status = result.passed ? "passed" : "failed";
        step.message = result.message;
        if (!result.passed) failedThisIter = true;
        this.ctx.streams.emit(STREAM_CHANNELS.verifyLog, {
          type: "step-end",
          iteration: iter,
          name: step.name,
          passed: result.passed,
          message: result.message,
        });
      }
      if (!failedThisIter) {
        allPassed = true;
        break;
      }
    }

    this.ctx.streams.emit(STREAM_CHANNELS.verifyLog, {
      type: "done",
      iterations: iter,
      passed: allPassed,
    });
    this.ctx.streams.close(STREAM_CHANNELS.verifyLog);
    return { passed: allPassed, steps, iterations: iter };
  }
}
