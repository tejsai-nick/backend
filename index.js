const express = require("express");
const uploads = require("express-fileupload");
const jwt = require("jsonwebtoken");
const path = require("path");
const mongoose = require("mongoose");
var cors = require("cors");
var cors = require("cors");
const fs = require("fs");

var ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath("C:/FFmpeg/bin/ffmpeg.exe");
mongoose.connect("mongodb://localhost:27017/video").then(console.log("done"));
ffmpeg.setFfprobePath("C:/FFmpeg/bin/ffprobe.exe");
const app = express();
app.use(cors());
app.use(uploads());
app.use(cors());
app.use(express.json());
app.use("/thum", express.static("things/thumb"));
app.use("/vide", express.static("things/vid"));
app.use("/img", express.static("thum"));
var s1;
var s2;
var s3;
const y = mongoose.model(
  "duration",
  new mongoose.Schema({
    title: {
      type: String,
      maxlength: 320
    },
    category: {
      type: String,
      maxlength: 15
    },
    description: {
      type: String,
      maxlength: 500
    },
    time: {
      type: Number
    },
    vidurl: {
      type: String,
      maxlength: 320
    },
    thumburl: {
      type: String,
      maxlength: 320
    }
  })
);
const a = mongoose.model(
  "user",
  new mongoose.Schema({
    email: {
      type: String,
      maxlength: 320
    },
    name: {
      type: String,
      maxlength: 60
    },
    password: {
      type: String,
      maxlength: 60
    }
  })
);
const mainurl = "http://localhost:5000/";
app.post("/", verifyToken, (req, res) => {
  var file = req.files.file;
  console.log(req.body);
  if (file.mimetype.substring(0, 5) == "video") {
    file.mv("./things/vid/" + file.name, err => {
      res.send("Your file had been uploaded");
    });
    const x = Date.now() + file.name;
    if (req.body.type == "image") {
      var f = req.files.image;
      f.mv("./things/thumb/" + x.substring(0, x.length - 3) + "png", err => {});
    } else {
      if (req.body.move == "s1") {
        console.log(s1);
        fs.renameSync(
          "./thum/" + s1,
          "./things/thumb/" + x.substring(0, x.length - 3) + "png"
        );
      } else if (req.body.move == "s2") {
        fs.renameSync(
          "./thum/" + s2,
          "./things/thumb/" + x.substring(0, x.length - 3) + "png"
        );
      } else {
        fs.renameSync(
          "./thum/" + s3,
          "./things/thumb/" + x.substring(0, x.length - 3) + "png"
        );
      }
    }
    console.log(x);
    fs.renameSync("./things/vid/" + file.name, "./things/vid/" + x);
    ffmpeg.ffprobe("./things/vid/" + x, async (err, data) => {
      console.log(data.format.duration);
      const s = await new y({
        title: req.body.title,
        category: req.body.category,
        description: req.body.description,
        time: parseInt(data.format.duration),
        vidurl: mainurl + "vide/" + x,
        thumburl: mainurl + "thum/" + x.substring(0, x.length - 3) + "png"
      });
      s.save();
    });
  } else {
    res.send("upload only videos");
  }
});
app.post("/video", verifyToken, (req, res) => {
  var file = req.files.file;
  fs.rmdirSync("./uploads", { recursive: true });
  fs.rmdirSync("./thum", { recursive: true });
  fs.mkdirSync("./thum");
  fs.mkdirSync("./uploads");
  file.mv("./uploads/" + file.name, err => {});
  s1 = Date.now() + ".png";
  ffmpeg("./uploads/" + file.name).screenshots({
    timestamps: ["75%"],
    filename: s1,
    folder: "thum"
  });
  s2 = Date.now() + ".png";
  ffmpeg("./uploads/" + file.name).screenshots({
    timestamps: ["25%"],
    filename: s2,
    folder: "thum"
  });
  s3 = Date.now() + ".png";
  ffmpeg("./uploads/" + file.name).screenshots({
    timestamps: ["50%"],
    filename: s3,
    folder: "thum"
  });
  res.send("done");
});
app.get("/hello", verifyToken, async (req, res) => {
  var thum1;
  var thum2;
  var thum3;

  const d = {
    thum1: mainurl + "img/" + s1,
    thum2: mainurl + "img/" + s2,
    thum3: mainurl + "img/" + s3
  };
  res.send({ d });
});
app.get("/send", verifyToken, async (req, res) => {
  const data = await y.find();
  res.send(data);
});
app.post("/newuser", async (req, res) => {
  const s = await a.findOne({ email: req.body.email });
  console.log(s);
  if (s) {
    res.send("email already exists");
  } else {
    const s = new a({
      email: req.body.email,
      password: req.body.password,
      name: req.body.name
    });
    s.save();
    res.send("created");
  }
});
function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  console.log(bearerHeader);
  if (bearerHeader && bearerHeader.split(" ")[1]) {
    req.token = bearerHeader.split(" ")[1];
    jwt.verify(req.token, "secret-key", (err, data) => {
      if (err) {
        res.sendStatus(404);
      } else next();
    });
  } else {
    res.sendStatus(403);
  }
}

app.post("/login", async (req, res) => {
  const s = await a.findOne({ email: req.body.email });
  console.log(s);
  if (s && s.password == req.body.password) {
    jwt.sign({ user: req.body.email }, "secret-key", (err, token) => {
      const b = {
        "auth-token": token
      };
      res.send({ b });
    });
  } else {
    res.sendStatus(404);
  }
});

app.listen(5000);
