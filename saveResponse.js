// saveResponse.js
import { db } from "./firebaseConfig.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

export const saveResponse = async (responseData) => {
  try {
    await addDoc(collection(db, "responses"), responseData);
    console.log("Response saved:", responseData);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};
