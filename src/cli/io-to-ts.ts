const structs = new Map<string, string>();

function solidityPrimitiveToTs(type: string): string {
  if (["string", "address"].includes(type) || type.startsWith("byte")) return "string";
  if (type.startsWith("uint")) return "number";
  if (type === "bool") return "boolean";
  throw new Error(`[abiTypeToTsType] Not handle type: ${type}`);
}

function normalizeStructName(internalType?: string) {
  if (!internalType) {
    return "UnknownStruct";
  }

  const rawName = internalType.split(" ")[1] ?? "UnknownStruct";

  return `BC${rawName.replace("[]", "").replaceAll(".", "")}`;
}

function buildTsObjectType(ios: any[], ioType: string): string {
  if (!ios?.length) {
    return ioType === "in" ? "null" : "void";
  }

  if (ios.length === 1 && ios[0].name === "" && ioType === "out") {
    return abiTypeToTsType(ios[0], ioType);
  }

  const fields = ios
    .map((item) => `${item.name || '""'}: ${abiTypeToTsType(item, ioType)}`)
    .join("; ");

  return `{ ${fields} }`;
}

function getOrCreateStructType(item: any, ioType: string): string {
  const structName = normalizeStructName(item.internalType);

  if (!structs.has(structName)) {
    const body = buildTsObjectType(item.components ?? [], ioType);

    structs.set(structName, `type ${structName} = ${body}`);
  }

  return structName;
}

function abiTypeToTsType(item: any, ioType: string): string {
  const isArray = item.type.endsWith("[]");

  if (item.type.includes("tuple")) {
    const structName = getOrCreateStructType(item, ioType);

    return isArray ? `${structName}[]` : structName;
  }

  const baseType = isArray ? item.type.slice(0, -2) : item.type;

  const tsType = solidityPrimitiveToTs(baseType);

  return isArray ? `${tsType}[]` : tsType;
}

export function abiToTs(ios: any[], ioType: string) {
  return buildTsObjectType(ios, ioType);
}

export function getStructString() {
  return [...structs.values()].join("\n");
}
