import { AbiItem, EventItem, EventResponse } from "src/types";
import { hashAbi, stripHexPrefix } from "./utils";
import { sendCommand, SystemCore } from "@metanodejs/system-core";

export class ContractEventClient {
  private eventsByTopic0 = new Map<string, EventItem>();
  private subscribed = new Set<string>();
  private contractListener = new Map<string, Set<Function>>();
  private readyArray: Promise<any>[] = [];

  get ready() {
    return Promise.all(this.readyArray);
  }

  async register(input: AbiItem[]) {
    const promise = hashAbi(input);
    this.readyArray.push(promise);
    const hashes = await promise;
    input.forEach((abi, i) => {
      if (!abi.name) return;
      const hash = hashes[i];
      this.eventsByTopic0.set(hash, {
        hash,
        nonIndexed: abi.inputs.filter((i) => !i.indexed),
        name: abi.name,
        indexed: abi.inputs.filter((i) => !!i.indexed),
      });
    });
  }

  private emit(name: string, payload: unknown) {
    this.contractListener.get(name)?.forEach((fn) => {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[emit] ${name}`, err);
      }
    });
  }

  private async handleEventData(e: EventResponse) {
    console.log("handleEventData 1", e);
    await this.ready;
    console.log("handleEventData 2", e);

    const { topics, data } = e;
    const [topic0] = topics;

    const eventItem = this.eventsByTopic0.get(topic0);

    if (!eventItem) return console.error("[handleEventData] can't handle", e);
    const indexed = eventItem.indexed.map((item, idx) => {
      const rs = topics[idx + 1];

      if (!rs) throw new Error("[handleEventData] Invalid topic match indexed");

      return [
        item.name || `params${idx}`,
        item.type === "address" ? rs.slice(-40) : stripHexPrefix(rs),
      ];
    });
    console.log("indexed", indexed);
    const nonIndexed = eventItem.nonIndexed.length
      ? await sendCommand("decodeAbi", {
          rawInput: data,
          outputs: eventItem.nonIndexed,
          functionName: eventItem.name,
        })
      : {};

    const rs = { ...nonIndexed, ...Object.fromEntries(indexed) };
    console.log("handleEventData 2", e);

    this.emit(eventItem.name, rs);
  }

  onContract(input: string | string[]) {
    const addresses = Array.isArray(input) ? input : [input];
    const validAddresses = addresses.filter((add) => !this.subscribed.has(add));
    validAddresses.forEach((add) => this.subscribed.add(add));
    if (!validAddresses.length) return;
    const promise = Promise.all(
      addresses.map((address) =>
        sendCommand("subscribeToAddress", { fromAddress: "", toAddress: address }),
      ),
    );
    this.readyArray.push(promise);
    return promise;
  }

  onEvent(name: string, cb: Function) {
    let set = this.contractListener.get(name);
    if (!set) {
      set = new Set();
      this.contractListener.set(name, set);
    }
    set.add(cb);
  }

  offEvent(name: string, cb: Function) {
    const set = this.contractListener.get(name);
    if (!set) return;
    set.delete(cb);
    if (set.size === 0) this.contractListener.delete(name);
  }

  init() {
    SystemCore.on("EventLogs", (e: any) =>
      this.handleEventData(Array.isArray(e.data) ? e.data[0] : e.data),
    );
  }
}
