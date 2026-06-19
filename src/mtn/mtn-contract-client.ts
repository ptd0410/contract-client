import { ContractClient } from "src/contract-client";
import { ContractEventClient } from "./contract-event-client";
import { executeSmartContract } from "./excute-smart-contract";

export class MtnContractClient extends ContractClient {
  private eventClient: ContractEventClient = new ContractEventClient();

  constructor() {
    super();

    this.registerEventItems = this.eventClient.register.bind(this.eventClient);
  }

  onEvent = this.eventClient.onEvent;
  offEvent = this.eventClient.offEvent;
  onContract = this.eventClient.onContract;
  ready = this.eventClient.ready;

  async init() {
    this.eventClient.init();
    this.request = executeSmartContract;
    await this.eventClient.ready;
  }
}
