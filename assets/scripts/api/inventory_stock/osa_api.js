import { db } from "../../firebaseConfig";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

/**
 * SAVES ACTIVE DAILY STATE
 * Path: INVENTORY_STOCK / OSA / STORES / {storeId} / USERS / {userId} / DAILY_OSA / {dateString}
 */
export const save_osa_api = async (
  storeId,
  userId,
  products,
  isFinal = false,
) => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];

    const osaRef = doc(
      db,
      "INVENTORY_STOCK",
      "OSA",
      "STORES",
      storeId,
      "USERS",
      userId,
      "DAILY_OSA",
      dateString,
    );

    await setDoc(
      osaRef,
      {
        lastUpdated: serverTimestamp(),
        osaDate: dateString,
        status: isFinal ? "submitted" : "draft",
        inventory: products,
        storeId,
        userId,
      },
      { merge: true },
    );

    return { success: true };
  } catch (error) {
    console.error("OSA Save Error:", error);
    return { success: false, error };
  }
};

/**
 * FETCHES TODAY'S OSA STATE
 */
export const fetch_osa_api = async (storeId, userId) => {
  try {
    const dateString = new Date().toISOString().split("T")[0];
    const osaRef = doc(
      db,
      "INVENTORY_STOCK",
      "OSA",
      "STORES",
      storeId,
      "USERS",
      userId,
      "DAILY_OSA",
      dateString,
    );

    const docSnap = await getDoc(osaRef);

    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    }
    return { success: false, message: "Fresh OSA for today." };
  } catch (error) {
    console.error("OSA Fetch Error:", error);
    return { success: false, error };
  }
};

/**
 * SAVES PERMANENT HISTORY RECORD
 * Path: INVENTORY_STOCK / OSA_HISTORY / DATA / {docId}
 */
export const save_osa_history_api = async (
  storeId,
  userId,
  products,
  isFinal = false,
) => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];
    const docId = `${dateString}_${storeId}_${userId}`;

    const historyRef = doc(db, "INVENTORY_STOCK", "OSA_HISTORY", "DATA", docId);

    await setDoc(
      historyRef,
      {
        osaId: docId,
        storeId,
        userId,
        osaDate: dateString,
        inventory: products,
        status: isFinal ? "submitted" : "draft",
        lastUpdated: serverTimestamp(),
      },
      { merge: true },
    );

    return { success: true };
  } catch (error) {
    console.error("OSA History Error:", error);
    return { success: false, error };
  }
};
