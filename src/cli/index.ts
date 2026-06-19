import { globby } from "globby";
import fs from "node:fs";
import path from "node:path";
import { AbiItem } from "src/types";
import { defineInstance } from "./define-instance";
import { abiToTs, getStructString } from "./io-to-ts";
import {
  ask,
  contractsTemplate,
  createEventsName,
  createMethodsName,
  normalizePath,
  writePrettyFile,
} from "./utils";

type Abis = [string, AbiItem[]][];

// khai bao type cho methods
function defineMethods(abiName: string, items: AbiItem[]) {
  const content = items
    .map((item) => {
      const inputs = abiToTs(item.inputs, "in");
      const outputs = abiToTs(item.outputs!, "out");
      return `\n${item.name}: [${inputs},${outputs}]`;
    })
    .join("");
  return `import type * as Structs from "../structs";
  export type ${createMethodsName(abiName)} = {${content}}`;
}

// khai bao type cho events
function defineEvents(abiName: string, items: AbiItem[]) {
  const content = items
    .map((item) => {
      return `\n${item.name}: ${abiToTs(item.inputs!, "out")}`;
    })
    .join("");
  return `export type ${createEventsName(abiName)} = {${content}}`;
}

// khai bao file contract tong
function defineContractType(abis: Abis, outDir: string) {
  const imports = abis
    .map(([name]) => {
      return [
        `import type { ${createMethodsName(name)} } from "./${name}/${name}.methods";`,
        `import type { ${createEventsName(name)} } from "./${name}/${name}.events";`,
      ].join("\n");
    })
    .join("\n");

  const methodContent = abis.map(([name]) => `${name}: ${createMethodsName(name)}`).join(";\n");

  const methodsString = `export type ContractMethods = RegistryHandlers<
  {
    ${methodContent}
},
  ContractOptions
>;
`;

  const eventContent = abis.map(([name]) => createEventsName(name));

  const eventString = `export type ContractEvents = ${eventContent.join("&")}`;

  const content = [imports, contractsTemplate, methodsString, eventString].join("\n\n");
  writePrettyFile(`contracts.d.ts`, content, outDir);
}

// khai bao file index
function defineReExport(outDir: string) {
  const content = `export * from './structs'
  export * from './contracts'`;
  writePrettyFile(`index.ts`, content, outDir);
}

// khai bao structs
function defineStruct(outDir: string) {
  return writePrettyFile(`structs.d.ts`, getStructString(), outDir);
}

//khai bao cho moi abi
function defineAbiItem(item: [string, AbiItem[]], outDir: string) {
  const [name, abiArray] = item;
  const dir = path.resolve(outDir, name);
  const methods = abiArray.filter((i) => i.type === "function");
  const events = abiArray.filter((i) => i.type === "event");

  writePrettyFile(`${name}.methods.d.ts`, defineMethods(name, methods), dir);
  writePrettyFile(`${name}.events.d.ts`, defineEvents(name, events), dir);
}

// khai bao index cho abis
function defineAbisIndex(outDir: string, paths: string[]) {
  const content = paths
    .map((p) => `import ${normalizePath(p)} from './${path.basename(p)}'`)
    .join("\n");

  const reExport = `export const abis = {${paths.map((p) => normalizePath(p)).join(",")}}`;
  writePrettyFile(`index.ts`, content + "\n" + reExport, outDir);
}

export async function main() {
  const rootPath = process.cwd();
  const _input = await ask("type relative path: ");
  const input = _input ? _input + "/" : "";
  const outDir = path.resolve(rootPath, `src/${input}contract-types`);

  const filePaths = await globby(`src/${input}abis/*.abi.json`, {
    cwd: rootPath,
    absolute: true,
  });

  const abis = filePaths.map((filePath: string) => [
    normalizePath(filePath),
    JSON.parse(fs.readFileSync(filePath, "utf-8")),
  ]) as Abis;

  abis.forEach(async (item) => defineAbiItem(item, outDir));

  defineStruct(outDir);
  defineContractType(abis, outDir);
  defineReExport(outDir);
  defineAbisIndex(`src/${input}abis`, filePaths);
  defineInstance(path.resolve(rootPath, `src/${input}`));
}

main();
