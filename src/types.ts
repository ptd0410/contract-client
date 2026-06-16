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
