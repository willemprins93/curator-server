// routes/auth.routes.js

const { Router } = require("express");
const router = new Router();
const bcryptjs = require("bcryptjs");
const saltRounds = 10;
const User = require("../models/User.model");
const Session = require("../models/Session.model");
const mongoose = require("mongoose");
const Artwork = require("../models/Artwork.model");
const axios = require("axios");

// SIGNUP //
///////////

// .post() route ==> to process form data
router.post("/signup", (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(200).json({
      errorMessage:
        "All fields are mandatory. Please provide your name, email and password.",
    });
    return;
  }

  // make sure passwords are strong:

  const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
  if (!regex.test(password)) {
    res.status(200).json({
      errorMessage:
        "Password needs to have at least 6 characters and must contain at least one number, one lowercase and one uppercase letter.",
    });
    return;
  }

  bcryptjs
    .genSalt(saltRounds)
    .then((salt) => bcryptjs.hash(password, salt))
    .then((hashedPassword) => {
      return User.create({
        name,
        email,
        password: hashedPassword,
      });
    })
    .then((user) => {
      axios
        .post(
          `https://api.artsy.net/api/tokens/xapp_token?client_id=${process.env.ARTSY_CLIENT_ID}&client_secret=${process.env.ARTSY_CLIENT_SECRET}`
        )
        .then((token) => {
          Session.create({
            userId: user._id,
            createdAt: Date.now(),
          }).then((session) => {
            res.status(200).json({
              accessToken: session._id,
              apiToken: token.data.token,
              user,
            });
          });
        });
    })
    .catch((error) => {
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(200).json({ errorMessage: error.message });
      } else if (error.code === 11000) {
        res.status(200).json({
          errorMessage:
            "Email needs to be unique. This email has already been used.",
        });
      } else {
        res.status(500).json({ errorMessage: error });
      }
    });
});

// LOGIN //
//////////

router.post("/login", (req, res, next) => {
  const { email, password } = req.body;

  if (email === "" || password === "") {
    res.status(500).json({
      errorMessage: "Please enter both email and password to login.",
    });
    return;
  }

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        res.status(200).json({
          errorMessage: "Email is not registered. Try with other email.",
        });
        return;
      } else if (bcryptjs.compareSync(password, user.password)) {
        axios
          .post(
            `https://api.artsy.net/api/tokens/xapp_token?client_id=${process.env.ARTSY_CLIENT_ID}&client_secret=${process.env.ARTSY_CLIENT_SECRET}`
          )
          .then((token) => {
            Session.create({
              userId: user._id,
              createdAt: Date.now(),
            }).then((session) => {
              res.status(200).json({
                accessToken: session._id,
                apiToken: token.data.token,
                user,
              });
            });
          });
      } else {
        res.status(200).json({ errorMessage: "Incorrect password." });
      }
    })
    .catch((error) => res.status(500).json({ errorMessage: err }));
});

// LOGOUT //
///////////

router.post("/logout", (req, res) => {
  Session.deleteOne({
    _id: req.body.accessToken,
  })
    .then(() => {
      res.status(200).json({ success: "User was logged out" });
    })
    .catch((error) => res.status(500).json({ errorMessage: error }));
});

// USER PROFILE //
/////////////////

router.post("/user/profile", (req, res) => {
  const { userId } = req.body;
  User.findById(userId)
    .populate({
      path: "artworksLiked",
      populate: {
        path: "artist",
      },
    })
    .then((user) => res.status(200).json(user))
    .catch((err) => res.status(200).json({ errorMessage: err }));
});

router.get("/user/:accessToken", (req, res) => {
  const { accessToken } = req.params;
  Session.findById(accessToken)
    .populate("userId")
    .then((session) => {
      if (!session) {
        res.status(200).json({
          errorMessage: "Session does not exist",
        });
      } else {
        res.status(200).json({
          session,
        });
      }
    })
    .catch((err) => res.status(500).json({ errorMessage: err }));
});

///////////////////////////////////////
// EDIT USER PROFILE OR COLLECTION ///
/////////////////////////////////////

router.post("/user/edit", (req, res) => {
  const { userId, name, email } = req.body;
  User.findByIdAndUpdate(userId, { name, email }, { new: true })
    .then((user) =>
      res.status(201).json({
        success: "User was updated successfully",
        user,
      })
    )
    .catch((err) => res.status(500).json({ errorMessage: err }));
});

router.post("/user/editCollection", (req, res) => {
  const { userId, artworksLiked, artworksRemoved } = req.body;

  User.findByIdAndUpdate(userId, { artworksLiked }, { new: true })
    .then((user) => {
      artworksRemoved.forEach((artworkId) => {
        Artwork.findByIdAndUpdate(artworkId, {
          $pull: { usersLiked: user._id },
        })
          .then(() =>
            res
              .status(200)
              .json({ success: "Artworks and User succesfully updated", user })
          )
          .catch((err) => res.status(500).json({ errorMessage: err }));
      });
    })
    .catch((err) => {
      return res.status(500).json({ errorMessage: err });
    });
});

module.exports = router;
