const express = require("express");
const mongoose = require("mongoose");
const router = require("./router");
const app = express();
const PORT = 5000;

// #region mongoose
mongoose
  .connect(
    "mongodb+srv://vovasanduliak:rpfNoufrzYbQRhRR@cluster0.mcy84kc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
  )
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error(`MongoDB connection error: ${err}`);
  });

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});
// #endregion mongoose

app.use(router);

app.listen(PORT, () => {
  console.log(`Server has been started on port ${PORT}`);
});
