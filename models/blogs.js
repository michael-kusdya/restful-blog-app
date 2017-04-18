var mongoose = require("mongoose");
//var passportLocalMongoose = require("passport-local-mongoose");

var BlogSchema = new mongoose.Schema({
    title: String,
    image: String,
    body: String,
    created: {
        type: Date,
        default: Date.now
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

//BlogSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("Blog", BlogSchema);
