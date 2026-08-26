import React, { createContext, useContext, useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { firestore_db } from "@assets/scripts/firebase";

// Ginawang snake_case ang pangalan ng context
const item_master_context = createContext(null);

export const ItemMasterProvider = ({ children }) => {
  const [item_master_data, set_item_master_data] = useState([]);
  const [is_loading_items, set_is_loading_items] = useState(true);

  useEffect(() => {
    const item_master_ref = collection(
      firestore_db,
      "DB1_ERP_SYSTEM",
      "TBL_ITEM_MASTER",
      "DATA",
    );

    const unsubscribe = onSnapshot(
      item_master_ref,
      (query_snapshot) => {
        const items = [];
        query_snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });

        set_item_master_data(items);
        set_is_loading_items(false);
      },
      (error) => {
        console.warn("Firestore Item Master Fetch Error:", error);
        set_is_loading_items(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <item_master_context.Provider
      value={{ item_master_data, is_loading_items }}
    >
      {children}
    </item_master_context.Provider>
  );
};

// Ginawang snake_case ang custom hook name
export const use_item_master = () => {
  const context = useContext(item_master_context);
  if (!context) {
    throw new Error(
      "use_item_master must be used within an ItemMasterProvider",
    );
  }
  return context;
};
