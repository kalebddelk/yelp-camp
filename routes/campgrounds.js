const express    = require('express'),
      router     = express.Router(),
      Campground = require('../models/campground'),
      middleware = require('../middleware');

// INDEX: Display list of all campgrounds
router.get('/', (req, res) =>{
    // Get all campgrounds from DB
    Campground.find({}, (err, campgrounds) =>{
        if(err){
            console.log(err);
        } else {
            res.render('campgrounds/index', {campgrounds: campgrounds, page: 'campgrounds'});
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get('/:id/edit', middleware.checkCampgroundOwnership, (req, res) =>{
    Campground.findById(req.params.id, (err, foundCampground) =>{
        res.render('campgrounds/edit', {campground: foundCampground});
    });
});

// UPDATE CAMPGROUND ROUTE
router.put('/:id', middleware.checkCampgroundOwnership, (req, res) =>{
    //find and update the correct campground
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, updatedCampground) =>{
        if(err){
            res.redirect('/campgrounds');
        } else {
            //redirect somewhere(show page)
            res.redirect('/campgrounds/'+ req.params.id);
        }
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete('/:id', middleware.checkCampgroundOwnership, (req, res) =>{
    Campground.findByIdAndRemove(req.params.id, (err) =>{
        if(err){
            res.redirect('/campgrounds');
        } else {
            res.redirect('/campgrounds');
        }
    });
});

// CREATE: Add new campground to DB
router.post('/', middleware.isLoggedIn, (req, res) =>{
    let name = req.body.name;
    let price = req.body.price;
    let image = req.body.image;
    let desc = req.body.description;
    let author = {
        id: req.user._id,
        username: req.user.username
    };
    let newCampground= {name: name, price: price, image: image, description: desc, author: author};
    // Create a new campground and save to DB
    Campground.create(newCampground, (err, newlyCreated) =>{
        if(err){
            alert("X Cannot be blank!");
        } else {
            console.log(newlyCreated);
            res.redirect('/campgrounds');
        }
    });
});

// NEW: Display form to make a new campground
router.get('/new', middleware.isLoggedIn, (req, res) =>{
    res.render('campgrounds/new');
});

// SHOW: shows more info about one campground
router.get('/:id', (req, res) =>{
    //find campground with provided ID
    Campground.findById(req.params.id).populate('comments').exec((err, foundCampground) =>{
       if(err || !foundCampground){
           req.flash('error', 'Campground not found');
           res.redirect('back');
       } else {
           console.log(foundCampground);
    //render show template with relevant information
           res.render('campgrounds/show', {campground: foundCampground});
       }
    });
});

module.exports = router;