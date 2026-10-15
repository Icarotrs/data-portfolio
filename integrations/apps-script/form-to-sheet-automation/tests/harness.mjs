// Loads the .gs files into a Node VM context with small fakes for the
// Google services they touch, so the logic can be tested without Google.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

/** A minimal in-memory sheet: values, notes and row insertion. */
export class FakeSheet {
  constructor(name, rows, cols) {
    this.name = name;
    this.values = Array.from({ length: rows }, () => Array(cols).fill(""));
    this.notes = {};
    this.writes = []; // [{row, col, width}]
  }
  getName() { return this.name; }
  getMaxRows() { return this.values.length; }
  getLastRow() {
    for (let r = this.values.length - 1; r >= 0; r--) if (this.values[r].some((v) => v !== "")) return r + 1;
    return 0;
  }
  insertRowsAfter(after, n) {
    const cols = this.values[0].length;
    this.values.splice(after, 0, ...Array.from({ length: n }, () => Array(cols).fill("")));
  }
  getRange(row, col, nr = 1, nc = 1) {
    const sheet = this;
    return {
      getValues: () => sheet.values.slice(row - 1, row - 1 + nr).map((r) => r.slice(col - 1, col - 1 + nc)),
      setValues(v) {
        if (v.length !== nr || v[0].length !== nc) throw new Error(`setValues size mismatch at ${row},${col}`);
        v.forEach((r, i) => r.forEach((x, j) => (sheet.values[row - 1 + i][col - 1 + j] = x)));
        sheet.writes.push({ row, col, width: nc });
        return this;
      },
      setNote(text) { sheet.notes[`${row},${col}`] = text; return this; },
    };
  }
}

export function load({ sheets = {}, lock } = {}) {
  const lockState = { held: false, acquired: 0, released: 0 };
  const context = {
    console,
    Logger: { log() {} },
    LockService: {
      getScriptLock: () =>
        lock ?? {
          waitLock() {
            if (lockState.held) throw new Error("lock already held");
            lockState.held = true;
            lockState.acquired++;
          },
          releaseLock() { lockState.held = false; lockState.released++; },
        },
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({ getSheetByName: (n) => sheets[n] ?? null }),
      flush() {},
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => null }) },
  };
  vm.createContext(context);
  for (const file of ["Config.gs", "Clean.gs", "Orders.gs", "Report.gs", "Setup.gs"]) {
    vm.runInContext(fs.readFileSync(path.join(SRC, file), "utf8"), context, { filename: file });
  }
  context.__lock = lockState;
  return context;
}
