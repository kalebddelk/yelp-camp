const Campground = require('../models/campground'),
      Comment    = require('../models/comment'),
      User       = require('../models/user');

// all middleware goes here
const middlewareObj = {};

middlewareObj.checkCampgroundOwnership = (req, res, next) =>{
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, (err, foundCampground) =>{
            if(err || !foundCampground){
                req.flash('error', 'Campground not found');
                res.redirect('back');
            } else {
                //does user own the campground?
                if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                } else {
                    req.flash('error', 'You don\'t have permission to do that');
                    res.redirect('back');
                }
            }
        });
    } else {
        req.flash('error', 'You need to be logged in to do that');
        res.redirect('back');
    }
};


middlewareObj.checkCommentOwnership = (req, res, next) =>{
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, (err, foundComment) =>{
            if(err || !foundComment){
                req.flash('error', 'Comment not found');
                res.redirect('back');
            } else {
                //does user own the comment?
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                } else {
                    req.flash('error', 'You don\'t have permission to do that');
                    res.redirect('back');
                }
            }
        });
    } else {
        req.flash('error', 'You need to be logged in to do that');
        res.redirect('back');
    }
};

// check profile ownership
middlewareObj.checkProfileOwnership = (req, res, next) =>{
    if(req.isAuthenticated()){
        User.findById(req.params.id, (err, foundProfile) =>{
            if(err || !foundProfile){
                req.flash('error', 'User profile not found');
                res.redirect('/campgrounds');
            } else {
                //does user own the profile?
                if(foundProfile._id.equals(req.user._id) || req.user.isAdmin){
                    next();
                } else {
                    req.flash('error', 'You don\'t have permission to do that');
                    res.redirect('/campgrounds');
                }
            }
        });
    } else {
        req.flash('error', 'You need to be logged in to do that');
        res.redirect('back');
    }
};

middlewareObj.isLoggedIn = (req, res, next) =>{
    if(req.isAuthenticated()){
        return next();
    }
    req.flash('error', 'You need to be logged in to do that');
    res.redirect('/login');
};

module.exports = middlewareObj;