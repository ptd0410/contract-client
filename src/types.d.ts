export interface AbiIO {
  indexed?: boolean;
  internalType?: string;
  name?: string;
  type: string;
  components?: AbiIO[];
  [key: string]: any;
}

export interface AbiItem {
  inputs: AbiIO[];
  type: string;
  name?: string;
  outputs?: AbiIO[];
  stateMutability?: string;
  anonymous?: boolean;
  indexed?: boolean;
  internalType?: string;
  [key: string]: any;
}

export type RegisterContractInput = AbiItem[] | Record<string, AbiItem[]>;

export type BaseRequest = {
  abi: AbiItem;
  from: string;
  to: string;
};

export type RequestPayload = BaseRequest & {
  feeType: string;
  data?: any;
  amount?: string;
  gas?: number | string;
};

export type RequestOptions = {
  from?: string;
  to?: string;
  gas?: number | string;
  amount?: string;
};

export type RequestFunction = (payload: RequestPayload) => Promise<any>;

export type EventResponse = {
  address: string;
  topics: string[];
  data: string;
};

export type ContractClientContext = {
  hashAbi: (abiItem: AbiItem[]) => Promise<string[]>;
  subscribeContract: (input: string[]) => Promise<void>;
  decode: (input: { rawInput: string; outputs: AbiIO[]; functionName: string }) => Promise<any>;
};

export type EventItem = {
  hash: string;
  nonIndexed: AbiIO[];
  name: string;
  indexed: AbiIO[];
};
