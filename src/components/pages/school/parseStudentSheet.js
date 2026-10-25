// parseStudentSheet.js
// Reads an Excel / CSV file and returns the list of { row, name, gender }.
// The spreadsheet library is passed in (loaded on demand by the modal) so this
// file stays small and easy to test.

export const MAX_FILE_SIZE_MB = 5;
export const MAX_IMPORT_ROWS = 500; // must match the backend limit

const letters = (v) =>
  (v === null || v === undefined ? "" : String(v))
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, "");

const NAME_HEADERS = new Set([
  "name", "names", "fullname", "fullnames", "studentname", "studentnames",
  "student", "students", "nom", "noms", "nomcomplet", "izina", "amazina",
]);
const GENDER_HEADERS = new Set(["gender", "sex", "sexe", "igitsina"]);
const GENDER_VALUES = new Set([
  "m", "male", "boy", "man", "masculin", "garcon", "gabo",
  "f", "female", "girl", "woman", "feminin", "fille", "gore",
]);

const cellText = (v) => (v === null || v === undefined ? "" : String(v).trim());

export function parseStudentSheet(XLSX, arrayBuffer) {
  let workbook;
  try {
    workbook = XLSX.read(arrayBuffer, { type: "array" });
  } catch (e) {
    return { rows: [], error: "This file could not be read. Please use an .xlsx, .xls or .csv file." };
  }

  // Use the first sheet that actually contains data
  let matrix = null;
  let rowOffset = 0;
  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws || !ws["!ref"]) continue;
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", blankrows: true, raw: false });
    if (data.some((r) => r.some((c) => cellText(c) !== ""))) {
      matrix = data;
      rowOffset = XLSX.utils.decode_range(ws["!ref"]).s.r; // first used row (0-based)
      break;
    }
  }
  if (!matrix) return { rows: [], error: "The file is empty." };

  // Look for a header row (Names / Gender) in the first 10 rows
  let headerIndex = -1;
  let nameCol = -1;
  let genderCol = -1;
  for (let i = 0; i < Math.min(matrix.length, 10) && headerIndex === -1; i++) {
    let n = -1;
    let g = -1;
    matrix[i].forEach((cell, c) => {
      const key = letters(cell);
      if (n === -1 && NAME_HEADERS.has(key)) n = c;
      if (g === -1 && GENDER_HEADERS.has(key)) g = c;
    });
    if (n !== -1 && g !== -1) {
      headerIndex = i;
      nameCol = n;
      genderCol = g;
    } else if (n !== -1 && g === -1) {
      return {
        rows: [],
        error: 'A "Names" column was found but there is no "Gender" column. Please add a Gender column (M or F).',
      };
    }
  }

  let startIndex;
  if (headerIndex !== -1) {
    startIndex = headerIndex + 1;
  } else {
    // No header row: assume column A = name, column B = gender.
    nameCol = 0;
    genderCol = 1;
    startIndex = 0;
    // If the first row's second cell is not a gender, it is probably a header row.
    const first = matrix[0] || [];
    if (!GENDER_VALUES.has(letters(first[1]))) startIndex = 1;
  }

  const rows = [];
  for (let i = startIndex; i < matrix.length; i++) {
    const r = matrix[i] || [];
    const name = cellText(r[nameCol]);
    const gender = cellText(r[genderCol]);
    if (name === "" && gender === "") continue; // fully blank line
    rows.push({ row: i + 1 + rowOffset, name, gender });
  }

  if (rows.length === 0) return { rows: [], error: "No students were found in the file." };
  return { rows, error: "" };
}

export async function loadSpreadsheetLibrary() {
  const mod = await import("xlsx");
  return mod && mod.read ? mod : mod.default;
}

export async function downloadTemplate() {
  const XLSX = await loadSpreadsheetLibrary();
  const ws = XLSX.utils.aoa_to_sheet([
    ["Names", "Gender"],
    ["EXAMPLE STUDENT ONE", "F"],
    ["EXAMPLE STUDENT TWO", "M"],
  ]);
  ws["!cols"] = [{ wch: 40 }, { wch: 10 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  XLSX.writeFile(wb, "students_import_template.xlsx");
}