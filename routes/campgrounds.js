const express    = require('express'),
      router     = express.Router(),
      Campground = require('../models/campground'),
      middleware = require('../middleware'),
      multer     = require('multer');
      
const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({ storage: storage, fileFilter: imageFilter});

const cloudinary = require('cloudinary').v2;
cloudinary.config({ 
  cloud_name: 'kalebddelk', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

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
router.put('/:id', middleware.checkCampgroundOwnership, upload.single('campground[image]'), (req, res) =>{
    geocoder.geocode(req.body.campground.location, (err, data) =>{
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        Campground.findByIdAndUpdate(req.params.id, req.body.campground, async function(err, foundCampground){
            if(err){
                req.flash('error', err.message);
                res.redirect('back');
            } else {
                if (req.file) {
                    try {
                        await cloudinary.uploader.destroy(foundCampground.image.id);
                        let result = await cloudinary.uploader.upload(req.file.path);
                        foundCampground.image.id = result.public_id;
                        foundCampground.image.url = result.secure_url;
                    } catch(err) {
                        req.flash('error', err.message);
                        return res.redirect('back');
                    }
                }
                foundCampground.name = req.body.campground.name;
                foundCampground.description = req.body.campground.description;
                foundCampground.save();
                req.flash('success', "Successfully Updated!");
                res.redirect('/campgrounds/'+foundCampground._id);
            }
        });
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete('/:id', middleware.checkCampgroundOwnership, (req, res) =>{
    Campground.findByIdAndRemove(req.params.id, async function(err, campground){
        if(err){
            req.flash('error', err.message);
            res.redirect('/campgrounds');
        }
        try {
            await cloudinary.uploader.destroy(campground.image.id);
            campground.remove();
            req.flash('success', 'Campground deleted successfully!');
            res.redirect('/campgrounds');
        } catch(err) {
            if(err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
        }
    });
});

// CREATE: Add new campground to DB
router.post('/', middleware.isLoggedIn, upload.single('campground[image]'), (req, res) =>{
    geocoder.geocode(req.body.campground.location, (err, data)=>{
        if (err || data.status === 'ZERO_RESULTS'){
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var name = req.body.campground.name;
        var price = req.body.campground.price;
        var desc = req.body.campground.description;
        var author = {
            id: req.user._id,
            username: req.user.username
        };
        cloudinary.uploader.upload(req.file.path, (err, result) =>{
            if(err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            var image = {
                id: result.public_id,
                url: result.secure_url
            };
            let newCampground = {name: name, price: price, image: image, description: desc, author: author, location: location, lat: lat, lng: lng};
            Campground.create(newCampground, (err, newlyCreated) =>{
                if(err){
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                res.redirect('/campgrounds/'+newlyCreated._id);
            });
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