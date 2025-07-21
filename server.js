console.log("Server file loaded...");
var express = require("express");
var fileuploader = require("express-fileupload");
var mysql2 = require("mysql2");
var fs = require("fs");
var cloudinary = require("cloudinary").v2;


var app = express();//app() returns an Object:app
app.use(fileuploader());//for receiving files from client and save on server files

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI("AIzaSyB6uXlDT-weGXCXahMBr5X49d6_1dgjeEg");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });


app.listen(1718, function () {
    console.log("Server Started at Port no: 1718")
})

app.use(express.static("public"));
app.get("/", function (req, resp) {
    let path = __dirname + "/public/index.html";
    resp.sendFile(path);
});

// cloudinary configuration
app.use(express.urlencoded(true)); //convert POST data to JSON object

cloudinary.config({
    cloud_name: 'dfyxjh3ff',
    api_key: '261964541512685',
    api_secret: 'PfRVIo1IagO5z_ZnNFI1TQ7DOLc' // Click 'View API Keys' above to copy your API secret
});


app.get("/ai", function (req, resp) {

    // resp.sendFile();
    let dirName = __dirname;//Global Variable for path of current directory
    //let filename=__filename;
    //resp.send(dirName+"  <br>     "+filename);
    let fullpath = dirName + "/public/profile-player.html";
    resp.sendFile(fullpath);
})


// GEMINI AI CHATBOT
async function RajeshBansalKaChirag(imgurl) {
    const myprompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', name:'', gender:'', dob: ''}. Dont give output as string."
    const imageResp = await fetch(imgurl)
        .then((response) => response.arrayBuffer());

    const result = await model.generateContent([
        {
            inlineData: {
                data: Buffer.from(imageResp).toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        myprompt,
    ]);
    console.log(result.response.text())

    const cleaned = result.response.text().replace(/```json|```/g, '').trim();
    const jsonData = JSON.parse(cleaned);
    console.log(jsonData);

    return jsonData

}

// ADHAAR TO mysql
app.post("/submit-player-details", async function (req, resp) {
    let fileName;
    if (req.files != null) {
        //const myprompt = "Read the text on picture and tell all the information";
        //  const myprompt = "Read the text on picture in JSON format";
        fileName = req.files.acardpicurl.name;
        let locationToSave = __dirname + "/public/upload/" + fileName;//full ile path

        req.files.acardpicurl.mv(locationToSave);//saving file in uploads folder

        //saving ur file/pic on cloudinary server
        try {
            console.log(" pic saved")
            await cloudinary.uploader.upload(locationToSave).then(async function (picUrlResult) {
                let jsonData = await RajeshBansalKaChirag(picUrlResult.url);

                let profilepicurl = "";
                if (req.files != null) {
                    let fName = req.files.profilepicurl.name;
                    let fullPath = __dirname + "/public/upload/" + fName;
                    req.files.profilepicurl.mv(fullPath);

                    await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
                        profilepicurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server

                        console.log(profilepicurl);
                    });
                }
                else
                    profilepicurl = "nopic.jpg";
                // Extract parsed data
                let name = jsonData.name;
                let dob = jsonData.dob;
                //to add DOB INTO MYSQL
                dob = dob.split("/").reverse().join("-");

                let gender = jsonData.gender;

                // Extract rest from form
                let emailid = req.body.emailid;
                let acardpicurl = picUrlResult.url;    // Use Cloudinary URL here if needed

                let address = req.body.address;
                let contact = req.body.contact;
                let game = req.body.game;
                let otherinfo = req.body.otherinfo;

                let query = `INSERT INTO players 
                    (emailid, acardpicurl, profilepicurl, name, dob, gender, contact, address, game, otherinfo) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                mySqlVen.query(query, [
                    emailid, acardpicurl, profilepicurl,
                    name, dob, gender, contact,
                    address, game, otherinfo
                ], function (errKuch, result) {
                    if (errKuch == null) {
                        console.log(" Player details saved successfully.");
                        resp.send("Player details saved successfully..");
                    }


                });

            });
        } catch (err) {
            resp.send(err.message)
        }

    }
    else {
        resp.send("No Aadhaar file uploaded.");
    }
});


// mysql configuration
let dbConfig = "mysql://avnadmin:AVNS_mNlqAKATy4yEa0Z_Y3i@mysql-ce462d3-simran-rocks.c.aivencloud.com:15420/sproject";
let mySqlVen = mysql2.createConnection(dbConfig);
mySqlVen.connect(function (errKuch) {
    if (errKuch == null)
        console.log("Nya project hai chelga hi !!!!");
    else
        console.log(errKuch.message)
});

// SEND TO SERVER AND PIC UPLOAD 
app.post("/orgn-details", async function (req, resp) {
    let picurl = "";
    if (req.files != null) {
        let fName = req.files.picurl.name;
        let fullPath = __dirname + "/public/upload/" + fName;
        req.files.picurl.mv(fullPath);

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            picurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server

            console.log(picurl);
        });
    }
    else
        picurl = "nopic.jpg";

    // Get all form data 
    let emailid = req.body.emailid;
    let orgname = req.body.orgname;
    let regnumber = req.body.regnumber;
    let address = req.body.address;
    let city = req.body.city;
    let sports = req.body.sports;
    let website = req.body.website;
    let insta = req.body.insta;
    let head = req.body.head;
    let contact = req.body.contact;
    let otherinfo = req.body.otherinfo;

    // Insert into Database
    let query = `INSERT INTO organisers 
    (emailid, orgname, regnumber, address, city, sports, website, insta, head, contact, picurl, otherinfo) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    mySqlVen.query(query, [
        emailid, orgname, regnumber, address, city,
        sports, website, insta, head, contact, picurl, otherinfo
    ], function (err, result) {
        if (err) {

            resp.send("Error saving organiser details: " + err.message);
        } else {

            resp.send("Organiser details saved successfully!");
        }
    });
});

// SIGNUP USER

app.get("/server-signup", function (req, resp) {
    let email = req.query.txtEmail;
    let pwd = req.query.txtPwd;
    let utype = req.query.comboUser;
    let dos = new Date();
    let status = 1;

    console.log("Signup request received:", email, pwd, utype);

    let query = "INSERT INTO users (emailid, pwd, utype, dos, status) VALUES (?, ?, ?, ?, ?)";

    mySqlVen.query(query, [email, pwd, utype, dos, status], function (err, result) {
        if (err) {
            resp.send("Signup failed: " + err.message);
        } else {
            resp.send("Signup successful!");
        }
    });
});

// LOGIN USER
app.get("/do-login", function (req, resp) {
    let email = req.query.emailid;
    let pwd = req.query.pwd;

    let query = "SELECT * FROM users WHERE emailid = ? AND pwd = ?";

    mySqlVen.query(query, [email, pwd], function (err, allRecords) {

        if (allRecords.length == 1) {
            let status = allRecords[0].status;

            if (status == 0)
                resp.send(" You are Blocked, Contact Admin asap.");
            else if (status == 1)
                resp.send(allRecords[0].utype);

        }
        else {
            resp.send("Wrong emailid / pwd");
        }

    });
});

// UPDATE USER

app.post("/update-user", async function (req, resp) {
    let picurl = "";
    if (req.files != null) //user wants to Update Profile Pic
    {
        let fName = req.files.picurl.name;
        let fullPath = __dirname + "/public/upload/" + fName;
        req.files.picurl.mv(fullPath);

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            picurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server

            console.log(picurl);
        });
    }
    else
        picurl = req.body.hdn;

    let emailid = req.body.emailid;
    let orgname = req.body.orgname;
    let regnumber = req.body.regnumber;
    let address = req.body.address;
    let city = req.body.city;
    let sports = req.body.sports;
    let website = req.body.website;
    let insta = req.body.insta;
    let head = req.body.head;
    let contact = req.body.contact;
    let otherinfo = req.body.otherinfo;

    mySqlVen.query(
        "UPDATE organisers SET orgname=?, regnumber=?, address=?, city=?, sports=?, website=?, insta=?, head=?, contact=?, picurl=?, otherinfo=? WHERE emailid=?",
        [orgname, regnumber, address, city, sports, website, insta, head, contact, picurl, otherinfo, emailid],
        function (errKuch, result) {
            if (errKuch == null) {
                if (result.affectedRows == 1)
                    resp.send("Details Updated Successfully!!");
                else
                    resp.send("Invalid Email ID");
            } else
                resp.send(errKuch.message)
        }
    );
});

// AJAX CALL
app.get("/get-one", function (req, resp) {
    mySqlVen.query("select * from organisers where emailid=?", [req.query.emailid], function (err, allRecords) {
        if (allRecords.length == 0)
            resp.send("No Record Found");
        else
            resp.json(allRecords);
    })
})

// POST EVENT AJAX CALL
app.get("/post-event", function (req, resp) {
    let emailid = req.query.emailid;
    let event = req.query.event;
    let date = req.query.date;
    let time = req.query.time;
    let address = req.query.address;
    let city = req.query.city;
    let sports = req.query.sports;
    let minage = req.query.minage;
    let maxage = req.query.maxage;
    let lastdate = req.query.lastdate;
    let fee = req.query.fee;
    let prize = req.query.prize;
    let contact = req.query.contact;

    let query = `INSERT INTO tournaments 
    (emailid, event, date, time, address, city, sports, minage, maxage, lastdate, fee, prize, contact) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    mySqlVen.query(query, [
        emailid, event, date, time, address,
        city, sports, minage, maxage, lastdate,
        fee, prize, contact
    ], function (errKuch, result) {
        if (errKuch == null) {
            if (result.affectedRows == 1)
                resp.send("Event Submitted Successfully");
            else
                resp.send("Invalid email ID");
        } else {
            resp.send(errKuch.message);
        }
    });
});


// Fetch Tournaments by Email
app.get("/do-fetch-tournaments-by-email", function (req, resp) {
    let emailid = req.query.emailid;

    mySqlVen.query("SELECT * FROM tournaments WHERE emailid = ?", [emailid], function (err, records) {
        if (err)
            resp.send(err);
        else
            resp.send(records);
    });
});

// Delete Tournament by RID 
app.get("/delete-tournament", function (req, resp) {
    let rid = req.query.rid;

    mySqlVen.query("DELETE FROM tournaments WHERE rid = ?", [rid], function (err, result) {
        if (err)
            resp.send(err);
        else if (result.affectedRows === 1)
            resp.send("Tournament Deleted Successfully!");
        else
            resp.send("Invalid Record ID");
    });
});


// Get details of player 
app.get("/fetch-player-details", function (req, resp) {
    mySqlVen.query("select * from players where emailid=?", [req.query.emailid], function (err, allRecords) {
        if (allRecords.length == 0)
            resp.send("No Record Found");
        else
            resp.json(allRecords);
    })
})

// Upload Details of player and send pic 
app.post("/submit-player-details", async function (req, resp) {
    let acardpicurl = "";
    if (req.files != null) {
        let fName = req.files.acardpicurl.name;
        let fullPath = __dirname + "/public/upload/" + fName;
        req.files.acardpicurl.mv(fullPath);

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            acardpicurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server

            console.log(acardpicurl);
        });
    }
    else
        acardpicurl = "nopic.jpg";

    let profilepicurl = "";
    if (req.files != null) {
        let fName = req.files.profilepicurl.name;
        let fullPath = __dirname + "/public/upload/" + fName;
        req.files.profilepicurl.mv(fullPath);

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            profilepicurl = picUrlResult.url;   //will give u the url of ur pic on cloudinary server

            console.log(profilepicurl);
        });
    }
    else
        profilepicurl = "nopic.jpg";

    // Get all form data 
    let emailid = req.body.emailid;
    let name = req.body.name;
    let dob = req.body.dob;
    let gender = req.body.gender;
    let contact = req.body.contact;
    let address = req.body.address;
    let game = req.body.game;
    let otherinfo = req.body.otherinfo;

    // Insert into Database
    let query = `INSERT INTO players 
(emailid, acardpicurl, profilepicurl, name, dob, gender, contact, address, game, otherinfo) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    mySqlVen.query(query, [emailid, acardpicurl, profilepicurl, name, dob, gender, contact, address, game, otherinfo], function (errKuch, result) {
        if (errKuch) {
            resp.send("Error saving Player's details: " + errKuch.message);
        } else {
            resp.send("Player details saved successfully!");
        }
    });
});

// UPDATE PLAYER DETAILS
app.post("/update-player", async function (req, resp) {

    // Aadhaar pic
    let acardpicurl = "";
    if (req.files && req.files.acardpicurl != null) {
        let fName = req.files.acardpicurl.name;
        let fullPath = __dirname + "/public/upload/" + fName;
        await req.files.acardpicurl.mv(fullPath);
        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            acardpicurl = picUrlResult.url;
        });
    } else {
        acardpicurl = req.body.hdnA;
    }


    // Profile pic
    let profilepicurl = "";
    if (req.files && req.files.profilepicurl != null) {
        let fName = req.files.profilepicurl.name;
        let fullPath = __dirname + "/public/upload/" + fName;
        req.files.profilepicurl.mv(fullPath);

        await cloudinary.uploader.upload(fullPath).then(function (picUrlResult) {
            profilepicurl = picUrlResult.url;
            console.log(profilepicurl);
        });
    } else {
        profilepicurl = req.body.hdnP;
    }


    let emailid = req.body.emailid;
    let name = req.body.name;
    let dob = req.body.dob;
    let gender = req.body.gender;
    let contact = req.body.contact;
    let address = req.body.address;
    let game = req.body.game;
    let otherinfo = req.body.otherinfo;

    // Update query
    mySqlVen.query(
        "UPDATE players SET acardpicurl=?, profilepicurl=?, name=?, dob=?, gender=?, contact=?, address=?, game=?, otherinfo=? WHERE emailid=?",
        [acardpicurl, profilepicurl, name, dob, gender, contact, address, game, otherinfo, emailid],
        function (errKuch, result) {
            if (errKuch == null) {
                if (result.affectedRows == 1)
                    resp.send("Details Updated Successfully!!");
                else
                    resp.send("Invalid Email ID");
            } else {
                resp.send(errKuch.message);
            }
        }
    );
});


// Fetch all users in admin portal
app.get("/fetch-all-users", function (req, resp) {
    mySqlVen.query("SELECT emailid, utype, status FROM users", function (errKuch, records) {
        if (errKuch)
            resp.send(errKuch);
        else
            resp.send(records);
    });
});

// Update user status in admin console 
app.get("/update-user-status", function (req, resp) {
    let emailid = req.query.emailid;
    let status = req.query.status;

    mySqlVen.query("UPDATE users SET status = ? WHERE emailid = ?", [status, emailid], function (errKuch, result) {
        if (errKuch == null) {
            if (status == 1) {
                resp.send("User unblocked successfully");
            } else {
                if (status == 0) {
                    resp.send("User blocked successfully");
                } else {
                    resp.send("Invalid status value");
                }
            }
        } else {
            resp.send(err);
        }
    });
});


// Fetch tournaments
app.get("/do-fetch-all-tournaments", function (req, resp) {
    mySqlVen.query(
        "select * from tournaments where city=? and sports=?", [req.query.kuchCity, req.query.kuchGame], function (err, allRecords) {

            resp.send(allRecords);
        });
});

// Fetch City
app.get("/do-fetch-all-cities", function (req, resp) {
    mySqlVen.query("select distinct city from tournaments", function (err, allRecords) {

        resp.send(allRecords);
    });
});



// /do-fetch-all-organisers
app.get("/do-fetch-all-organisers", function (req, resp) {
    mySqlVen.query("select * from organisers ", function (err, allRecords) {          //users where utype='organizer'
        resp.send(allRecords);
    })
})



//do-fetch-all-players
app.get("/do-fetch-all-players", function (req, resp) {
    mySqlVen.query("select * from players ", function (err, allRecords) {
        resp.send(allRecords);
    })
})


// CHANGE PASS IN SETTINGS 
app.get("/do-change-password", function (req, resp) {
    let emailid = req.query.emailid;
    let oldpass = req.query.oldpass;
    let newpass = req.query.newpass;

    console.log("EMAIL:", emailid);
    console.log("OLD PASS:", oldpass);
    console.log("NEW PASS:", newpass);

    let updateQuery = "UPDATE users SET pwd=? WHERE emailid=? AND pwd=? AND utype='player'";

    mySqlVen.query(updateQuery, [newpass, emailid, oldpass], function (errKuch, result) {
        if (errKuch) {

            resp.send("Something Went Wrong, Try Again Later");
        } else {

            if (result.affectedRows == 0) {
                resp.send("Wrong Email ID or Old Password");
            } else {
                resp.send("Password Updated Successfully!!");
            }
        }
    });
});



//contact us in website
app.post("/submit-contact-form", function (req, resp) {
    // Get all form data 
    let email = req.body.email;
    let name = req.body.name;
    let message = req.body.message;


    // Insert into Database
    let query = `INSERT INTO contactus
(email, name, message) 
VALUES (?, ?, ?)`;

    mySqlVen.query(query, [email, name, message], function (errKuch, result) {
        if (errKuch) {
            resp.send("Please try again");
        } else {
            resp.send(" We will Contact you Soon!");
        }
    });
});
