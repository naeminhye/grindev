// const JUDGE0_URL = "https://judge0-ce.p.rapidapi.com";
// const HEADERS = {
//   "Content-Type": "application/json",
//   "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
//   "X-RapidAPI-Key": process.env.JUDGE0_API_KEY!,
// };

// // Judge0 language IDs
// const LANGUAGE_IDS: Record<string, number> = {
//   javascript: 93, // Node.js 18
//   typescript: 74,
//   python: 71, // Python 3
//   java: 62,
//   cpp: 54,
// };

// export type ExecutionResult = {
//   stdout: string;
//   stderr: string;
//   status: string;
// };

// export async function runCode(
//   language: string,
//   code: string,
//   stdin = "",
// ): Promise<ExecutionResult> {
//   const languageId = LANGUAGE_IDS[language] ?? LANGUAGE_IDS["javascript"];

//   // Submit
//   const submitRes = await fetch(
//     `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
//     {
//       method: "POST",
//       headers: HEADERS,
//       body: JSON.stringify({
//         language_id: languageId,
//         source_code: code,
//         stdin,
//         cpu_time_limit: 5,
//         memory_limit: 128000,
//       }),
//     },
//   );

//   const data = await submitRes.json();
//   console.log('RAW JUDGE0:', JSON.stringify(data))

//   return {
//     stdout: data.stdout ?? "",
//     stderr: data.stderr ?? data.compile_output ?? "",
//     status: data.status?.description ?? "Unknown",
//   };
// }

// export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_IDS);

import vm from "vm";

export type ExecutionResult = {
  stdout: string;
  stderr: string;
  status: string;
};

export async function runCode(
  language: string,
  code: string,
  _stdin = "",
): Promise<ExecutionResult> {
  let stdout = "";
  let stderr = "";

  try {
    const context = vm.createContext({
      console: {
        log: (...args: any[]) => {
          stdout += args.map(String).join(" ") + "\n";
        },
        error: (...args: any[]) => {
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
      undefined,
      null: null,
    });

    vm.runInContext(code, context, { timeout: 5000 });

    return { stdout: stdout.trim(), stderr: stderr.trim(), status: "Accepted" };
  } catch (e: any) {
    return {
      stdout: stdout.trim(),
      stderr: e?.message ?? String(e),
      status: "Error",
    };
  }
}

export const SUPPORTED_LANGUAGES = ["javascript"];
