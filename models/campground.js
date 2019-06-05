const mongoose = require('mongoose'),
      Comment = require('./comment');

//SCHEMA SETUP
const campgroundSchema = new mongoose.Schema({
    name: String,
    price: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: {type: Date, default: Date.now},
    image: {
        id: String,
        url: String
    },    
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        username: String
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:'Comment'
        }
    ]
});

campgroundSchema.pre('remove', async function(){
    await Comment.remove({
        _id: {
            $in: this.comments
        }
    });
});

module.exports = mongoose.model('Campground', campgroundSchema);