const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(cors());
app.use(express.json());

// Отримати всі стартапи користувача
app.get("/api/startup/:uid", async (req, res) => {
  try {
    const snapshot = await db.collection("startups")
      .where("uid", "==", req.params.uid)
      .get();

    const startups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(startups);
  } catch {
    res.status(500).json({ error: "Error getting startups" });
  }
});

// Створити новий стартап
app.post("/api/startup/:uid", async (req, res) => {
  const data = req.body;
  const uid = req.params.uid;

  if (!data.name || data.name.length < 5) {
    return res.status(400).json({ error: "Name too short" });
  }

  try {
    await db.collection("startups").add({ ...data, uid });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Error saving startup" });
  }
});

// Отримати конкретний стартап за ID
app.get("/api/startup/:uid/:id", async (req, res) => {
  try {
    const doc = await db.collection("startups").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Startup not found" });

    const data = doc.data();
    if (data.uid !== req.params.uid) return res.status(403).json({ error: "Forbidden" });

    res.json({ id: doc.id, ...data });
  } catch {
    res.status(500).json({ error: "Error getting startup by ID" });
  }
});

// Оновити конкретний стартап за ID
app.put("/api/startup/:uid/:id", async (req, res) => {
  const data = req.body;
  try {
    const doc = await db.collection("startups").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Startup not found" });

    if (doc.data().uid !== req.params.uid) return res.status(403).json({ error: "Forbidden" });

    await db.collection("startups").doc(req.params.id).update(data);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Error updating startup" });
  }
});

app.get("/api/investors", async (req, res) => {
  try {
    const snapshot = await db.collection("investors").get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch {
    res.status(500).json({ error: "Error getting investors" });
  }
});

app.post("/api/investors", async (req, res) => {
  const investor = req.body;
  try {
    const docRef = await db.collection("investors").add(investor);
    res.json({ id: docRef.id });
  } catch {
    res.status(500).json({ error: "Error adding investor" });
  }
});

app.get("/api/markets", async (req, res) => {
  try {
    const snapshot = await db.collection("markets").get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch {
    res.status(500).json({ error: "Error getting markets" });
  }
});

app.post("/api/markets", async (req, res) => {
  const market = req.body;
  try {
    const docRef = await db.collection("markets").add(market);
    res.json({ id: docRef.id });
  } catch {
    res.status(500).json({ error: "Error adding market" });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch {
    res.status(500).json({ error: "Error getting users" });
  }
});

app.post("/api/users", async (req, res) => {
  const { uid, email, nickname, avatar } = req.body;
  if (!uid || !email) return res.status(400).json({ error: "Missing uid or email" });
  try {
    await db.collection("users").doc(uid).set({ email, nickname, avatar });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Error saving user" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
