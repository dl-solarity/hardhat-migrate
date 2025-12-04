/**
 * After the update to HH-3, prefixes like `project` or `npm` appeared in the absolutePath in the BuildInfo.
 * For example, if your contract is from OpenZeppelin (e.g., Ownable), it will look like this in the BuildInfo:
 * npm/@openzeppelin/contracts@5.4.0/access/Ownable.sol. If the contract is local, it will look like this:
 * project/contracts/access/ARBAC.sol.
 * However, the fully qualified name does not include the mentioned prefix.
 *
 * This utility function removes the prefix, which is expected to be a single word and to always exist.
 */
export function removeHardhatNamespacePrefix(path: string): string {
  const idx = path.indexOf("/");

  return idx >= 0 ? path.slice(idx + 1) : path;
}
