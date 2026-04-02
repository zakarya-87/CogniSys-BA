import { jsonrepair } from 'jsonrepair';

const badJson = `{
  "key": "Growth of "farm-to-table" models requiring end-to-end traceability."
}`;

try {
  const fixed = jsonrepair(badJson);
  console.log("Fixed:", fixed);
} catch (e) {
  console.error("Failed:", e);
}
