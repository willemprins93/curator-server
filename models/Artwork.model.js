const { Schema, model } = require("mongoose");

const artworkSchema = new Schema(
  {
    title: {
      type: String,
      default: "Title Unknown",
      set: (v) => (v === "" ? "Title Unknown" : v),
    },
    artist: {
      type: String,
      default: "Artist Unknown",
      set: (v) => (v === "" || v === undefined ? "Artist unknown" : v),
    },
    artistNationality: {
      type: String,
      default: "Nationality unknown",
      set: (v) => (v === "" || v === undefined ? "Nationality unknown" : v),
    },
    artistBio: {
      type: String,
      default: "No further information",
      set: (v) => (v === "" || v === undefined ? "No further information" : v),
    },
    date: {
      type: String,
      default: "Date unknown",
      set: (v) => (v === "" || v === undefined ? "Date unknown" : v),
    },
    medium: {
      type: String,
      default: "Medium unkown",
      set: (v) => (v === "" ? "Medium Unknown" : v),
    },
    collectingInstitution: {
      type: String,
      default: "Unknown",
      set: (v) => (v === "" ? "Unknown" : v),
    },
    img: {
      type: String,
      required: true,
    },
    artworkId: {
      type: String,
      required: true,
    },
    usersLiked: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

module.exports = model("Artwork", artworkSchema);
