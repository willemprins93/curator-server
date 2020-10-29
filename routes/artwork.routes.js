const { Router } = require("express");
const router = new Router();
const Artwork = require("../models/Artwork.model");
const User = require("../models/User.model");
const mongoose = require("mongoose");
const axios = require("axios");
const validIDs = require("../validIDs.json");
const $ = require("cheerio");
const puppeteer = require("puppeteer");

/////////////////////////
// GENERATE API TOKEN //
///////////////////////

// let apiToken;

// axios
//   .post(
//     `https://api.artsy.net/api/tokens/xapp_token?client_id=${process.env.ARTSY_CLIENT_ID}&client_secret=${process.env.ARTSY_CLIENT_SECRET}`
//   )
//   .then((response) => (apiToken = response.data.token))
//   .catch((err) => err);

///////////////////////////////
// GET DATA FROM ARTSY API //
/////////////////////////////

router.get("/:apiToken/random", (req, res) => {
  const { apiToken } = req.params;
  axios
    .get("https://api.artsy.net/api/artworks?sample", {
      headers: {
        "X-XAPP-Token": apiToken,
      },
    })
    .then((artwork) => {
      console.log(artwork.data.image_versions);
      const artistLink = artwork.data._links.artists.href;
      let imageLinkTemplate = artwork.data._links.image.href;
      let version = 0;
      if (artwork.data.image_versions.indexOf("large") >= 0) {
        version = artwork.data.image_versions.indexOf("large");
      } else if (artwork.data.image_versions.indexOf("normalized") >= 0) {
        version = artwork.data.image_versions.indexOf("normalized");
      } else {
        version = 0;
      }
      const imageLink = imageLinkTemplate.replace(
        "{image_version}",
        artwork.data.image_versions[version]
      );
      axios
        .get(artistLink, {
          headers: {
            "X-XAPP-Token": apiToken,
          },
        })
        .then((artist) => {
          res.status(200).json({
            artworkInfo: artwork.data,
            image: imageLink,
            artistInfo: artist.data._embedded.artists,
          });
        })
        .catch((err) => err);
    })
    .catch((err) => console.log(err));
});

///////////////////////////
// ARTWORKs FROM MetAPI //
/////////////////////////

// router.get("/random", (req, res) => {
//   const randomId =
//     validIDs.objectIDs[Math.floor(Math.random() * validIDs.objectIDs.length)];
//   axios
//     .get(
//       `https://collectionapi.metmuseum.org/public/collection/v1/objects/${randomId}`
//     )
//     .then(({ data }) => res.status(200).json(data))
//     .catch((err) => res.status(500).json({ errorMessage: err }));
// });

// router.get("/single/:id", (req, res) => {
//   const { id } = req.params;
//   axios
//     .get(
//       `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
//     )
//     .then(({ data }) => {
//       return res.status(200).json(data);
//     })
//     .catch((err) => {
//       return res.status(500).json({ errorMessage: err });
//     });
// });

////////////////////////////
// GET DATA FROM RestAPI //
//////////////////////////

router.get("/liked", (req, res) => {
  Artwork.find({})
    .then((response) => res.status(200).json(response))
    .catch((err) => res.status(500).json({ errorMessage: err }));
});

router.get("/liked/:id", (req, res) => {
  const { id } = req.params;
  Artwork.findById(id)
    .then((response) => res.status(200).json(response))
    .catch((err) => res.status(500).json({ errorMessage: err }));
});

//////////////////////////////////////////
// CREATE or UPDATE ARTWORK IN RestAPI //
////////////////////////////////////////
// hello

router.post("/add", (req, res) => {
  const { userId, artwork, artists, image } = req.body;
  Artwork.findOne({ artworkId: artwork.id.toString() })
    .then((artworkFromDB) => {
      if (artworkFromDB !== null) {
        Artwork.findByIdAndUpdate(
          artworkFromDB._id,
          { $addToSet: { usersLiked: userId } },
          { new: true }
        )
          .then((updatedArtwork) =>
            User.findByIdAndUpdate(
              userId,
              { $addToSet: { artworksLiked: updatedArtwork._id } },
              { new: true }
            ).then((updatedUser) => {
              res.status(201).json({
                success: "Artwork and User updated",
                updatedArtwork,
                updatedUser,
              });
            })
          )
          .catch((err) => console.log(err));
      } else {
        console.log("Inside the create");
        Artwork.create({
          title: artwork.title,
          artist: artists[0].name,
          artistNationality: artists[0].nationality,
          artistBio: artists[0].biography,
          medium: artwork.medium,
          img: image,
          collectingInstitution: artwork.collecting_institution,
          artworkId: artwork.id,
          usersLiked: [userId],
        })
          .then((createdArtwork) => {
            console.log("Artwork created");
            User.findByIdAndUpdate(
              userId,
              { $addToSet: { artworksLiked: createdArtwork._id } },
              { new: true }
            ).then((updatedUser) => {
              res.status(201).json({
                success: "Artwork created and User updated",
                createdArtwork,
                updatedUser,
              });
            });
          })
          .catch((err) => {
            console.log("Did not create");
            return res.status(400).json({ errorMessage: err });
          });
      }
    })
    .catch((err) => res.status(500).json({ errorMessage: err }));
});

module.exports = router;
