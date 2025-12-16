/**
 * Import materials from the legacy JSON (currentDb.json) into MongoDB using
 * the schema described in materials_schema_design.json.
 *
 * Usage:
 *   node scripts/import_materials.js \
 *     --currentDb ./shared/currentDb.json \
 *     --companyId <companyId> \
 *     [--mongoUri mongodb://localhost:27017] \
 *     [--dbName uems] \
 *     [--insert] \
 *     [--previewFile /tmp/materials_preview.json]
 *
 * Notes:
 * - By default the script only prints the transformed documents (preview mode).
 * - Add --insert to write into the MongoDB collection `materials`.
 * - Price is required; any record without price is skipped.
 * - Dimensions in the legacy file are in millimeters; they are stored in SI
 *   meters with the source value/unit kept alongside.
 */

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const args = process.argv.slice(2);

function getArgValue(flag, defaultValue) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return defaultValue;
  }
  return args[index + 1];
}

const shouldInsert = args.includes("--insert");
const currentDbPath =
  getArgValue("--currentDb", "./shared/currentDb.json") || "";
const companyId = getArgValue("--companyId", process.env.COMPANY_ID || "");
const mongoUri = getArgValue(
  "--mongoUri",
  process.env.MONGO_URI || "mongodb://localhost:27017"
);
const dbName = getArgValue("--dbName", process.env.MONGO_DB || "uems");
const previewFile = getArgValue("--previewFile", "");

if (!currentDbPath) {
  throw new Error("Path to currentDb.json is required (--currentDb).");
}

if (shouldInsert && !companyId) {
  throw new Error("companyId is required when --insert is specified.");
}

/**
 * Mapping of legacy property names to the new structure for traceability.
 * Keys: legacy name; Values: destination path within the material document.
 */
const renameDictionary = {
  "Марка стали": "name",
  "Стоимость,  руб./кг. без НДС": "price.amount",
  "Стоимость, руб./кг. без НДС": "price.amount",
  "S,мм": "properties.wallThickness (m, from mm)",
  d: "properties.diameter (m, from mm)",
  id: "properties.rawId",
};

const priceKeys = [
  "Стоимость,  руб./кг. без НДС",
  "Стоимость, руб./кг. без НДС",
];

function mmToMeters(valueMm) {
  if (valueMm === undefined || valueMm === null || Number.isNaN(valueMm)) {
    return undefined;
  }
  const numericValue = Number(valueMm);
  if (!Number.isFinite(numericValue)) {
    return undefined;
  }
  return {
    value: numericValue / 1000,
    unit: "m",
    sourceUnit: "mm",
    sourceValue: numericValue,
  };
}

function buildMaterialDocument(categoryName, rawItem, companyIdValue) {
  const priceKey = priceKeys.find(key => rawItem[key] !== undefined);
  const price = priceKey ? Number(rawItem[priceKey]) : undefined;
  if (!price || Number.isNaN(price)) {
    return null; // Skip when price is missing
  }

  const grade = rawItem["Марка стали"] || "Без марки";
  const diameter = rawItem.d !== undefined ? mmToMeters(rawItem.d) : undefined;
  const wallThickness =
    rawItem["S,мм"] !== undefined ? mmToMeters(rawItem["S,мм"]) : undefined;

  const now = new Date();
  return {
    companyId: companyIdValue || "<provide companyId>",
    category: categoryName,
    name: grade,
    price: {
      currency: "RUB",
      amount: price,
    },
    unitSystem: "SI",
    specStandard: "GOST",
    properties: {
      ...(diameter ? { diameter } : {}),
      ...(wallThickness ? { wallThickness } : {}),
      ...(rawItem.id && rawItem.id !== "-" ? { rawId: rawItem.id } : {}),
    },
    isActive: true,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

function loadLegacyData(filePath) {
  const fileContent = fs.readFileSync(path.resolve(filePath), "utf-8");
  return JSON.parse(fileContent);
}

function transformAll(legacyData, companyIdValue) {
  const documents = [];
  Object.entries(legacyData).forEach(([categoryName, items]) => {
    if (!Array.isArray(items)) {
      return;
    }
    items.forEach(item => {
      const doc = buildMaterialDocument(categoryName, item, companyIdValue);
      if (doc) {
        documents.push(doc);
      }
    });
  });
  return documents;
}

async function insertIntoMongo(materials) {
  const client = new MongoClient(mongoUri);
  await client.connect();
  try {
    const db = client.db(dbName);
    const collection = db.collection("materials");
    const result = await collection.insertMany(materials, { ordered: false });
    return {
      insertedCount: result.insertedCount,
      insertedIds: result.insertedIds,
    };
  } finally {
    await client.close();
  }
}

async function main() {
  const legacyData = loadLegacyData(currentDbPath);
  const transformed = transformAll(legacyData, companyId);

  console.log("Preview (first 5 docs):");
  console.log(JSON.stringify(transformed.slice(0, 5), null, 2));
  console.log(`Total ready for insert (price present): ${transformed.length}`);

  if (previewFile) {
    fs.writeFileSync(
      previewFile,
      JSON.stringify(transformed, null, 2),
      "utf-8"
    );
    console.log(`Full preview written to: ${previewFile}`);
  }

  if (!shouldInsert) {
    console.log("Preview mode only. Add --insert to write into MongoDB.");
    return;
  }

  const materialsToInsert = transformed.map(doc => ({
    ...doc,
    companyId,
  }));

  const insertResult = await insertIntoMongo(materialsToInsert);
  console.log("Insert complete:", insertResult);
}

main().catch(error => {
  console.error("Import failed:", error);
  process.exit(1);
});
