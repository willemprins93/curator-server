const { Router } = require("express");
const router = new Router();
const Artwork = require("../models/Artwork.model");
const User = require("../models/User.model");
const axios = require("axios");
const Artist = require("../models/Artist.model");

////////////////////////////
// GET DATA FROM RestAPI //
//////////////////////////

router.get("/liked", (req, res) => {
  Artwork.find({})
    .populate("artist")
    .then((response) => res.status(200).json(response))
    .catch((err) => res.status(500).json({ errorMessage: err }));
});

router.get("/liked/:id", (req, res) => {
  const { id } = req.params;
  Artwork.findById(id)
    .populate("artist")
    .then((response) => {
      res.status(200).json(response);
    })
    .catch((err) => {
      res.status(500).json({ errorMessage: err });
    });
});

//////////////////////////////////////////
// CREATE or UPDATE ARTWORK IN RestAPI //
////////////////////////////////////////

router.post("/add", (req, res) => {
  const { userId, apiToken, artwork, image } = req.body;
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
        const artistLink = artwork._links.artists.href;
        axios
          .get(artistLink, {
            headers: {
              "X-XAPP-Token": apiToken,
            },
          })
          .then((response) => {
            if (response.data._embedded.artists[0].id) {
              Artist.findOne({
                artistId: response.data._embedded.artists[0].id,
              }).then((artistFromDB) => {
                if (artistFromDB !== null) {
                  Artwork.create({
                    title: artwork.title,
                    artist: artistFromDB._id,
                    date: artwork.date,
                    medium: artwork.medium,
                    collectingInstitution: artwork.collecting_institution,
                    img: image,
                    artworkId: artwork.id,
                    usersLiked: [userId],
                  })
                    .then((createdArtwork) =>
                      User.findByIdAndUpdate(
                        userId,
                        { $addToSet: { artworksLiked: updatedArtwork._id } },
                        { new: true }
                      ).then((updatedUser) => {
                        res.status(201).json({
                          success: "Artwork and User updated",
                          createdArtwork,
                          updatedUser,
                        });
                      })
                    )
                    .catch((err) => console.error(err));
                } else {
                  const artist = response.data._embedded.artists[0];
                  let imageLinkTemplate = artist._links.image.href;
                  let version = 0;
                  if (artist.image_versions.indexOf("large") >= 0) {
                    version = artist.image_versions.indexOf("large");
                  } else if (artist.image_versions.indexOf("normalized") >= 0) {
                    version = artist.mage_versions.indexOf("normalized");
                  } else {
                    version = 0;
                  }
                  const imageLink = imageLinkTemplate.replace(
                    "{image_version}",
                    artist.image_versions[version]
                  );
                  Artist.create({
                    name: artist.name,
                    sortName: artist.sortable_name,
                    bio: artist.biography,
                    nationality: artist.nationality,
                    birthday: artist.birthdate,
                    deathday: artist.deathday,
                    img: artist.image,
                    artistId: artist.id,
                  }).then((createdArtist) => {
                    Artwork.create({
                      title: artwork.title,
                      artist: createdArtist._id,
                      date: artwork.date,
                      medium: artwork.medium,
                      collectingInstitution: artwork.collecting_institution,
                      img: image,
                      artworkId: artwork.id,
                      usersLiked: [userId],
                    }).then((createdArtwork) => {
                      User.findByIdAndUpdate(
                        userId,
                        { $addToSet: { artworksLiked: createdArtwork._id } },
                        { new: true }
                      ).then((updatedUser) => {
                        res.status(201).json({
                          success: "Artwork created and User updated",
                          createdArtwork,
                          createdArtist,
                          updatedUser,
                        });
                      });
                    });
                  });
                }
              });
            } else {
              Artwork.create({
                title: artwork.title,
                date: artwork.date,
                medium: artwork.medium,
                collectingInstitution: artwork.collecting_institution,
                img: image,
                artworkId: artwork.id,
                usersLiked: [userId],
              })
                .then((createdArtwork) =>
                  User.findByIdAndUpdate(
                    userId,
                    { $addToSet: { artworksLiked: updatedArtwork._id } },
                    { new: true }
                  ).then((updatedUser) => {
                    res.status(201).json({
                      success: "Artwork and User updated",
                      createdArtwork,
                      updatedUser,
                    });
                  })
                )
                .catch((err) => res.status(400).json({ errorMessage: err }));
            }
          })
          .catch((err) => {
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

///////////////////////////////
// GET DATA FROM ARTSY API //
/////////////////////////////

router.post("/:apiToken/more", (req, res) => {
  const { apiToken } = req.params;
  const { url } = req.body;
  axios
    .get(url, {
      headers: {
        "X-XAPP-Token": apiToken,
      },
    })
    .then((response) => {
      res.status(200).json(response.data);
    })
    .catch((err) => res.status(400).json({ errorMessage: err }));
});

router.get(`/:apiToken/:id/similar`, (req, res) => {
  const { apiToken, id } = req.params;

  axios
    .get(`https://api.artsy.net/api/artworks?similar_to_artwork_id=${id}`, {
      headers: {
        "X-XAPP-Token": apiToken,
      },
    })
    .then((response) => {
      return res.status(200).json(response.data);
    })
    .catch((err) => {
      return res.status(500).json({ errorMessage: err });
    });
});

router.get("/:apiToken/random", (req, res) => {
  res.setHeader(("Access-Control-Allow-Origin", process.env.ORIGIN));
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
    .catch((err) => res.status(500).json({ errorMessage: err }));
});

router.get("/:apiToken/search/:query", (req, res) => {
  const { apiToken, query } = req.params;
  console.log("query: ", query);
  axios
    .get(
      `https://api.artsy.net/api/search?q=${query}+more:pagemap:metatags-og_type:artwork`,
      {
        headers: {
          "X-XAPP-Token": apiToken,
        },
      }
    )
    .then((response) => {
      res.status(200).json(response.data);
    })
    .catch((err) => res.status(400).json({ errorMessage: err }));
});

router.get("/:apiToken/artist/:id", (req, res) => {
  const { apiToken, id } = req.params;
  axios
    .get(`https://api.artsy.net/api/artworks?artist_id=${id}`, {
      headers: {
        "X-XAPP-Token": apiToken,
      },
    })
    .then((response) => {
      res.status(200).json(response.data);
    })
    .catch((err) => res.status(400).json({ errorMessage: err }));
});

module.exports = router;
