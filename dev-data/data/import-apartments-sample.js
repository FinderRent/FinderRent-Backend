const fs = require("fs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Apartment = require("./../../models/apartmentModel");

dotenv.config({ path: "./config.env" }); //direct nodejs to use the config.env file.

//changing the conncetion string in the config.env and save it in variable.
const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log("DB  connection successful"));

//Read json file.
const apartments = JSON.parse(
  fs.readFileSync(`${__dirname}/apartments-samples.json`, "utf-8")
);

//import data into DB
const importData = async () => {
  try {
    await Apartment.create(apartments);
    console.log("Data successfult loaded!!!");
  } catch (err) {
    console.log("Error 💥:", err);
  }
  process.exit();
};

//delete all data from DB
const deleteData = async () => {
  try {
    await Apartment.deleteMany();
    console.log("Data successfult deleted!!!");
  } catch (err) {
    console.log("Error 💥:", err);
  }
  process.exit();
};

if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
console.log(process.argv);
