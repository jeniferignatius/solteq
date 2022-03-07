const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());

// Routes
// Hakaniemen Kauppahalli
app.use(
  "/api/HakaniemenKauppahalli",
  require("./HakaniemenKauppahalli")
);
app.use(
  "/api/v2/HakaniemenKauppahalli",
  require("./routes/HakaniemenKauppahalli")
);

// Undefined endpoints
app.use((req, res) => {
  res.send("Invalid endpoint");
});

// Run the server
app.listen(PORT, () => {
  console.log("The application is listening on http://localhost:" + PORT);
});
