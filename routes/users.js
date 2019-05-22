const express    = require('express'),
      router     = express.Router(),
      User       = require('../models/user'),
      Campground = require('../models/campground'),
      middleware = require('../middleware');

//Show User profile
router.get('/:id', (req, res) =>{
    User.findById(req.params.id, (err, foundUser) =>{
        if(err) {
            req.flash('error', 'Something went wrong.');
            res.redirect('/');
        }
        Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds){
            if(err) {
                req.flash('error', 'Something went wrong.');
                res.redirect('/');
            }
        res.render('users/show', {user: foundUser, campgrounds: campgrounds});
        });
    });
});

// middleware.checkProfileOwnership
// Edit User route
router.get('/:id/edit', middleware.checkProfileOwnership, (req, res) =>{
    User.findById(req.params.id, (err, foundUser) =>{
        if(err) {
            req.flash('error', 'Something went wrong');
            res.redirect('back');
        }
        res.render('users/edit', {user: foundUser});
    });
});

// Update user route
router.put('/:id', (req, res) =>{
    User.findByIdAndUpdate(req.params.id, req.body.user, (err, foundUser) =>{
        if(err){
            req.flash('error', 'You do not have permission to edit that profile');
            res.redirect('back');
        } else {
            req.flash('success', "Successfully Updated!");
            res.redirect('/users/'+foundUser._id);
        }
    });
});

module.exports = router;