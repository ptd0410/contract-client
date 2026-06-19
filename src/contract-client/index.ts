import {
  AbiItem,
  RegisterContractInput,
  RequestFunction,
  RequestOptions,
  RequestPayload,
} from "../types";

export class ContractClient {
  constructor() {}

  readonly methods: Record<string, Record<string, Function>> = {};
  private froms: Record<string, string> = {};
  private tos: Record<string, string> = {};

  //ịnjection
  request: RequestFunction = () => {
    throw new Error("request not set in contract client");
  };

  registerEventItems?: (item: AbiItem[]) => void;

  // handle abi
  async registerAbiJson(input: RegisterContractInput) {
    const array = (Array.isArray(input) ? [["", input]] : Object.entries(input)) as [
      string,
      AbiItem[],
    ][];

    const eventItems: AbiItem[] = [];

    array.forEach(([key, abiArray]) => {
      if (!!this.methods[key]) throw new Error(`[registerAbiJson] key has used: ${key}`);
      const functionItems = abiArray.filter((abi) => abi.type === "function");
      functionItems.forEach((abi) => this.registerMethod(abi, key));
      abiArray.forEach((item) => item.type === "event" && eventItems.push(item));
    });

    this.registerEventItems?.(eventItems);
  }

  setFrom(input: string | Record<string, string>) {
    if (typeof input === "string") {
      Object.keys(this.methods).forEach((key) => {
        this.froms[key] = input;
      });
    } else {
      Object.assign(this.froms, input);
    }
  }

  setTos(tos: Record<string, string>) {
    const toArray = Object.values(tos);
    Object.assign(this.tos, tos);
  }

  // handle method
  private detectFeeType(abi: AbiItem) {
    switch (abi.stateMutability) {
      case "view":
        return "read";
      case "nonpayable":
        return "sc";
      default:
        throw new Error(`Unsupported ABI type: ${abi.type}`);
    }
  }

  private registerMethod(abi: AbiItem, abiName: string) {
    if (!abi.name) return;
    this.methods[abiName] ??= {};
    this.methods[abiName][abi.name] = async (data: any = {}, options: RequestOptions = {}) => {
      const payload: RequestPayload = {
        from: this.froms[abiName],
        to: this.tos[abiName],
        ...options,
        abi,
        feeType: this.detectFeeType(abi),
        data,
      };
      const rs = await this.request(payload);
      return rs?.[""] ?? rs;
    };
  }
}
