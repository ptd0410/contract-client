import { sendCommand } from "@metanodejs/system-core";
import { jsonToInputArray } from "./utils";
import { RequestPayload } from "src/types";

export const executeSmartContract = (v: RequestPayload) => {
  const w: any = window;
  const amountKey = w.fiaiSDK ? "amount" : "value";
  const amount = v.amount || 0;
  const payload = {
    from: v.from,
    to: v.to,
    feeType: v.feeType,
    functionName: v.abi.name,
    abiData: [v.abi],
    inputArray: jsonToInputArray(v.abi, v.data),
    gas: String(v.gas || 300_000),
    type: "transaction",
    bundleId: "",
    [amountKey]: w.fiaiSDK ? +amount : String(amount),
  };

  if (w.fiaiSDK) {
    Object.assign(payload, {
      isCall: true,
      isDeploy: true,
      isReadOnly: v.feeType === "read",
    });
  }
  try {
    const command = w.fiaiSDK ? "sendTransaction" : "executeSmartContract";
    return sendCommand(command, payload);
  } catch (error) {
    console.error("send contract error", { functionName: v.abi.name, error, payload });
    throw error;
  }
};
