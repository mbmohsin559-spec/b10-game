const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (req, res) => {
  res.json({
    name: "B10 GAME",
    status: "Online",
    mode: "Demo",
    balance: 10000
  });
});

app.listen(3000, "0.0.0.0", () => {
  console.log("B10 GAME running on port 3000");
});
