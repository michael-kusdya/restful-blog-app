var express = require("express"),
    uri = "mongodb+srv://michael:17061995Jkt@blogapp.fppv0.mongodb.net/blogapp?retryWrites=true&w=majority",
    expressSanitizer = require("express-sanitizer"),
    app = express(),
    methodOverride = require("method-override"),
    mongoose = require("mongoose"),
    passport = require("passport"),
    localStrategy = require("passport-local"),
    bodyParser = require("body-parser"),
    flash = require("connect-flash"),
    User = require("./models/user"),
    Blog = require("./models/blogs");

//App config
// mongoose.connect("mongodb://localhost/restful_blog_app_v2");
// mongoose.connect("mongodb://michael:17061995@ds159670.mlab.com:59670/blogapp");
mongoose.connect(uri).catch((error) => { console.log(error); });;
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));
app.use(flash());

//Passport config
app.use(require("express-session")({
    secret: "blah",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
});

//RESTful Routes

app.get("/", function (req, res) {
    res.redirect("/blogs");
});

//Index route
app.get("/blogs", function (req, res) {
    Blog.find({}, function (err, blogs) {
        if (err) {
            console.log("Error");
        } else {
            res.render("index", {
                blogs: blogs
            });
        }
    });
});

//New Route
app.get("/blogs/new", isLoggedIn, function (req, res) {
    res.render("new");
});

//Create Route
app.post("/blogs", isLoggedIn, function (req, res) {
    req.body.blog.body = req.sanitize(req.body.blog.body);
    var title = req.body.blog.title;
    var image = req.body.blog.image
    var body = req.body.blog.body;
    var created = req.body.blog.created;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    var newPost = {
        title: title,
        image: image,
        body: body,
        created: created,
        author: author
    };
    Blog.create(newPost, function (err, newBlog) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success", "Post Created Successfully")
            res.redirect("/blogs");
        }
    });
});

//Show route
app.get("/blogs/:id", function (req, res) {
    Blog.findById(req.params.id, function (err, foundBlog) {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.render("show", {
                blog: foundBlog
            });
        }
    });
});

//Edit Route
app.get("/blogs/:id/edit", checkPostOwner, function (req, res) {
    Blog.findById(req.params.id, function (err, foundBlog) {
        res.render("edit", {
            blog: foundBlog
        });
    });
});

//Update route
app.put("/blogs/:id", checkPostOwner, function (req, res) {
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function (err, updatedBlog) {
        if (err) {
            res.redirect("/blogs");
        } else {
            req.flash("success", "Post Edited");
            res.redirect("/blogs/" + req.params.id);
        }
    });
});

//Delete ROute
app.delete("/blogs/:id", checkPostOwner, function (req, res) {
    Blog.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            res.redirect("/blogs");
        } else {
            req.flash("success", "Post Deleted");
            res.redirect("/blogs")
        }
    });
});

//Auth route
app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function (req, res) {
    var newUser = new User({
        username: req.body.username
    });
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            req.flash("error", err.message);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Your user registration was successful, Welcome " + user.username);
            res.redirect("/blogs");
        });
    });
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/blogs",
    failureRedirect: "/login"
}));

app.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "Logged out successfuly");
    res.redirect("/blogs");
});

//middleware
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        req.flash("error", "You must login before you can do that!");
        res.redirect("/login");
    }
}

function checkPostOwner(req, res, next) {
    if (req.isAuthenticated()) {
        Blog.findById(req.params.id, function (err, foundBlog) {
            if (err) {
                req.flash("error", "Post Not Found");
                res.redirect("back");
            } else {
                if (foundBlog.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "Permission Denied");
                    res.redirect("back");
                }
            };
        });
    } else {
        req.flash("error", "You must login before you can do that!")
        res.redirect("back");
    }
}

app.listen(process.env.PORT, process.env.IP, function () {
    console.log("Server Running");
});

