const express    = require('express'),
      router     = express.Router(),
      Campground = require('../models/campground'),
      middleware = require('../middleware');

const NodeGeocoder = require('node-geocoder');
 
const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
const geocoder = NodeGeocoder(options);

// INDEX: Display list of all campgrounds
router.get('/', (req, res) =>{
    let noMatch = null;
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        Campground.find({name: regex}, (err, allCampgrounds) =>{
            if(err){
                console.log(err);
            } else if(allCampgrounds.length<1) {
                noMatch = 'No campgrounds match that query. Please try again.';
            }
            res.render('campgrounds/index', {campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch});
        });
    } else {
        // Get all campgrounds from DB
        Campground.find({}, (err, allCampgrounds) =>{
            if(err){
                console.log(err);
            } else {
                res.render('campgrounds/index', {campgrounds: allCampgrounds, page:'campgrounds', noMatch: noMatch});
            }
        });
    }
});

// EDIT CAMPGROUND ROUTE
router.get('/:id/edit', middleware.checkCampgroundOwnership, (req, res) =>{
    Campground.findById(req.params.id, (err, foundCampground) =>{
        if(err) {
            req.flash('error', 'Something went wrong!');
            res.redirect('back');
        }
        res.render('campgrounds/edit', {campground: foundCampground});
    });
});

// UPDATE CAMPGROUND ROUTE
router.put('/:id', middleware.checkCampgroundOwnership, (req, res) =>{
    geocoder.geocode(req.body.campground.location, (err, data) =>{
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        Campground.findByIdAndUpdate(req.params.id, req.body.campground, (err, updatedCampground) =>{
            if(err){
                req.flash('error', err.message);
                res.redirect('back');
            } else {
                req.flash('success', "Successfully Updated!");
                res.redirect('/campgrounds/'+updatedCampground._id);
            }
        });
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
    console.log(req.body);
    let name = req.body.name;
    let price = req.body.price;
    let image = req.body.image;
    let desc = req.body.description;
    let author = {
        id: req.user._id,
        username: req.user.username
    };
    geocoder.geocode(req.body.location, (err, data)=>{
        if (err || data.status === 'ZERO_RESULTS'){
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        let lat = data[0].latitude;
        let lng = data[0].longitude;
        let location = data[0].formattedAddress;
        let newCampground = {name: name, price: price, image: image, description: desc, author: author, location: location, lat: lat, lng: lng};
        Campground.create(newCampground, (err, newlyCreated) =>{
            if(err){
                console.log(err);
            } else {
                res.redirect('/campgrounds/'+newlyCreated._id);
            }
        });
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
    //render show template with relevant information
           res.render('campgrounds/show', {campground: foundCampground});
       }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = router;