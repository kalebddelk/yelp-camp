const express    = require('express'),
      router     = express.Router(),
      passport   = require('passport'),
      User       = require('../models/user'),
      Campground = require('../models/campground'),
      async      = require('async'),
      nodemailer = require('nodemailer'),
      crypto      = require('crypto');

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
        failureRedirect: '/login',
        failureFlash: true,
        successFlash: 'Welcome to YelpCamp!'
    })
);

//logout route
router.get('/logout', (req, res) =>{
    req.logout();
    req.flash('success', 'Logged you out!');
    res.redirect('/campgrounds');
});

//forgot password
router.get('/forgot', (req, res) =>{
    res.render('forgot');
});

router.post('/forgot', (req, res, next) =>{
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
              let token = buf.toString('hex');
              done(err, token);
            });
        },
        function(token, done) {
            User.findOne({email:req.body.email}, function(err, user) {
                if (!user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                } else if (err) {
                    console.log(err);
                    req.flash('error', 'An unknown error has occured');
                    return res.redirect('/forgot');
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; //1 hour
                
                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            let smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'kdd09f@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            let mailOptions = {
                to: user.email,
                from: 'kdd09f@gmail.com',
                subject: 'YelpCamp Password Reset Request',
                text: 'You are receiving this email because you (or someone else) have requested a password reset for your YelpCamp account.\n\n'+
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n'+
                    'https://'+req.headers.host+'/reset/'+token+'\n\n'+
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                req.flash('success', 'An email has been sent to '+user.email+' with further instructions');
                done(err, 'done');
            });
        }
    ], function(err) {
            if (err) return next(err);
            res.redirect('/');
    });
});

router.get('/reset/:token', (req, res) =>{
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, (err, user) => {
        if (err || !user) {
            req.flash('error', 'Password reset token is invalid or has expired');
            return res.redirect('/forgot');
        }
        res.render('reset', {token: req.params.token});
    });
});

router.post('/reset/:token', (req, res) =>{
    async.waterfall([
        function(done) {
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function (err, user) {
                if (err || !user) {
                    req.flash('error', 'Password reset token is invalid or has expired');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function(err) {
                        if(err) {
                            req.flash('error', 'Something went wrong!');
                            res.redirect('back');
                        }
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        user.save(function(err) {
                                    if(err) {
                                    req.flash('error', 'Something went wrong!');
                                    res.redirect('back');
                                }
                            req.logIn(user, function(err) {
                                if(err) {
                                    req.flash('error', 'Something went wrong!');
                                    res.redirect('back');
                                }
                                done(err, user);
                            });
                        });
                    });
                } else {
                    req.flash('error', 'Passwords do not match');
                }
            });
        },
        function(user, done) {
            let smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'kdd09f@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            let mailOptions = {
                to: user.email,
                from: 'kdd09f@gmail.com',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n'+
                    'This is a confirmation that the password for your account: '+user.email+' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('success', 'Success! Your password has been changed');
                done(err);
            });
        }
    ], function (err) {
        if(err) {
            req.flash('error', 'Something went wrong!');
        }
        res.redirect('/campgrounds');
    });
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