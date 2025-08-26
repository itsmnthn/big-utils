const originalParse = JSON.parse

/**
 * Reviver function for JSON.parse that converts stringified BigInt values (ending with 'n') back to BigInt.
 * @param {string} _key - The property key.
 * @param {any} value - The property value.
 * @returns {any} The revived value, as BigInt if applicable, otherwise the original value.
 */
export function bigIntReviver(_key: string, value: any): any {
  if (typeof value === 'string' && /^-?\d+n$/.test(value)) {
    return BigInt(value.slice(0, -1))
  }

  return value
}

/**
 * Replacer function for JSON.stringify to serialize BigInt values as strings ending with 'n'.
 *
 * @param {string} _key - The property key.
 * @param {any} value - The property value.
 * @returns {any} The value to serialize, with BigInt values converted to string with 'n' suffix.
 */
export function bigIntStringify(_key: string, value: any): any {
  return typeof value === 'bigint' ? `${value}n` : value
}

/**
 * Restores the original JSON.parse function and removes the BigInt.prototype.toJSON patch if present.
 *
 * After calling this function, JSON.stringify will no longer serialize BigInt values as strings with an 'n' suffix,
 * and JSON.parse will no longer automatically revive such strings to BigInt.
 *
 * Has no effect if the patch is not currently applied.
 *
 * @returns {void}
 */
export function unPatchBigInt(): void {
  if (!(JSON as any).__bigintPatched) {
    return
  }

  JSON.parse = originalParse
  if (Object.prototype.hasOwnProperty.call(BigInt.prototype, 'toJSON')) {
    delete (BigInt.prototype as any).toJSON
  }

  // Remove the flag to indicate it's no longer patched
  delete (JSON as any).__bigintPatched
}

/**
 * Monkey-patches the global JSON object to enable serialization and parsing of BigInt values.
 *
 * - Adds a `toJSON` method to `BigInt.prototype` (if not already present), so that `JSON.stringify`
 *   serializes BigInt values as strings ending with 'n' (e.g., `"123n"`).
 * - Overrides `JSON.parse` to automatically revive such stringified BigInt values back to BigInt instances.
 * - Returns an unPatch function to restore the original behavior.
 *
 * @param {boolean} [onlyBrowser] - If true, applies the patch only in browser environments (window defined).
 * @returns {() => void} A function that, when called, undoes the patch and restores original JSON behavior.
 *
 * @example
 * // Patch JSON for BigInt support
 * const unPatch = monkeyPatchBigInt();
 * const obj = { big: 12345678901234567890n };
 * const json = JSON.stringify(obj); // '{"big":"12345678901234567890n"}'
 * const parsed = JSON.parse(json); // { big: 12345678901234567890n }
 * unPatch(); // Restore original JSON behavior
 *
 * @remarks
 * - Modifies global objects (`JSON`, `BigInt.prototype`). Use with caution.
 * - The patch is idempotent; calling multiple times has no additional effect.
 * - The patch is reversible via the returned function or `unPatchBigInt`.
 */
export function monkeyPatchBigInt(onlyBrowser: boolean = false): () => void {
  if ((JSON as any).__bigintPatched || (onlyBrowser && typeof window === 'undefined')) {
    return () => {}
  }

  // Add toJSON to BigInt.prototype if not present
  if (!Object.prototype.hasOwnProperty.call(BigInt.prototype, 'toJSON')) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(BigInt.prototype, 'toJSON', {
      value() {
        return `${this.toString()}n` // Serializes a BigInt value as a string with an 'n' suffix for JSON.stringify.
      },
      configurable: true, // Allows removal during un-patch
      writable: true,
    })
  }

  /**
   * Overrides JSON.parse to support automatic BigInt revival.
   * If a custom reviver is provided, it is called after BigInt revival.
   *
   * @param {string} text - The JSON string to parse.
   * @param {(key: string, value: any) => any} [reviver] - Optional custom reviver.
   * @returns {any} The parsed object, with BigInt values revived.
   */
  JSON.parse = (text: string, reviver?: (key: string, value: any) => any) => {
    return originalParse(text, (key: string, value: any) => {
      const processedValue = bigIntReviver(key, value)
      return reviver ? reviver(key, processedValue) : processedValue
    })
  }

  // Set the flag on the JSON object
  Object.defineProperty(JSON, '__bigintPatched', {
    value: true,
    configurable: true, // Allows it to be deleted by un-patch
  })
  return unPatchBigInt
}

/**
 * Parses a JSON string and revives BigInt values.
 * This is a non-global patch: it does not modify global JSON behavior.
 *
 * @param {string} jsonString - The JSON string to parse.
 * @returns {any} The parsed object with BigInt values revived.
 */
export function parseWithBigInt(jsonString: string) {
  return JSON.parse(jsonString, bigIntReviver)
}

/**
 * Stringifies a value, serializing BigInt values as strings with an 'n' suffix.
 * This is a non-global patch: it does not modify global JSON behavior.
 *
 * @param {any} value - The value to stringify.
 * @returns {string} The JSON string with BigInt values serialized.
 */
export function stringifyWithBigInt(value: any) {
  return JSON.stringify(value, bigIntStringify)
}

export default monkeyPatchBigInt
