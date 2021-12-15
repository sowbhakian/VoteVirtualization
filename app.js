const express = require("express");
const mongoose = require("mongoose");
const _ = require('lodash');
const app = express();

const session = require("express-session")
const flash = require("connect-flash");
const { Cookie } = require("express-session");


app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }))
app.use(express.static("public"));

app.use(session({
    secret: 'secret',
    Cookie: { maxAge: 60000 },
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

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

//Signup/Login-Login-S3
let disName;
let email_Id;
const voterSchema = new mongoose.Schema({
    Name: String,
    mailId: String,
    password: String,
    phoneNumber: String
});
const Voter = mongoose.model("Voter", voterSchema) //Collection-3

//Enroll-details-S4 
var symbolsList = [];
const nomineeSchema = new mongoose.Schema({
    aadharNo: Number,
    emailId: String,
    degree: String,
    address: String,
    age: Number,
    partName: String,
    symbol: String
})
const Nominee = mongoose.model("Nominee", nomineeSchema) //Collection-4

//Voters Enrollment
const voterEnrollmentSchema = new mongoose.Schema({
    aadharNo: Number,
    email: String,
    Enrollstatus: String,
    Votingstatus: String
});
const EnrollS = mongoose.model("EnrollStatus", voterEnrollmentSchema) //Collection-5

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

            res.render("index", { Displaydate: displaydate, FinalDateEnroll: finalDateEnroll, FinalDateVoting: finalDateVoting, DisName: disName });
        }
    })

});

app.get("/enroll", function(req, res) {
    if (disName == undefined) {
        res.redirect("/signin")
    } else {
        res.render("enroll", { DisName: disName, Email_Id: email_Id, message: " " });
    }
});

app.get("/signin", function(req, res) {
    res.render("signin", { DisName: disName, message: req.flash('message') });
});

app.post("/signup", function(req, res) {
    const name = req.body.name;
    //email = userID
    const email = _.lowerCase(req.body.email);
    const pass = req.body.password;
    const ph = req.body.phonenumber;
    let check = false;

    Voter.find({}, (err, output) => {
        if (!err) {

            output.forEach(output => {
                if (output.mailId == email) {
                    check = true
                    res.render("signin", { DisName: disName, message: "User-Id already Exist!" });
                }
            })
            if (!check) {
                const newVoter = new Voter({
                    Name: name,
                    mailId: email,
                    password: pass,
                    phoneNumber: ph
                })

                newVoter.save((err) => {
                    if (!err) {
                        res.render("signin", { DisName: disName, message: "Successfully Signed up!" });
                    }
                })
            }
        }
    })

});


app.post("/login", function(req, res) {
    const email = _.lowerCase(req.body.email);
    const pass = req.body.password;
    let mailCheck = false;

    Voter.find({}, (err, output1) => {
        if (!err) {
            // console.log(output1);
            if (output1) {

                output1.forEach(output => {
                    if (output.mailId === email) {
                        if (output.password === pass) {
                            disName = output.Name
                            email_Id = output.mailId
                            res.redirect("/enroll")
                        } else {
                            // console.log("In Pass Fail");
                            res.render("signin", { DisName: disName, message: "Incorrect Password!" });
                        }
                        mailCheck = true;
                    }
                });

                if (mailCheck === false) {
                    res.render("signin", { DisName: disName, message: "Invalid UserId" });
                }

            }
        }
    })
});



app.get("/Discussion", function(req, res) {

    SendMsg.find({}, (err, outArray) => {
        if (!err) {
            res.render("discuss", { Messages: outArray, DisName: disName });
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


app.get("/vote", function(req, res) {
    res.render("vote")
});

app.post("/votersInfo", (req, res) => {
    var aadhar = req.body.aadhar;
    var mailId = req.body.emailid;
    var Enrollstatus = "Enrolled";
    var votingstatus = "Not Yet";
    var cheak = true;

    if (aadhar.length == 0) {
        res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Failed! Voters No Aadhar No. voters" });
    } else if (aadhar.length != 12) {
        res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Failed! Voters wrong Aadhar No." });
    } else {
        EnrollS.find({}, { aadharNo: 1 }, (err, output) => {
            if (!err) {
                output.forEach(e => {
                    if (e.aadharNo == aadhar) {
                        cheak = false;
                    }
                });

                if (cheak) {
                    const Enrollstatussave = new EnrollS({
                        aadharNo: aadhar,
                        email: mailId,
                        Enrollstatus: Enrollstatus,
                        Votingstatus: votingstatus
                    })
                    Enrollstatussave.save()
                    res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Success Voters" });
                } else {
                    res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Failed! Voters" });
                }
            }
        })
    }


})

app.post("/nomineeInfo", (req, res) => {
    var aadhar = req.body.aadhar;
    var mailId = req.body.emailid;
    var degree = req.body.degree;
    var address = req.body.address;
    var age = req.body.age;
    var partName = req.body.partName;
    var symbol = req.body.symbol;
    cheak = true;

    // Nomineestatussave.save((err) => {
    //     if (!err) {
    //         res.redirect("enroll");
    //         res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Success Voters" });
    //     }
    // })


    var errormsg;

    if (aadhar.length == 0) {
        res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Failed! Voters No Aadhar No." });
    } else if (aadhar.length != 12) {
        res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Failed! Voters wrong Aadhar No." });
    } else {
        Nominee.find({}, (err, output) => {
            if (!err) {

                output.forEach(e => {
                    if (e.aadharNo == aadhar) {
                        cheak = false;
                        errormsg = "Enrollment Failed! Same Aadhar Number!"
                    }
                    if (e.partName == partName) {
                        cheak = false;
                        errormsg = "Enrollment Failed! Same Party Name!"
                    }
                    if (e.symbol == symbol) {
                        cheak = false;
                        errormsg = "Enrollment Failed! Same Party Symbol!"
                    }

                });
                console.log(errormsg);
                if (cheak) {
                    const Nomineesave = new Nominee({
                        aadharNo: aadhar,
                        emailId: mailId,
                        degree: degree,
                        address: address,
                        age: age,
                        partName: partName,
                        symbol: symbol
                    })
                    Nomineesave.save()
                    res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Success Nominee" });
                } else {
                    res.render("enroll", { DisName: disName, Email_Id: email_Id, message: errormsg });
                }
            }
        })
    }

})


app.listen(9000, function() {
    console.log("Server running in 9000")
});