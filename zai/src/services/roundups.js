// src/services/roundups.js
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

/**
 * Add a new roundup to Firestore
 */
export async function addRoundup({ date, amount, userId = "demo-user" }) {
  try {
    await addDoc(collection(db, "roundups"), {
      date,
      amount,
      userId,
    });
    console.log("Roundup added:", date, amount);
  } catch (err) {
    console.error("Error adding roundup:", err);
  }
}

/**
 * Get all roundups for a user
 */
export async function getRoundups(userId = "demo-user") {
  try {
    const q = query(
      collection(db, "roundups"),
      where("userId", "==", userId),
      orderBy("date", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data());
  } catch (err) {
    console.error("Error fetching roundups:", err);
    return [];
  }
}
