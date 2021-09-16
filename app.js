const express = require("express");
const mongoose = require("mongoose");
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/DeployVotes", { useNewUrlParser: true });

//Date-IndexPage-S1
let finalDateEnroll;
let finalDateVoting;
const dateSchema = new mongoose.Schema({
    FinalDateEnroll: String,
    FinalDateVoting: String
});
const FixDate = mongoose.model("Date", dateSchema) //Collection-1

//message-Discussion-S2
const discussionSchema = new mongoose.Schema({
    userName: String,
    message: String
});
const SendMsg = mongoose.model("Discuss", discussionSchema) //Collection-2

//Signup/Login-Login-s3
const voterSchema = new mongoose.Schema({
    Name: String,
    mailId: String,
    password: String,
    phoneNumber: String
});
const Voter = mongoose.model("Voter", voterSchema) //Collection-3


app.get("/", function(req, res) {


    // display date
    const today = new Date();
    const options = {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    };
    const displaydate = today.toLocaleDateString("en-US", options)


    FixDate.find({}, (err, output) => {
        if (!err) {
            // console.log(output)
            if (output.length === 0) {

                // enroll last date
                var endDate = new Date("06/11/2021")
                endDate.setDate(endDate.getDate());
                var year = endDate.getFullYear();
                var mes = endDate.getMonth() + 1;
                var dia = endDate.getDate();
                finalDateEnroll = dia + "-" + mes + "-" + year;
                // console.log(finalDateEnroll)

                // voting last date
                var endDate = new Date("08/12/2021")
                var year = endDate.getFullYear();
                var mes = endDate.getMonth() + 1;
                var dia = endDate.getDate();
                finalDateVoting = dia + "-" + mes + "-" + year;
                // console.log(finalDateVoting)

                const setDate = new FixDate({
                    FinalDateEnroll: finalDateEnroll,
                    FinalDateVoting: finalDateVoting
                })
                setDate.save();

            } else {
                output.forEach(element => {
                    finalDateEnroll = element.FinalDateEnroll;
                    finalDateVoting = element.FinalDateVoting;
                });

            }

            res.render("index", { Displaydate: displaydate, FinalDateEnroll: finalDateEnroll, FinalDateVoting: finalDateVoting });
        }
    })

});




app.get("/enroll", function(req, res) {
    res.render("enroll");
});




app.get("/signin", function(req, res) {
    res.render("signin");
});

app.post("/signup", function(req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const pass = req.body.password;
    const ph = req.body.phonenumber;

    Voter.findOne({ email: email }, (err, output) => {
        if (!err) {
            if (output) {
                // alert("Already Exist!")
                console.log("MailId Already Exist!")
            } else {
                const newVoter = new Voter({
                    Name: name,
                    mailId: email,
                    password: pass,
                    phoneNumber: ph
                })

                newVoter.save((err) => {
                    if (!err) {
                        res.redirect("/signin");
                    }
                })
            }
        }
    })

});

// Declaration
let disName;
app.post("/login", function(req, res) {
    const email = req.body.email;
    const pass = req.body.password;

    Voter.findOne({ email: email }, (err, output) => {
        if (!err) {

            console.log(output);
            if (output) {
                disName = output.name
                console.log(output.name);
            }

        }
    })

    // console.log(email, pass);
});





app.get("/Discussion", function(req, res) {
    SendMsg.find({}, (err, outArray) => {
        if (!err) {
            res.render("discuss", { Messages: outArray });
        }
    })
});

app.post("/discuss", function(req, res) {
    const emailId = req.body.emailid;
    const msg = req.body.message;

    //Saves to DB
    const pushmsg = new SendMsg({
        userName: emailId,
        message: msg
    })
    pushmsg.save();

    res.redirect("/Discussion");
});



app.listen(9000, function() {
    console.log("Server running in 9000")
});