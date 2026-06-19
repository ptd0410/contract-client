import { ContractClient } from "./contract-client";
import { MtnContractClient } from "./mtn";

export { ContractClient };
export const contractClient = new MtnContractClient();
