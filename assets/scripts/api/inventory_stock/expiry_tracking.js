import { db } from "../../firebaseConfig";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

export const save_expiry_api = async (storeId, userId, products) => {
  try {
    const activeRef = doc(
      db,
      "INVENTORY_STOCK",
      "EXPIRY_TRACKING",
      "STORES",
      storeId,
      "USERS",
      userId,
      "TRACKING",
      "ACTIVE_BATCHES",
    );

    // Prepare data: Convert dates and REMOVE status
    const formattedProducts = products.map(({ status, ...rest }) => ({
      ...rest,
      expiryDate:
        rest.expiryDate instanceof Date
          ? rest.expiryDate.toISOString()
          : rest.expiryDate,
    }));

    await setDoc(
      activeRef,
      {
        lastUpdated: serverTimestamp(),
        batches: formattedProducts, // Now contains everything EXCEPT status
        storeId,
        userId,
      },
      { merge: true },
    );

    return { success: true };
  } catch (error) {
    console.error("Save Expiry Error:", error);
    return { success: false, error };
  }
};

/**
 * FETCHES TODAY'S EXPIRY TRACKING STATE
 */
export const fetch_expiry_api = async (storeId, userId) => {
  const getStatus = (expiryDate) => {
    const today = new Date();
    const diff = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "expired";
    if (diff <= 15) return "critical";
    return "healthy";
  };
  try {
    const activeRef = doc(
      db,
      "INVENTORY_STOCK",
      "EXPIRY_TRACKING",
      "STORES",
      storeId,
      "USERS",
      userId,
      "TRACKING",
      "ACTIVE_BATCHES",
    );

    const docSnap = await getDoc(activeRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // Transform the data for the UI
      const processedBatches = (data.batches || []).map((item) => {
        // 1. Convert ISO string back to a real Date object
        const dateObj = new Date(item.expiryDate);

        return {
          ...item,
          expiryDate: dateObj,
          // 2. Re-calculate status on the fly so it is never "stale"
          // This ensures if a "Healthy" item expired overnight, it now shows as "Expired"
          status: getStatus(dateObj),
        };
      });

      return {
        success: true,
        data: {
          ...data,
          batches: processedBatches,
        },
      };
    }

    return { success: false, message: "No active batches found." };
  } catch (error) {
    console.error("Fetch Expiry Error:", error);
    return { success: false, error };
  }
};

/**
 * SAVES A SPECIFIC PULL-OUT EVENT TO HISTORY
 * Path: INVENTORY_STOCK / EXPIRY_HISTORY / DATA / {itemId}_{storeId}_{userId}
 */
export const pull_out_item_api = async (storeId, userId, item) => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split("T")[0];

    // Using the Item's Timestamp ID to make the history record unique
    const docId = `${item.id}_${storeId}_${userId}`;
    const historyRef = doc(
      db,
      "INVENTORY_STOCK",
      "EXPIRY_TRACKING_HISTORY",
      "DATA",
      docId,
    );

    const pullData = {
      historyId: docId,
      originalBatchId: item.id,
      storeId,
      userId,
      pullDate: dateString,
      itemDetails: {
        ...item,
        expiryDate:
          item.expiryDate instanceof Date
            ? item.expiryDate.toISOString()
            : item.expiryDate,
      },
      action: "PULLED_OUT",
      timestamp: serverTimestamp(),
    };

    await setDoc(historyRef, pullData);
    return { success: true };
  } catch (error) {
    console.error("Pull Out API Error:", error);
    return { success: false, error };
  }
};
