require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
require("./config/db.config");

//Router definition
const authRouter = require("./routes/auth.routes");
const artworkRouter = require("./routes/artwork.routes");
const { default: Axios } = require("axios");

const app = express();

//CORS configuration
app.use(
  cors({
    credentials: true,
    origin: process.env.ORIGIN || "http://localhost:3000",
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/artwork", artworkRouter);

module.exports = app;
