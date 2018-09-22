const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//Load Post & Profile Model
const Post = require("../../models/Post");
const Profile = require("../../models/Profile");

const validatePostInput = require("../../validations/post");

// @ route POST api/posts
// @ desc create a post
// @ access Private

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }

    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPost.save().then(post => res.json(post));
  }
);

// @ route GET api/posts
// @ desc get all the posts
// @ access Public

router.get("/", (req, res) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopostsfound: "No Posts Found!" }));
});

// @ route GET api/posts/:id
// @ desc get the post by id
// @ access Public

router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err =>
      res.status(404).json({ nopostsfound: "No Post Found With This Id!" })
    );
});

// @ route DELETE api/posts/:id
// @ desc delete the post by id
// @ access Private

router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          //Check the owner of the post
          if (post.user.toString() !== req.user.id) {
            return res
              .status(401)
              .json({ notauthorized: "User not authorized!" });
          }
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err =>
          res.status(404).json({ postnotfound: "No post found with this id!" })
        );
    });
  }
);

// @ route POST api/posts/like/:id
// @ desc like the post by id
// @ access Private

router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          //Check if the user already liked the post
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyliked: "User already liked this post!" });
          }
          // Add user id to likes array
          post.likes.unshift({ user: req.user.id });
          post.save().then(post => res.json(post));
        })
        .catch(err =>
          res.status(404).json({ postnotfound: "No post found with this id!" })
        );
    });
  }
);

// @ route POST api/posts/unlike/:id
// @ desc unlike the post by id
// @ access Private

router.post(
  "/unlike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          //Check if the user already liked the post
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ notliked: "You haven't yet liked this post" });
          }
          // Get Remove Index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);
          //Splice out of the likes array
          post.likes.splice(removeIndex, 1);
          post.save().then(post => res.json(post));
        })
        .catch(err =>
          res.status(404).json({ postnotfound: "No post found with this id!" })
        );
    });
  }
);

// @ route POST api/posts/comment/:id
// @ desc add comment to a post
// @ access Private

router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validatePostInput(req.body);
    if (!isValid) {
      return res.status(400).json(errors);
    }
    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };
        //Add to the comments array
        post.comments.unshift(newComment);
        //Save
        post.save().then(post => res.json(post));
      })
      .catch(err =>
        res.status(404).json({ postnotfound: "No post is found with this id" })
      );
  }
);

// @ route DELETE api/posts/comment/:id/:comment_id
// @ desc delete a post's comment
// @ access Private

router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        // Check to see if the comment exists
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexisted: "Comment does not exist" });
        }
        //Get the remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);
        //Splice the comment out of the array
        post.comments.splice(removeIndex, 1);
        post.save().then(post => res.json(post));
      })
      .catch(err =>
        res.status(404).json({ postnotfound: "No post is found with this id" })
      );
  }
);

// @ route GET api/users/test
// @ desc Tests posts route
// @ access Public

// router.get("/test", (req, res) => res.json({ msg: "posts work!" }));
module.exports = router;
