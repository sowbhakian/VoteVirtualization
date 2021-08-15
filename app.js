// Home-Toggle-Steps
function fstep1() {
    $("#step1").addClass("active")
    $("#step2").removeClass("active")
    $("#step3").removeClass("active")

    $("#step-p1").removeClass("deactive")
    $("#step-p2").addClass("deactive")
    $("#step-p3").addClass("deactive")
}

function fstep2() {
    $("#step1").removeClass("active")
    $("#step2").addClass("active")
    $("#step3").removeClass("active")

    $("#step-p1").addClass("deactive")
    $("#step-p2").removeClass("deactive")
    $("#step-p3").addClass("deactive")
}

function fstep3() {
    $("#step1").removeClass("active")
    $("#step2").removeClass("active")
    $("#step3").addClass("active")

    $("#step-p1").addClass("deactive")
    $("#step-p2").addClass("deactive")
    $("#step-p3").removeClass("deactive")
}

// Enroll-Toggle
function enrollshow(user) {
    if (user === 'nominee') {
        $("#nominee").removeClass("deactive")
        $("#voters").addClass("deactive")
    } else if (user === 'voters') {
        $("#nominee").addClass("deactive")
        $("#voters").removeClass("deactive")

    } else {
        console.log("Enroll Toggle Error " + user);

    }
    $("#enr-start").addClass("deactive")
}

// nominee
function next1() {
    $("#part1").addClass("deactive");
    $("#part2").removeClass("deactive");
    $("#btn2-head").addClass("addblue")
    $("#enr-part-head").text("Party Details")
}

function pre1() {
    $("#part1").removeClass("deactive");
    $("#part2").addClass("deactive");
    $("#btn2-head").removeClass("addblue")
    $("#enr-part-head").text("Personal Details")
}

// voters