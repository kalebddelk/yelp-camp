const express    = require('express'),
      router     = express.Router({mergeParams: true}),
      Campground = require('../models/campground'),
      Comment    = require('../models/comment'),
      middleware = require('../middleware');

//Comments New
router.get('/new', middleware.isLoggedIn, (req, res) =>{
    //find campground by id
    Campground.findById(req.params.id, (err, campground) =>{
        if(err){
            console.log(err);
        } else {
            res.render('comments/new', {campground: campground});
        }
    });
});

//Comments Create
router.post('/', middleware.isLoggedIn, (req, res) =>{
    Campground.findById(req.params.id, (err, campground) =>{
        if(err){
            console.log(err);
            res.redirect('/campgrounds');
        } else {
            Comment.create(req.body.comment, (err, comment) =>{
                if(err){
                    req.flash('error', 'Something went wrong');
                    console.log(err);
                } else {
                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //save comment
                    comment.save();
                    campground.comments.push(comment);
                    campground.save();
                    console.log(comment);
                    req.flash('success', 'successfully added comment');
                    res.redirect('/campgrounds/'+campground._id);
                }
            });
        }
    });
});

//Comments Edit
router.get('/:comment_id/edit', middleware.checkCommentOwnership, (req, res) =>{
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err || !foundCampground) {
            req.flash('error', 'No campground found');
            return res.redirect('back');
        }
        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if(err){
                res.redirect('back');
            } else {
            res.render('comments/edit', {campground_id: req.params.id, comment: foundComment});
            }
        });
    });
});

//Comment Update
router.put('/:comment_id', middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) => {
        if(err) {
            res.redirect('back');
        } else {
            res.redirect('/campgrounds/'+req.params.id);
        }
    });
});

//Comment Destroy
router.delete('/:comment_id', middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndRemove(req.params.comment_id, (err) => {
        if(err) {
            res.redirect('back');
        } else {
            req.flash('success', 'Comment deleted');
            res.redirect('/campgrounds/'+req.params.id);
        }
    });
});

module.exports = router;