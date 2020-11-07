const { Schema, model } = require("mongoose");

const artistSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      set: (v) => (v === "" || v === undefined ? "Unknown artist" : v),
    },
    sortName: {
      type: String,
      required: true,
      set: (v) => (v === "" || v === undefined ? "Unknown artist" : v),
    },
    bio: {
      type: String,
      default: "No further information",
      set: (v) => (v === "" || v === undefined ? "No further information" : v),
    },
    nationality: {
      type: String,
      default: "Nationality unknown",
      set: (v) => (v === "" || v === undefined ? "Nationality unknown" : v),
    },
    birthday: {
      type: String,
      default: "Unknown",
      set: (v) => (v === "" || v === undefined ? "Unknown" : v),
    },
    deathday: {
      type: String,
      default: "Unknown",
      set: (v) => (v === "" || v === undefined ? "Unknown" : v),
    },
    img: {
      type: String,
      set: (v) => (v === "" || v === undefined ? "No image available" : v),
    },
    artistId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = model("Artist", artistSchema);
