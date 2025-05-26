import xlsx from 'xlsx';

function parseWorkbook(path) {
  const workbook = xlsx.readFile(path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return xlsx.utils.sheet_to_json(sheet);
}

function normalizeSku(value) {
  return value?.toString().trim().toLowerCase(); // ⬅ Normalize here
}

function toMap(data, isOld = false) {
  const map = new Map();

  data.forEach(row => {
    let rawSku = isOld
      ? row["Product Name(required)"] ?? row["sku"] ?? row["SKU"]
      : row["sku"] ?? row["Product Name(required)"] ?? row["SKU"];

    const key = normalizeSku(rawSku);
    if (key) {
      map.set(key, row);
    }
  });

  return map;
}

function parseNumber(value) {
  if (typeof value === 'string') value = value.replace(/[^0-9.\-]/g, '');
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function extractCost(row, isOld = false) {
  if (isOld) {
    return parseNumber(
      row["Cost Per Item"] ?? row["Price"] ?? row["cost"] ?? row["price"]
    );
  }
  return parseNumber(
    row["cost"] ?? row["Cost"] ?? row["price"] ?? row["Price"]
  );
}

function compareStocks(oldPath, newPath) {
  const oldData = parseWorkbook(oldPath);
  const newData = parseWorkbook(newPath);

  const oldMap = toMap(oldData, true);
  const newMap = toMap(newData, false);

  const added = [];
  const removed = [];
  const changed = [];

  newMap.forEach((newItem, normalizedSku) => {
    const newCost = extractCost(newItem, false);

    if (!oldMap.has(normalizedSku)) {
      added.push({ sku: normalizedSku, cost: newCost });
    } else {
      const oldItem = oldMap.get(normalizedSku);
      const oldCost = extractCost(oldItem, true);

      if (oldCost === null || newCost === null) {
        console.warn(`Missing cost for SKU: ${normalizedSku}`, {
          old: oldItem["Cost Per Item"],
          new: newItem["cost"]
        });
      }

      if (oldCost !== newCost) {
        changed.push({
          sku: normalizedSku,
          oldCost,
          newCost,
          costChange: oldCost !== null && newCost !== null ? +(newCost - oldCost).toFixed(2) : null,
          costPercent: oldCost && newCost
            ? (((newCost - oldCost) / oldCost) * 100).toFixed(2)
            : null
        });
      }
    }
  });

  oldMap.forEach((_, normalizedSku) => {
    if (!newMap.has(normalizedSku)) {
      removed.push(normalizedSku);
    }
  });

  return {
    summary: {
      oldCount: oldData.length,
      newCount: newData.length,
      added: added.length,
      removed: removed.length,
      changed: changed.length
    },
    added,
    removed,
    changed
  };
}

export default compareStocks;
