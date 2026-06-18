import { sendCommand } from "@metanodejs/system-core";
import { AbiItem } from "../types";

// json to input array
function processTupleValue(value: any, components: any[] | undefined, depth: number): any {
  if (depth === 0) {
    return components ? buildAbiData(components, value) : value;
  }

  if (!Array.isArray(value)) {
    return value;
  }

  return value.map((item: any) => processTupleValue(item, components, depth - 1));
}

function buildAbiData(inputs: any[], data: Record<string, any>): any[] {
  return inputs.map((input) => {
    const value = data[input.name];

    if (input.type.startsWith("tuple")) {
      const arrayDepth = (input.type.match(/\[\]/g) || []).length;

      return {
        ...input,
        value: processTupleValue(value, input.components, arrayDepth),
      };
    } else {
      let processedValue = value;
      if (input.internalType === "bool" && typeof value === "boolean") {
        processedValue = value.toString();
      }

      return {
        ...input,
        value: processedValue,
      };
    }
  });
}

export function jsonToInputArray(abi: AbiItem, data: any = {}) {
  return buildAbiData(abi?.inputs ?? [], data);
}

// get abi signature
function canonicalType(param: any): string {
  if (!param.type.startsWith("tuple")) {
    return param.type;
  }

  const suffix = param.type.slice("tuple".length);

  return `(${param.components?.map(canonicalType).join(",")})${suffix}`;
}

function getAbiSignature(name = "", input: unknown[] = []) {
  return `${name}(${input.map(canonicalType).join(",") ?? ""})`;
}

export async function hashAbi(input: AbiItem[]) {
  const signs = input.map((item) => getAbiSignature(item.name, item.inputs));
  const { hashes } = await sendCommand("createHashes", {
    messages: signs,
  });
  return hashes;
}

// others
export function stripHexPrefix(address?: string) {
  return (address ?? "").replace(/^0x/i, "").toLowerCase();
}
