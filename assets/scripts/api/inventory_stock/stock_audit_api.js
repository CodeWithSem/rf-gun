import { db } from "../../firebaseConfig";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

// ... imports stay the same

export const save_stock_audit_api = async (
  storeId,
  username,
  products,
  isFinal = false,
) => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split("T")[0]; // Result: "2026-02-22"

    // UPDATED PATH: Added dateString as the final Document ID
    const auditRef = doc(
      db,
      "INVENTORY_STOCK",
      "STOCK_AUDIT",
      "STORES",
      storeId,
      "USERS",
      username,
      "DAILY_AUDITS", // Sub-collection for dates
      dateString, // Unique doc for each day
    );

    await setDoc(
      auditRef,
      {
        lastUpdated: serverTimestamp(),
        auditDate: dateString,
        status: isFinal ? "submitted" : "draft",
        inventory: products,
        storeId: storeId,
        username: username,
      },
      { merge: true },
    );

    return { success: true };
  } catch (error) {
    console.error("Firestore Save Error:", error);
    return { success: false, error };
  }
};

export const fetch_stock_audit_api = async (storeId, username) => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];

    // FETCH PATH: Must include the specific date
    const auditRef = doc(
      db,
      "INVENTORY_STOCK",
      "STOCK_AUDIT",
      "STORES",
      storeId,
      "USERS",
      username,
      "DAILY_AUDITS",
      dateString,
    );

    const docSnap = await getDoc(auditRef);

    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      // If it's a new day (e.g., 02/23), it will fall here,
      // allowing the UI to show a fresh, empty audit.
      return { success: false, message: "No audit found for today" };
    }
  } catch (error) {
    console.error("Firestore Fetch Error:", error);
    return { success: false, error };
  }
};

export const save_audit_history_api = async (
  storeId,
  username,
  products,
  isFinal = false,
) => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];

    // Create a unique ID for this specific user/store/day combo
    const docId = `${dateString}_${storeId}_${username}`;

    const historyRef = doc(
      db,
      "INVENTORY_STOCK",
      "STOCK_AUDIT_HISTORY",
      "DATA",
      docId,
    );

    await setDoc(
      historyRef,
      {
        auditId: docId,
        storeId: storeId,
        username: username,
        auditDate: dateString,
        inventory: products,
        status: isFinal ? "submitted" : "draft",
        lastUpdated: serverTimestamp(),
      },
      { merge: true },
    );

    return { success: true };
  } catch (error) {
    console.error("History Save Error:", error);
    return { success: false, error };
  }
};
