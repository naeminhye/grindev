import vm from "vm";
import type { Language } from "./languages";

export type ExecutionResult = {
  stdout: string;
  stderr: string;
  status: string;
};

export async function runCode(
  language: Language,
  code: string,
): Promise<ExecutionResult> {
  if (language === "JAVASCRIPT" || language === "TYPESCRIPT") {
    return runInVm(code);
  }
  // Python, C++, Java — requires external executor
  // Wire up Glot.io or similar when ready
  return {
    stdout: "",
    stderr: `${language} execution not yet configured. Please use JavaScript or TypeScript.`,
    status: "Not Supported",
  };
}

function runInVm(code: string): ExecutionResult {
  let stdout = "";
  let stderr = "";

  try {
    const sandbox = vm.createContext({
      console: {
        log: (...args: any[]) => {
          stdout += args.map(String).join(" ") + "\n";
        },
        error: (...args: any[]) => {
          stderr += args.map(String).join(" ") + "\n";
        },
        warn: (...args: any[]) => {
          stderr += args.map(String).join(" ") + "\n";
        },
      },
      JSON,
      Math,
      Array,
      Object,
      String,
      Number,
      Boolean,
      Map,
      Set,
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      Infinity,
      NaN,
      undefined,
    });

    vm.runInContext(code, sandbox, { timeout: 5000 });

    return { stdout: stdout.trim(), stderr: stderr.trim(), status: "Accepted" };
  } catch (e: any) {
    return {
      stdout: stdout.trim(),
      stderr: e?.message ?? String(e),
      status: "Error",
    };
  }
}
