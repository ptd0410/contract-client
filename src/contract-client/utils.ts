export function stripHexPrefix(address?: string) {
  return (address ?? "").replace(/^0x/i, "").toLowerCase();
}
