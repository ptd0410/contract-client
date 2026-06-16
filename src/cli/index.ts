import { globby } from "globby";
import fs from "node:fs";
import path from "node:path";
import { abiToTs, getStructString } from "./io-to-ts";
import {
  ask,
  contractsTemplate,
  createEventsName,
  createMethodsName,
  normalizePath,
  writePrettyFile,
} from "./utils";
import { AbiItem } from "src/types";

type Abis = [string, AbiItem[]][];

function createGlobalDeclaration(content: string[] | string) {
  const finalContent = Array.isArray(content) ? content.join("\n") : content;
  return ` export {}
               declare global {
               ${finalContent}
               }`;
}

function defineMethods(abiName: string, items: AbiItem[]) {
  const content = items
    .map((item) => {
      const inputs = abiToTs(item.inputs, "in");
      const outputs = abiToTs(item.outputs!, "out");
      return `\n${item.name}: [${inputs},${outputs}]`;
    })
    .join("");
  return createGlobalDeclaration(`type ${createMethodsName(abiName)} = {${content}}`);
}

function defineEvents(abiName: string, items: AbiItem[]) {
  const content = items
    .map((item) => {
      return `\n${item.name}: ${abiToTs(item.inputs!, "out")}`;
    })
    .join("");
  return createGlobalDeclaration(`type ${createEventsName(abiName)} = {${content}}`);
}

function defineAllContracts(abis: Abis) {
  const content = abis.map(([name]) => {
    return `\n${name}: ${createMethodsName(name)}`;
  });
  const allMehodsString = `type ContractMethods = RegistryHandlers<{${content}}, ContractOptions>`;
  return createGlobalDeclaration(contractsTemplate + allMehodsString);
}

export async function generateBlockchainTypes() {
  const rootPath = process.cwd();
  const _input = await ask("type relative path: ");
  const input = _input ? _input + "/" : "";
  const outDir = path.resolve(rootPath, `src/${input}@bc-types`);

  const filePaths = await globby(`src/${input}abis/*.abi.json`, {
    cwd: rootPath,
    absolute: true,
  });

  const abis = filePaths.map((filePath: string) => [
    normalizePath(filePath),
    JSON.parse(fs.readFileSync(filePath, "utf-8")),
  ]) as Abis;

  abis.forEach(async ([name, abiArray]) => {
    const dir = path.resolve(outDir, name);
    const methods = abiArray.filter((i) => i.type === "function");
    const events = abiArray.filter((i) => i.type === "event");

    writePrettyFile(`${name}.methods.d.ts`, defineMethods(name, methods), dir);
    writePrettyFile(`${name}.events.d.ts`, defineEvents(name, events), dir);
  });

  const structsString = createGlobalDeclaration(getStructString());
  writePrettyFile(`structs.d.ts`, structsString, outDir);
  writePrettyFile(`contracts.d.ts`, defineAllContracts(abis), outDir);
}
