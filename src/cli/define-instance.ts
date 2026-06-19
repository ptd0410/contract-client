import { writePrettyFile } from "./utils";

export function defineInstance(outDir: string) {
  const content = `import { contractClient } from "@mtnts/contract-client";
  import { abis } from "./abis";
  import type { ContractMethods, ContractEvents } from "./contract-types";
  
  export const methods = contractClient.methods as ContractMethods;
  
  export function registerAbi(){
  return contractClient.registerAbiJson(abis);
  }
  
  export function onEvent<K extends keyof ContractEvents>(
    name: K,
    cb: (e: ContractEvents[K]) => void,
  ) {
    return contractClient.onEvent(name, cb);
  }
  
  export function offEvent<K extends keyof ContractEvents>(
    name: K,
    cb: (e: ContractEvents[K]) => void,
  ) {
    return contractClient.offEvent(name, cb);
  }
  
type FilterFunction<K extends keyof ContractEvents> = (
    payload: ContractEvents[K],
  ) => boolean | Promise<boolean>;
  
  type WaitEventOptions<K extends keyof ContractEvents> = {
    filter?: FilterFunction<K>;
    timeout?: number;
  };
  
  export function waitEvent<K extends keyof ContractEvents>(
    name: K,
    options?: WaitEventOptions<K> | FilterFunction<K>,
  ) {
    return new Promise<ContractEvents[K]>((resolve, reject) => {
      const filter = typeof options === "function" ? options : options?.filter;
      const timeout = typeof options === "function" ? 5000 : (options?.timeout ?? 5000);
  
      const cb = async (e: ContractEvents[K]) => {
        try {
          if (filter && !(await filter(e))) return;
  
          cleanup();
          resolve(e);
        } catch (err) {
          cleanup();
          reject(err);
        }
      };
  
      const cleanup = () => {
        clearTimeout(timeoutId);
        offEvent(name, cb);
      };
  
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(\`Wait event \${name} timeout\`));
      }, timeout);
  
      onEvent(name, cb);
    });
  }
  `;
  writePrettyFile(`contract.ts`, content, outDir);
}
