import { F_WH02_BIN_LIST } from "./F_WH02_BIN_LIST";
import { F_WH03_BIN_LIST } from "./F_WH03_BIN_LIST";
import { F_WH04_BIN_LIST } from "./F_WH04_BIN_LIST";
import { F_WH05_BIN_LIST } from "./F_WH05_BIN_LIST";
import { G2_CART_BIN_LIST } from "./G2_CART_BIN_LIST";
import { G2_POLY_BIN_LIST } from "./G2_POLY_BIN_LIST";
import { G2_SACK_BIN_LIST } from "./G2_SACK_BIN_LIST";

export const sbin_list = [
  // + Receiving Zone
  {
    id: "F-WH02-RECV",
    plant_code: "PL01",
    warehouse_code: "F-WH02",
    sloc_code: "RM",
    sbin_code: "F-WH02-RECV",
    sbin_desc: "Filspin Warehouse 2 Receiving Zone",
    stype_code: "RECV",
    is_item_dedicated: false,
    is_available: true,
    creation_date: "MM-DD-YYYY",
  },
  {
    id: "F-WH03-RECV",
    plant_code: "PL01",
    warehouse_code: "F-WH03",
    sloc_code: "RM",
    sbin_code: "F-WH03-RECV",
    sbin_desc: "Filspin Warehouse 3 Receiving Zone",
    stype_code: "RECV",
    is_item_dedicated: false,
    is_available: true,
    creation_date: "MM-DD-YYYY",
  },
  {
    id: "F-WH04-RECV",
    plant_code: "PL01",
    warehouse_code: "F-WH04",
    sloc_code: "RM",
    sbin_code: "F-WH04-RECV",
    sbin_desc: "Filspin Warehouse 4 Receiving Zone",
    stype_code: "RECV",
    is_item_dedicated: false,
    is_available: true,
    creation_date: "MM-DD-YYYY",
  },
  {
    id: "F-WH05-RECV",
    plant_code: "PL01",
    warehouse_code: "F-WH05",
    sloc_code: "RM",
    sbin_code: "F-WH05-RECV",
    sbin_desc: "Filspin Warehouse 5 Receiving Zone",
    stype_code: "RECV",
    is_item_dedicated: false,
    is_available: true,
    creation_date: "MM-DD-YYYY",
  },
  {
    id: "G2-POLY-RECV",
    plant_code: "PL01",
    warehouse_code: "G2-POLY",
    sloc_code: "PM",
    sbin_code: "G2-POLY-RECV",
    sbin_desc: "G2 Polybag Receiving Zone",
    stype_code: "RECV",
    is_item_dedicated: false,
    is_available: true,
    creation_date: "MM-DD-YYYY",
  },
  {
    id: "G2-CART-RECV",
    plant_code: "PL01",
    warehouse_code: "G2-CART",
    sloc_code: "PM",
    sbin_code: "G2-CART-RECV",
    sbin_desc: "G2 Carton Receiving Zone",
    stype_code: "RECV",
    is_item_dedicated: false,
    is_available: true,
    creation_date: "MM-DD-YYYY",
  },
  {
    id: "G2-SACK-RECV",
    plant_code: "PL01",
    warehouse_code: "G2-SACK",
    sloc_code: "PM",
    sbin_code: "G2-SACK-RECV",
    sbin_desc: "G2 Sack Receiving Zone",
    stype_code: "RECV",
    is_item_dedicated: false,
    is_available: true,
    creation_date: "MM-DD-YYYY",
  },
  // - Receiving Zone
  // + Bulk Storage
  ...F_WH02_BIN_LIST,
  ...F_WH03_BIN_LIST,
  ...F_WH04_BIN_LIST,
  ...F_WH05_BIN_LIST,
  ...G2_POLY_BIN_LIST,
  ...G2_CART_BIN_LIST,
  ...G2_SACK_BIN_LIST,
  // - Bulk Storage
];
