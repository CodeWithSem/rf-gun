import { rm_item_list } from "./rm_item_list";
import { pm_carton_item_list } from "./pm_carton_item_list";
import { pm_polybag_item_list } from "./pm_polybag_item_list";
import { pm_sack_item_list } from "./pm_sack_item_list";
import { fg_item_list } from "./fg_item_list";

export const item_master_list = [
  ...rm_item_list,
  ...pm_polybag_item_list,
  ...pm_carton_item_list,
  ...pm_sack_item_list,
  ...fg_item_list,
];
