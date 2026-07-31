import * as fs from "fs";
import * as path from "path";
import { Page } from "@playwright/test";

/**
 * Generates a random integer within a specified range (inclusive).
 *
 * @param {number} min - The minimum integer value that can be returned.
 * @param {number} max - The maximum integer value that can be returned.
 * @returns {number} A random integer between the specified min and max values, inclusive.
 */
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Registers an init script that seeds localStorage on every page navigation,
 * BEFORE any page script runs. This is how you preload Helioviewer userSettings
 * (or any localStorage state) so the app boots from a known state.
 *
 * String values are stored verbatim; everything else is JSON.stringify'd to match
 * how Helioviewer stores its settings ({ "settings": "<json>" }).
 *
 * @note Calling this multiple times stacks init scripts (Playwright has no
 *       removeInitScript). Subsequent registrations override earlier ones for the
 *       same keys on every navigation, but the older scripts still run. For test
 *       isolation, prefer setting localStorage once per test.
 *
 * @param page Playwright Page
 * @param items Map of localStorage key → value (any JSON-serializable value)
 */
async function applyInitLocalStorage(page: Page, items: Record<string, unknown>): Promise<void> {
  await page.addInitScript((data) => {
    for (const [key, value] of Object.entries(data)) {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    }
  }, items);
}

/**
 * Reads and parses a JSON state file. Pass path segments the same way you'd
 * pass them to path.join — typically `__dirname` first, then any subfolders,
 * ending with the file name. Use this to keep state fixtures alongside the
 * test that owns them.
 *
 * Example:
 *   const state = readJSON(__dirname, "states", "file1.json");
 *   await hv.Load("/", { localStorage: { settings: state } });
 *
 * @param pathSegments Path segments forming an absolute path to a JSON file.
 * @returns The parsed JSON content.
 */
function readJSON(...pathSegments: string[]): Record<string, unknown> {
  const filePath = path.join(...pathSegments);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/**
 * Reads a value from localStorage, supporting dotted paths that drill into
 * JSON-parsed values.
 *
 * A path segment may itself contain dots (localStorage keys can look like
 * `"helioviewer.events.selections.HEK"`), so resolution rules are:
 *
 * 1. If the FULL path exists as a literal localStorage key, return that
 *    (JSON-parsed if possible; raw string otherwise).
 * 2. Otherwise, walk prefixes of the path from LONGEST to SHORTEST. The first
 *    prefix that matches a literal localStorage key is treated as the key;
 *    the remaining `.`-separated segments are dereferenced into the parsed
 *    JSON value.
 * 3. If nothing matches, returns null.
 *
 * @example
 *   // Literal-key match, whole value:
 *   await getLocalStorage(page, "settings")
 *   await getLocalStorage(page, "helioviewer.events.selections.HEK")
 *
 *   // Drill into "settings" (which holds the userSettings JSON):
 *   await getLocalStorage(page, "settings.options.movies")
 *   await getLocalStorage(page, "settings.state.events_v2.tree_HEK.visible")
 *
 * @param page Playwright Page
 * @param path Dotted path — see resolution rules above
 */
async function getLocalStorage(page: Page, path: string): Promise<unknown> {
  return await page.evaluate((p) => {
    const parse = (raw: string | null): unknown => {
      if (raw === null) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    };

    // 1. Full path is itself a literal localStorage key.
    const direct = window.localStorage.getItem(p);
    if (direct !== null) return parse(direct);

    // 2. Longest-to-shortest prefix as literal key, remainder as JSON path.
    const segments = p.split(".");
    for (let i = segments.length - 1; i >= 1; i--) {
      const key = segments.slice(0, i).join(".");
      const raw = window.localStorage.getItem(key);
      if (raw === null) continue;
      let cursor: any = parse(raw);
      for (const seg of segments.slice(i)) {
        if (cursor === null || cursor === undefined || typeof cursor !== "object") {
          return undefined;
        }
        cursor = cursor[seg];
      }
      return cursor;
    }
    return null;
  }, path);
}

export { getRandomInt, applyInitLocalStorage, readJSON, getLocalStorage };
