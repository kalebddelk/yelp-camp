const express    = require('express'),
      router     = express.Router(),
      passport   = require('passport'),
      User       = require('../models/user'),
      Campground = require('../models/campground');

//Root Route
router.get('/', (req, res) =>{
    res.render('landing');
});

//show register form
router.get('/register', (req, res) =>{
    res.render('register', {page: 'register'});
});

//handle sign up logic
router.post('/register', (req, res) =>{
    let newUser = new User({
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email
        });
    if (req.body.adminCode === 'Genie') {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, (err, user) =>{
        if(err){
            console.log(err);
            return res.render('register', {'error': err.message });
        }
        passport.authenticate('local')(req, res, function(){
            req.flash('success', 'Welcome to YelpCamp, '+user.username+'!');
            res.redirect('/campgrounds');
        });
    });
});

//show login form
router.get('/login', (req, res) =>{
    res.render('login', {page: 'login'});
});

//handle login logic
router.post('/login', passport.authenticate('local', 
    {
        successRedirect: '/campgrounds', 
        failureRedirect: '/login'
    }), (req, res) =>{
    
});

//logout route
router.get('/logout', (req, res) =>{
    req.logout();
    req.flash('success', 'Logged you out!');
    res.redirect('/campgrounds');
});

//user profiles
router.get('/users/:id', (req, res) =>{
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

module.exports = router;