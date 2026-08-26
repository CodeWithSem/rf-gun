// EXAMPLE DATA NG TRANSFER ORDER
// FIRESTORE PATH: /DB1_ERP_SYSTEM/TBL_TRANSFER_ORDER/DATA/TO-20260801-1785521937451 (galing ito sa transfer_order_data.to_number)
const transfer_order_data = [
  {
    calculated_total_pads: 162000,
    complete_date: "",
    created_by: "Sem Sianghio",
    creation_date: "2026-07-31T22:00:00.000Z",
    creation_date_sort: "2026-08-01",
    hours: 6,
    id: "TO-20260801-1785521937451",
    item_code_ref: "9543",
    item_desc_ref: "GENERIC DIAPER S15'S X 12",
    machine_id_ref: "MS-CAL-PROD_M1",
    move_type_code: "PROD",
    move_type_desc: "Transfer Order - Production",
    pad_code_ref: "GEN-S",
    request_type: "Automated Request",
    std_ppm: 450,
    to_number: "TO-20260801-1785521937451",
    to_status: "Pending",
    update_date: "08-01-2026",
    update_time: "6:44 AM",
    transfer_list: [
      {
        bom_quantity_ref: 1620,
        current_inventory_ref: 0,
        item_code: "R-FP",
        item_desc: "FLUFF PULP",
        lpn_quantity_ref: 0,
        pick_date: "",
        quantity: 1620,
        received_date: "",
        sbin_code: "M1",
        transfer_status: "Picked",
        uom: "KGS",
        warehouse_code: "MS-CAL-PROD",
        lpn_list: [
          {
            batch_code: "",
            created_by: "Sem Sianghio",
            creation_date: "08-01-2026",
            expiry_date: "",
            gr_number: "",
            item_code: "R-FP",
            item_desc: "FLUFF PULP",
            lpn_id: "20260801-024044698-4",
            lpn_status: "Available",
            mfg_date: "",
            plant_code: "PL01",
            po_number: "",
            qty_base: 500,
            qty_in_kg: 0,
            remarks: "",
            sbin_code: "A-1",
            sloc_code: "",
            stype_code: "BULK",
            to_number_ref: "TO-20260801-1785521937451",
            to_picked_by: "Sem Sianghio",
            to_received_by: "Sem Sianghio", //`${user_data.first_name} ${user_data.last_name}` magkakaroon lang nito kapag nag Receive Material na si user
            to_dispatched_by: "Sem Sianghio", //`${user_data.first_name} ${user_data.last_name}` magkakaroon lang nito kapag nag Dispatch Material na si user
            to_sbin_code: "M1",
            to_warehouse_code: "MS-CAL-PROD",
            uom_base: "KGS",
            uom_display: "KGS",
            warehouse_code: "MS-CAL-TEST",
          },
          {
            batch_code: "",
            created_by: "Sem Sianghio",
            creation_date: "08-01-2026",
            expiry_date: "",
            gr_number: "",
            item_code: "R-FP",
            item_desc: "FLUFF PULP",
            lpn_id: "20260801-024044698-4",
            lpn_status: "Available",
            mfg_date: "",
            plant_code: "PL01",
            po_number: "",
            qty_base: 500,
            qty_in_kg: 0,
            remarks: "",
            sbin_code: "A-1",
            sloc_code: "",
            stype_code: "BULK",
            to_number_ref: "TO-20260801-1785521937451",
            to_picked_by: "Sem Sianghio",
            to_received_by: "Sem Sianghio", //`${user_data.first_name} ${user_data.last_name}` magkakaroon lang nito kapag nag Receive Material na si user
            to_dispatched_by: "Sem Sianghio", //`${user_data.first_name} ${user_data.last_name}` magkakaroon lang nito kapag nag Dispatch Material na si user
            to_sbin_code: "M1",
            to_warehouse_code: "MS-CAL-PROD",
            uom_base: "KGS",
            uom_display: "KGS",
            warehouse_code: "MS-CAL-TEST",
          },
        ],
      },
    ],
  },
];

// EXAMPLE DATA NG LPN
// FIRESTORE PATH: /DB1_ERP_SYSTEM/TBL_INVENTORY_COUNT/DATA/20260801-024044698-4 (galing ito sa lpn_data.lpn_id)
const lpn_data = [
  {
    batch_code: "",
    created_by: "Sem Sianghio",
    creation_date: "08-01-2026",
    expiry_date: "",
    gr_number: "",
    item_code: "R-FP",
    item_desc: "FLUFF PULP",
    lpn_id: "20260801-024044698-4",
    lpn_status: "Available",
    mfg_date: "",
    plant_code: "PL01",
    po_number: "",
    qty_base: 500,
    qty_in_kg: 0,
    remarks: "",
    sbin_code: "A-1",
    sloc_code: "",
    stype_code: "BULK",
    to_number_ref: "TO-20260801-1785521937451",
    to_picked_by: "Sem Sianghio",
    // to_received_by: `${user_data.first_name} ${user_data.last_name}` magkakaroon lang nito kapag nag Receive Material na si user
    to_sbin_code: "M1",
    to_warehouse_code: "MS-CAL-PROD",
    uom_base: "KGS",
    uom_display: "KGS",
    warehouse_code: "MS-CAL-TEST",
  },
];

const sample_payload = {
    calculated_total_pads: 162000, // ito yung magiging machine_update.total_pads
    complete_date: "",
    created_by: "Sem Sianghio",
    creation_date: "2026-07-31T22:00:00.000Z", // ito yung magiging machine_update.request_date
    creation_date_sort: "2026-08-01",
    hours: 6, // ito yung magiging machine_update.hours
    id: "TO-20260801-1785521937451",
    item_code_ref: "9543", // ito yung magiging machine_update.item_code
    item_desc_ref: "GENERIC DIAPER S15'S X 12", // ito yung magiging machine_update.item_desc
    machine_id_ref: "MS-CAL-PROD_M1", // Dito mag bebase kung anong machine yung iuupdate sa firestore database
    move_type_code: "PROD",
    move_type_desc: "Transfer Order - Production",
    pad_code_ref: "GEN-S", // ito yung magiging machine_update.pad_code
    request_type: "Automated Request",
    std_ppm: 450, // ito yung magiging machine_update.std_ppm
    to_number: "TO-20260801-1785521937451", // ito yung magiging machine_update.to_number_ref
    to_status: "Pending", // ito yung magiging machine_update.to_status_ref
    update_date: "08-01-2026",
    update_time: "6:44 AM",
    transfer_list: [],
  },
