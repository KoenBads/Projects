import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function FirebaseTest() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Add a test transaction
        await addDoc(collection(db, "transactions"), {
          date: new Date().toISOString().slice(0, 10),
          amount: Math.random() * 5 + 1
        });

        // Read all transactions
        const snapshot = await getDocs(collection(db, "transactions"));
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTransactions(list);
      } catch (err) {
        console.error("Firestore test failed:", err);
      }
    };

    loadData();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Firebase Test</h1>
      <ul>
        {transactions.map(t => (
          <li key={t.id}>{t.date} → ${t.amount.toFixed(2)}</li>
        ))}
      </ul>
    </div>
  );
}
