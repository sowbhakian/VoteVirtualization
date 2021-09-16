const express = require("express");
const app = express();

app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));
app.set('view engine', 'ejs');


app.get("/", function(req, res) {
    res.render("index");
});

app.get("/enroll", function(req, res) {
    res.render("enroll");
});

app.get("/signin", function(req, res) {
    res.render("signin");
});

app.get("/Discussion", function(req, res) {
    res.render("discuss");
});

app.listen(9000, function() {
    console.log("Server running in 9000")
});