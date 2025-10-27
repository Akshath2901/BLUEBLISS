import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Backend is running perfectly!");
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});
