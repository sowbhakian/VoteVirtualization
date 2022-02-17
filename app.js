const express = require("express");
const mongoose = require("mongoose");
const _ = require('lodash');
const app = express();

const session = require("express-session")
const flash = require("connect-flash");
const { Cookie } = require("express-session");
const e = require("connect-flash");
const { redirect } = require("express/lib/response");


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
var todayObj = new Date();
today = todayObj.toLocaleDateString("en-US", options)

const dateSchema = new mongoose.Schema({
    votingStart: Date,
    votingEnd: Date,
    enrollEnd: Date,
});
const FixDate = mongoose.model("Date", dateSchema) //Collection-1

//message-Discussion-S2
const discussionSchema = new mongoose.Schema({
    userid: String,
    message: String
});
const SendMsg = mongoose.model("Discuss", discussionSchema) //Collection-2

//Signup/Login-Login-S3
var disName;
var userid;
const voterSchema = new mongoose.Schema({
    Name: String,
    mailId: String, //userID - Unique
    password: String,
    phoneNumber: String,
    UserMailId: String //mailid
});
const Voter = mongoose.model("Voter", voterSchema) //Collection-3

//Enroll-details-S4 
const nomineeSchema = new mongoose.Schema({
    aadharNo: Number,
    emailId: String,
    degree: String,
    address: String,
    age: Number,
    partName: String, //unique
    symbol: String,
    userid: String, //unique
    vote: { type: Number, default: 0 }
})
const Nominee = mongoose.model("Nominee", nomineeSchema) //Collection-4

//Voters Enrollment
const voterEnrollmentSchema = new mongoose.Schema({
    aadharNo: Number,
    userid: String, //unique
    Enrollstatus: String,
    Votingstatus: String
});
const EnrollS = mongoose.model("EnrollStatus", voterEnrollmentSchema) //Collection-5

//VoterList
const VoteListSchema = new mongoose.Schema({
    userid: String, //unique
    Enrollstatus: String,
    Votingstatus: String
});
const VoteList = mongoose.model("VoteList", VoteListSchema) //Collection-5

var DBVstart;
var DBEend;
var DBVend;

app.get("/", function(req, res) {
    FixDate.find({}, (err, dates) => {
        // DBVstart = dates[0].votingStart.toLocaleDateString("en-US", options);
        DBVstart = dates[0].votingStart;
        DBEend = dates[0].enrollEnd;
        DBVend = dates[0].votingEnd;
        if (todayObj < DBVstart) {
            // console.log("Enroll Not Open");
        } else if (DBVstart <= todayObj && todayObj <= DBEend) {
            // console.log("Enroll open");
        } else if (DBEend < todayObj && todayObj <= DBVend) {
            // console.log("Voting Open");
        } else if (DBVend < todayObj) {
            // console.log("Voting Close");
        }
    })

    FixDate.find({}, (err, output) => {
        // console.log(output);
        if (!err) {
            // output[0].votingStart
            if (DBEend != undefined && DBVend != undefined) {
                var endE = DBEend.toLocaleDateString("en-US", options);
                var endV = DBVend.toLocaleDateString("en-US", options);
                res.render("index", { Displaydate: today, FinalDateEnroll: endE, FinalDateVoting: endV, DisName: disName });
            } else {
                var update = "Need To Be updated!"
                res.render("index", { Displaydate: today, FinalDateEnroll: update, FinalDateVoting: update, DisName: disName });
            }
        }
    })


});


app.post("/enroll", function(req, res) {
    console.log(req.body);
    if (disName == undefined) {
        res.redirect("/signin")
    } else {
        Nominee.find({}, (err, output) => {
            if (!err) {
                res.render("enroll", { DisName: disName, userid: userid, message: " ", partySymbol: output });
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
    const UserMailId = req.body.UserMailId;
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
                    phoneNumber: ph,
                    UserMailId: UserMailId
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
                            userid = output.mailId

                            Nominee.find({}, (err, output) => {
                                if (!err) {
                                    // console.log(email);
                                    res.render("enroll", { DisName: disName, userid: email, message: " ", partySymbol: output });
                                }
                            })

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


app.post("/Discussion", function(req, res) {
    if (userid == undefined) {
        res.redirect("/signin")
    } else {
        SendMsg.find({}, (err, outArray) => {
            if (!err) {
                res.render("discuss", { Messages: outArray, userid: userid, DisName: disName });
            }
        })
    }
});

app.post("/discuss", function(req, res) {

    const msg = req.body.message;

    //Saves to DB
    const pushmsg = new SendMsg({
        userid: userid,
        message: msg
    })
    pushmsg.save();

    SendMsg.find({}, (err, outArray) => {
        if (!err) {
            res.render("discuss", { Messages: outArray, DisName: disName });
        }
    })

});


app.post("/vote", function(req, res) {

    var Ests;
    var Vsts;
    var flag = false; //user
    EnrollS.find({}, (err, output) => {
        if (!err) {
            output.forEach(e => {
                if (e.userid == userid) {
                    Ests = e.Enrollstatus;
                    Vsts = e.Votingstatus;
                    flag = true;
                }
            });

            if (flag) {
                Nominee.find({}, (err, output) => {
                    if (!err) {
                        FixDate.find({}, (er, output1) => {
                            if (!er) {
                                if (output1[0].length != 0) {
                                    endDate = output1[0].votingEnd.toLocaleDateString("en-US", options)
                                    res.render("vote", { DisName: disName, userid: userid, Ests: Ests, Vsts: Vsts, partySymbol: output, endDate: endDate, error: "" });
                                } else {
                                    var update = "Updated Sooner!"
                                    res.render("vote", { DisName: disName, userid: userid, Ests: update, Vsts: update, partySymbol: output, endDate: update });
                                }
                            }
                        })

                    }
                })
            } else {
                Nominee.find({}, (err, output) => {
                    if (!err) {
                        res.render("enroll", { DisName: disName, userid: userid, message: "Voter Not Enrolled!", partySymbol: output });
                    }
                })
            }
        }
    })
});

app.post("/votersInfo", (req, res) => {
    var aadhar = req.body.aadhar;
    var Enrollstatus = "Enrolled";
    var votingstatus = "Not Yet";
    var cheak = true; //aadhar No.
    var con = true; //count
    var msg;

    console.log();

    Nominee.find({}, (err, output) => {

        if (aadhar.length == 0) {
            res.render("enroll", { DisName: disName, userid: userid, message: "Enrollment Failed! Voters No Aadhar No. voters", partySymbol: output });
        } else if (aadhar.length != 12) {
            res.render("enroll", { DisName: disName, userid: userid, message: "Enrollment Failed! Voters wrong Aadhar No.", partySymbol: output });
        } else {
            EnrollS.find({}, (err, useridOup) => {
                // console.log(useridOup);
                if (!err) {

                    useridOup.forEach(e => {
                        if (e.userid == userid) {
                            con = false;
                        }
                        if (e.aadharNo == aadhar) {
                            cheak = false
                        }
                    });

                    // console.log(con + " " + con);
                    if (!con) {
                        msg = "You have Already Enrolled";
                    } else if (cheak) {
                        const Enrollstatussave = new EnrollS({
                            aadharNo: aadhar,
                            userid: userid,
                            Enrollstatus: Enrollstatus,
                            Votingstatus: votingstatus,
                        })
                        Enrollstatussave.save()
                        msg = "Enrollment Success Voters";
                    } else {
                        msg = "Enrollment Failed! Voters"
                    }
                    res.render("enroll", { DisName: disName, userid: userid, message: msg, partySymbol: output });
                }
            })
        }
    })


})

app.post("/nomineeInfo", (req, res) => {
    var aadhar = req.body.aadhar;
    var degree = req.body.degree;
    var address = req.body.address;
    var age = req.body.age;
    var partName = _.upperCase(req.body.partName);
    var symbol = req.body.symbol;
    var check = true; // Party Related
    var check2 = true; // Enroll related

    var errormsg;

    Nominee.find({}, (err, output1) => {

        if (aadhar.length == 0) {
            res.render("enroll", { DisName: disName, userid: userid, message: "Enrollment Failed! Voters No Aadhar No.", partySymbol: output1 });
        } else if (aadhar.length != 12) {
            res.render("enroll", { DisName: disName, userid: userid, message: "Enrollment Failed! Voters wrong Aadhar No.", partySymbol: output1 });
        } else {

            EnrollS.find({}, (err, output) => {
                if (!err) {
                    console.log(userid);
                    output.forEach(e => {
                        if (e.userid == userid) {
                            check2 = false;
                        }
                    });

                    //checking
                    if (check2) {
                        errormsg = "You Must Enroll as the Voter!"
                        res.render("enroll", { DisName: disName, userid: userid, message: errormsg, partySymbol: output1 });
                    } else {
                        Nominee.find({}, (err, output) => {
                            if (!err) {
                                console.log("error!!");
                                output.forEach(e => {
                                    if (e.emailId == userid) {
                                        check = false;
                                        errormsg = "Enrollement already Done!"
                                    }
                                    if (e.aadharNo == aadhar) {
                                        check = false;
                                        errormsg = "Enrollment Failed! Same Aadhar Number!"
                                    }
                                    if (e.partName == partName) {
                                        check = false;
                                        errormsg = "Enrollment Failed! Same Party Name!"
                                    }
                                    if (e.symbol == symbol) {
                                        check = false;
                                        errormsg = "Enrollment Failed! Same Party Symbol!"
                                    }

                                });

                                // console.log(errormsg);
                                if (check) {
                                    const Nomineesave = new Nominee({
                                        aadharNo: aadhar,
                                        emailId: userid,
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
                                                    res.render("enroll", { DisName: disName, userid: userid, message: "Enrollment Success Nominee", partySymbol: out });
                                                }
                                            })
                                        }
                                    });

                                } else {
                                    res.render("enroll", { DisName: disName, userid: userid, message: errormsg, partySymbol: output1 });
                                }
                            }
                        })
                    }

                }
            })


        }
    })
})

app.post("/VottingProcess", (req, res) => {
    var partyName = req.body.partyName;
    var aadhar = req.body.aadhar;
    var error;
    EnrollS.findOne({ mailId: userid }, (err, outputEN) => {
        if (!err) {

            if (aadhar == outputEN.aadharNo) {
                Nominee.findOne({ partName: partyName }, (err, outputNO) => {
                    if (!err) {
                        if (outputNO) {
                            var votingCount = outputNO.vote;
                            const partNameCon = { partName: partyName };
                            const voteUpd = { vote: votingCount + 1 };
                            Nominee.findOneAndUpdate(partNameCon, voteUpd, (err) => {
                                if (!err) {

                                    error = "Voted Successfully!";
                                }
                            })

                        } else {
                            error = "Wrong Party Name!"
                        }
                    }
                })
            } else {
                error = "Wrong Aadhar Number!"
            }

            //render
            var Ests;
            var Vsts;
            var flag = false; //user
            EnrollS.find({}, (err, output) => {
                if (!err) {
                    output.forEach(e => {
                        if (e.userid == userid) {
                            Ests = e.Enrollstatus;
                            Vsts = e.Votingstatus;
                            flag = true;
                        }
                    });

                    if (flag) {
                        Nominee.find({}, (err, output) => {
                            if (!err) {
                                FixDate.find({}, (er, output1) => {
                                    if (!er) {
                                        if (output1[0].length != 0) {
                                            endDate = output1[0].votingEnd.toLocaleDateString("en-US", options)
                                            res.render("vote", { DisName: disName, userid: userid, Ests: Ests, Vsts: Vsts, partySymbol: output, endDate: endDate, error: error });
                                        } else {
                                            var update = "Updated Sooner!"
                                            res.render("vote", { DisName: disName, userid: userid, Ests: update, Vsts: update, partySymbol: output, endDate: update });
                                        }
                                    }
                                })

                            }
                        })
                    } else {
                        Nominee.find({}, (err, output) => {
                            if (!err) {
                                res.render("enroll", { DisName: disName, userid: userid, message: "Voter Not Enrolled!", partySymbol: output });
                            }
                        })
                    }
                }
            })
        }
    })

})


//Admin
app.post("/changeToday", (req, res) => {
    obj = new Date(req.body.today)
    todayObj = obj;
    today = obj.toLocaleDateString("en-US", options);

    FixDate.find({}, (err, output) => {
        if (!err) {
            if (output[0] != undefined) {
                var VStart = output[0].votingStart.toLocaleDateString("en-US", options)
                var VEnd = output[0].votingEnd.toLocaleDateString("en-US", options)
                var EEnd = output[0].enrollEnd.toLocaleDateString("en-US", options)
                res.render("adminUpdate", { err: "Today's Date Changed!", VStart: VStart, VEnd: VEnd, EEnd: EEnd, today: today });
            } else {
                var update = "Need To Be updated!"
                res.render("adminUpdate", { err: "", VStart: update, VEnd: update, EEnd: update, today: today });

            }
        }
    })
})

app.get("/adminLogin", (req, res) => {
    res.render("adminLogin", { err: "" })
})

app.get("/adminUpdate", (req, res) => {
    FixDate.find({}, (err, output) => {
        if (!err) {
            if (output[0] != undefined) {
                var VStart = output[0].votingStart.toLocaleDateString("en-US", options)
                var VEnd = output[0].votingEnd.toLocaleDateString("en-US", options)
                var EEnd = output[0].enrollEnd.toLocaleDateString("en-US", options)
                res.render("adminUpdate", { err: "", VStart: VStart, VEnd: VEnd, EEnd: EEnd, today: today });
            } else {
                var update = "Need To Be updated!"
                res.render("adminUpdate", { err: "", VStart: update, VEnd: update, EEnd: update, today: today });

            }
        }
    })
})

app.get("/adminDetails", (req, res) => {
    Nominee.find({}, (err, output) => {
        if (!err) {
            EnrollS.find({}, (er, output2) => {
                if (!er) {
                    res.render("adminDetails", { NList: output, VList: output2 });
                }
            })
        }
    })
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
                    FixDate.find({}, (err, output) => {

                        if (output[0] != undefined) {
                            var VStart = output[0].votingStart.toLocaleDateString("en-US", options)
                            var VEnd = output[0].votingEnd.toLocaleDateString("en-US", options)
                            var EEnd = output[0].enrollEnd.toLocaleDateString("en-US", options)
                            res.render("adminUpdate", { err: "Successfully Updated!", VStart: VStart, VEnd: VEnd, EEnd: EEnd });
                        } else {
                            var update = "Need To Be updated!"
                            res.render("adminUpdate", { err: "Successfully Updated!", VStart: update, VEnd: update, EEnd: update });
                        }
                    })

                });
            }
        })

    } else {
        FixDate.find({}, (err, output) => {
            if (!err) {

                if (output[0] != undefined) {
                    var VStart = output[0].votingStart.toLocaleDateString("en-US", options)
                    var VEnd = output[0].votingEnd.toLocaleDateString("en-US", options)
                    var EEnd = output[0].enrollEnd.toLocaleDateString("en-US", options)
                    res.render("adminUpdate", { err: "Enter the Valid Date!", VStart: VStart, VEnd: VEnd, EEnd: EEnd });
                } else {
                    var update = "Need To Be updated!"
                    res.render("adminUpdate", { err: "Enter the Valid Date!", VStart: update, VEnd: update, EEnd: update });

                }

            }
        })
    }
})

// remove
app.post("/removeVoter", (req, res) => {
    var id = req.body.id;
    EnrollS.deleteOne({ _id: id }, (err) => {
        if (!err) {
            Nominee.find({}, (err, output) => {
                if (!err) {
                    EnrollS.find({}, (er, output2) => {
                        if (!er) {
                            res.render("adminDetails", { NList: output, VList: output2 });
                        }
                    })
                }
            })
        }
    })
})

app.post("/removeNominee", (req, res) => {
    var id = req.body.id;
    Nominee.deleteOne({ _id: id }, (err) => {
        if (!err) {
            Nominee.find({}, (err, output) => {
                if (!err) {
                    EnrollS.find({}, (er, output2) => {
                        if (!er) {
                            res.render("adminDetails", { NList: output, VList: output2 });
                        }
                    })
                }
            })
        }
    })
})


app.listen(9000, function() {
    console.log("Server running in 9000")
});