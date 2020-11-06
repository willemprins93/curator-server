const { Router } = require("express");
const router = new Router();
const Artwork = require("../models/Artwork.model");
const User = require("../models/User.model");
const mongoose = require("mongoose");
const axios = require("axios");

///////////////////////////////
// GET DATA FROM ARTSY API //
/////////////////////////////

router.get(`/:apiToken/:id/similar`, (req, res) => {
  const { apiToken, id } = req.params;

  console.log("PARAMS ", apiToken, id);

  axios
    .get(`https://api.artsy.net/api/artworks?similar_to_artwork_id=${id}`, {
      headers: {
        "X-XAPP-Token": apiToken,
      },
    })
    .then((response) => {
      console.log(response);
      return res
        .status(200)
        .json({ artworks: response.data._embedded.artworks });
    })
    .catch((err) => {
      console.log("ERROR WHILE SIMILAR ", err);
      return res.status(500).json({ errorMessage: err });
    });
});

router.get("/:apiToken/random", (req, res) => {
  const { apiToken } = req.params;
  axios
    .get("https://api.artsy.net/api/artworks?sample", {
      headers: {
        "X-XAPP-Token": apiToken,
      },
    })
    .then((artwork) => {
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
      res.status(200).json({
        artworkInfo: artwork.data,
        image: imageLink,
      });
    })
    .catch((err) => console.log(err));
});

// router.get("/:apiToken/search/:query", (req, res) => {
//   const { apiToken, query } = req.params;
//   axios
//     .post(`https://api.artsy.net/api/search?q=${query}"`, {
//       headers: {
//         "X-XAPP-Token": apiToken,
//       },
//     })
//     .then((response) => {
//       res.status(200).json(response);
//     })
//     .catch((err) => res.status(400).json({ errorMessage: err }));
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

router.post("/add", (req, res) => {
  const { userId, apiToken, artwork, image } = req.body;
  console.log({
    userId: userId,
    artwork: artwork,
    image: image,
  });
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
        const artistLink = artwork._links.artists.href;
        console.log("Artist LINK: ", artwork._links.artists.href);
        axios
          .get(artistLink, {
            headers: {
              "X-XAPP-Token": apiToken,
            },
          })
          .then((artist) => {
            console.log({
              artists: artist.data._embedded.artists,
            });
            const artists = artist.data._embedded.artists;
            Artwork.create({
              title: artwork.title,
              artist: artists[0].name,
              artistNationality: artists[0].nationality,
              artistBio: artists[0].biography,
              date: artwork.date,
              medium: artwork.medium,
              img: image,
              collectingInstitution: artwork.collecting_institution,
              artworkId: artwork.id,
              usersLiked: [userId],
            }).then((createdArtwork) => {
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
            });
          })
          .catch((err) => {
            console.log("Did not create");
            return res.status(400).json({ errorMessage: err });
          });
      }
    })
    .catch((err) => res.status(400).json({ errorMessage: err }));
});

router.post("/addliked", (req, res) => {
  const { userId, artworkId } = req.body;

  Artwork.findByIdAndUpdate(
    artworkId,
    { $addToSet: { usersLiked: userId } },
    { new: true }
  )
    .then((updatedArtwork) => {
      User.findByIdAndUpdate(
        userId,
        { $addToSet: { artworksLiked: artworkId } },
        { new: true }
      ).then((updatedUser) => {
        res.status(200).json({ updatedUser, updatedArtwork });
      });
    })
    .catch((err) => res.status(500).json({ errorMessage: err }));
});

module.exports = router;
