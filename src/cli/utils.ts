import path from "node:path";
import fs from "node:fs";
import prettier from "prettier";
import readline from "readline";

export function ask(label: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(label, (answer) => {
      rl.close();

      const rs = answer.trim();

      resolve(rs);
    });
  });
}

export function capitalize(input: string) {
  return input.charAt(0).toUpperCase() + input.slice(1);
}

export function createMethodsName(name: string) {
  return `${capitalize(name)}Mehods`;
}

export function createEventsName(name: string) {
  return `${capitalize(name)}Events`;
}

export function normalizePath(input: string) {
  return path.basename(input, ".abi.json").split(/[-.]/g).join("");
}

export async function writePrettyFile(fileName: string, content: string, outDir: string) {
  fs.mkdirSync(outDir, {
    recursive: true,
  });
  const outFile = path.join(outDir, fileName);
  const config = await prettier.resolveConfig(outFile);
  const formatted = await prettier.format(content, {
    ...config,
    filepath: outFile,
  });
  fs.writeFileSync(outFile, formatted, "utf-8");
}

export const contractsTemplate = ` type HandlerDefinition<Input = unknown, Output = unknown> = [Input, Output];

 type RegistrySchema = Record<string, Record<string, HandlerDefinition<unknown, unknown>>>;

 type RegistryHandlers<TSchema extends RegistrySchema, TOptions = unknown> = {
  [TGroup in keyof TSchema]: {
    [TKey in keyof TSchema[TGroup]]: (
      input: TSchema[TGroup][TKey][0],
      options?: TOptions,
    ) => Promise<TSchema[TGroup][TKey][1]>;
  };
};
type ContractOptions = {
    from?: string
    to?: string
    gas?: string | number
  }
`;
