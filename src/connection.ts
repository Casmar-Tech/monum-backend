import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

mongoose.connect(
  "mongodb+srv://dev_user:tdiUZc9xGN7xg29oC2ZoEM6zeribZ3@monum-main.oiejfnj.mongodb.net/"
);

const connection = mongoose.connection;

connection.once("open", async () => {
  console.log("Mongodb connection established");
});

connection.on("error", (err) => {
  console.log(err);
  process.exit(0);
});

export default connection;
