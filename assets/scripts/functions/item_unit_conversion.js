export const calculate_base_qty = (item_code, amount, unit, master_list) => {
  // 1. Find the item definition inside the function
  const item = master_list.find((i) => i.item_code === item_code);

  if (!item) {
    console.error(`Item ${item_code} not found.`);
    return amount;
  }

  // 2. Perform the conversion
  const multiplier = item.conversion[unit];

  if (multiplier === undefined) {
    console.warn(`Unit "${unit}" missing for ${item_code}.`);
    return amount;
  }

  return amount * multiplier;
};

export const qty_unit_conversion = (
  qty_base,
  target_uom,
  item_code,
  item_master_list,
) => {
  // 1. Find the item configuration
  const item_def = item_master_list.find(
    (item) => item.item_code === item_code,
  );

  if (!item_def) {
    console.error(`Item configuration for ${item_code} not found.`);
    return 0;
  }

  // 2. Get the conversion factor for the target UOM
  // If target_uom is "CS", it pulls the multiplier (e.g., 20)
  const multiplier = item_def.conversion?.[target_uom] || 1;

  // 3. Calculation
  const converted_qty = qty_base / multiplier;

  // 4. Return formatted number (handles decimals if picking occurs)
  return Number.isInteger(converted_qty)
    ? converted_qty
    : parseFloat(converted_qty.toFixed(3));
};
