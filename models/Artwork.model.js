const { Schema, model } = require("mongoose");

const artworkSchema = new Schema(
  {
    title: {
      type: String,
      default: "Title unknown",
      set: (v) => (v === "" ? "Title Unknown" : v),
    },
    artist: {
      type: Schema.Types.ObjectId,
      ref: "Artist",
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
