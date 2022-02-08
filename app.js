const express = require("express");
const mongoose = require("mongoose");
const _ = require('lodash');
const app = express();

const session = require("express-session")
const flash = require("connect-flash");
const { Cookie } = require("express-session");
const e = require("connect-flash");


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
const options = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
};
const dateSchema = new mongoose.Schema({
    votingStart: Date,
    votingEnd: Date,
    enrollEnd: Date,
});
const FixDate = mongoose.model("Date", dateSchema) //Collection-1

//message-Discussion-S2
const discussionSchema = new mongoose.Schema({
    userName: String,
    message: String
});
const SendMsg = mongoose.model("Discuss", discussionSchema) //Collection-2

//Signup/Login-Login-S3
var disName;
var email_Id;
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

    let finalDateEnroll;
    let finalDateVoting;
    const today = new Date();
    const displaydate = today.toLocaleDateString("en-US", options)
    FixDate.find({}, (err, output) => {
        // console.log(output);
        if (!err) {
            // output[0].votingStart
            finalDateVoting = output[0].votingEnd.toLocaleDateString("en-US", options)
            finalDateEnroll = output[0].enrollEnd.toLocaleDateString("en-US", options)
            res.render("index", { Displaydate: displaydate, FinalDateEnroll: finalDateEnroll, FinalDateVoting: finalDateVoting, DisName: disName });
        }
    })


});

app.get("/enroll", function(req, res) {
    if (disName == undefined) {
        res.redirect("/signin")
    } else {

        Nominee.find({}, (err, output) => {
            if (!err) {
                // console.log(output);
                res.render("enroll", { DisName: disName, Email_Id: email_Id, message: " ", partySymbol: output });
            }
        })
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
    if (disName == undefined) {
        res.redirect("/signin")
    } else {
        SendMsg.find({}, (err, outArray) => {
            if (!err) {
                res.render("discuss", { Messages: outArray, DisName: disName });
            }
        })
    }
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
    var Ests;
    var Vsts;
    var flag = false;
    var partySymbol = [];
    //Status-Name
    EnrollS.find({}, (err, output) => {
        // console.log(output);
        if (!err) {
            output.forEach(e => {
                // console.log(e.Votingstatus, e.Enrollstatus, e.email, email_Id, disName);
                // console.log(e.email, disName);
                if (e.email === disName) {
                    Ests = e.Enrollstatus;
                    Vsts = e.Votingstatus;
                    flag = true;
                }
            });
            if (output.length == 0)
                flag = true;
            if (flag) {
                Nominee.find({}, (err, output) => {
                    console.log();
                    if (!err) {
                        FixDate.find({}, (er, output1) => {
                            if (!er) {
                                endDate = output1[0].votingEnd.toLocaleDateString("en-US", options)
                                res.render("vote", { DisName: disName, Ests: Ests, Vsts: Vsts, partySymbol: output, endDate: endDate });
                            }
                        })

                    }
                })
            } else {
                Nominee.find({}, (err, output) => {
                    if (!err) {
                        res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Voter Not Enrolled!", partySymbol: output });
                    }
                })
            }

        }



    })
});

app.post("/votersInfo", (req, res) => {
    var aadhar = req.body.aadhar;
    var mailId = req.body.emailid;
    var Enrollstatus = "Enrolled";
    var votingstatus = "Not Yet";
    var cheak = true;

    Nominee.find({}, (err, output) => {

        if (aadhar.length == 0) {
            res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Failed! Voters No Aadhar No. voters", partySymbol: output });
        } else if (aadhar.length != 12) {
            res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Failed! Voters wrong Aadhar No.", partySymbol: output });
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
                        res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Success Voters", partySymbol: output });
                    } else {
                        res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Failed! Voters", partySymbol: output });
                    }
                }
            })
        }
    })


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

    var errormsg;

    Nominee.find({}, (err, output1) => {

        if (aadhar.length == 0) {
            res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Failed! Voters No Aadhar No.", partySymbol: output1 });
        } else if (aadhar.length != 12) {
            res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Failed! Voters wrong Aadhar No.", partySymbol: output1 });
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
                    // console.log(errormsg);
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
                        Nomineesave.save((e) => {
                            //After saving to render
                            if (!e) {
                                Nominee.find({}, (err, out) => {
                                    if (!err) {
                                        res.render("enroll", { DisName: disName, Email_Id: email_Id, message: "Enrollment Success Nominee", partySymbol: out });
                                    }
                                })
                            }
                        });

                    } else {
                        res.render("enroll", { DisName: disName, Email_Id: email_Id, message: errormsg, partySymbol: output1 });
                    }
                }
            })
        }
    })
})




//Admin
app.get("/adminLogin", (req, res) => {
    res.render("adminLogin", { err: "" })
})

app.get("/adminUpdate", (req, res) => {
    res.render("adminUpdate", { err: "" });
})

app.get("/adminDetails", (req, res) => {

    res.render("adminDetails");
})

app.post("/adminCheck", (req, res) => {
    var name = req.body.userName;
    var pass = req.body.password;
    if (name === "admin") {
        if (pass === "admin") {
            res.redirect("/adminDetails")
        } else {
            res.render("adminLogin", { err: "Invalid Password!" })
        }
    } else {
        res.render("adminLogin", { err: "Invalid UserID!" })
    }
})

app.post("/adminDateCheck", (req, res) => {
    var vStart = req.body.votingStart
    var vEnd = req.body.votingEnd
    var eEnd = req.body.enrollEnd

    if (vStart < vEnd && eEnd < vEnd && vStart < eEnd) {


        const dateUpdate = new FixDate({
            votingStart: vStart,
            votingEnd: vEnd,
            enrollEnd: eEnd,
        });

        FixDate.deleteMany({}, (err, data) => {
            if (!err) {
                dateUpdate.save((err) => {
                    res.render("adminUpdate", { err: "Successfully Updated!" });
                });
            }
        })

    } else {
        res.render("adminUpdate", { err: "Enter the Valid Date!" });
    }
})


app.listen(9000, function() {
    console.log("Server running in 9000")
});