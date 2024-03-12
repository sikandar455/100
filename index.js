import express from "express";
import dotenv from "dotenv";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";
import useragent from "express-useragent";
dotenv.config();
import bodyParser from "body-parser";

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(useragent.express());

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory

app.get("/:a/:b", function (req, res) {
  const RequestUrl = req.originalUrl;
  const ipAddress = req.header("x-forwarded-for") || req.socket.remoteAddress;
  console.log("Link access by user ", ipAddress);
  res.render("captcha", { url: RequestUrl });
});

app.get("/genrate-link", function (req, res) {
  const RequestUrl = req.query.url;
  setTimeout(function () {}, 5000);
  res.render("generatelink", { url: RequestUrl });
});

app.get("/validate", function (req, res) {
  const ipAddress = req.header("x-forwarded-for") || req.socket.remoteAddress;
  const RequestUrl = req.query.url;
  const RUrl = process.env.R_URL;
  const generateString = () => {
    const length = 20;
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = " ";
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  };

  var userAgent = Object.entries(req.useragent);
  var userInfo = "{";
  var comma = "";

  userAgent.map(([key, value]) => {
    if (value != false) {
      if (
        key == "browser" ||
        key == "os" ||
        key == "version" ||
        key == "platform"
      ) {
        userInfo += comma + '"' + key + '":"' + value + '"';
        comma = ", ";
      }
    }
  });
  userInfo += ',"Host":"' + req.hostname + '"';
  userInfo += "}";
  console.log("Captcha Passed by ", userInfo);
  const encodedBuffer = Buffer.from(userInfo, "utf-8");
  const B64encodedString = encodedBuffer.toString("base64");

  const encodeBuffIP = Buffer.from(ipAddress, "utf-8");
  const IPB64encodedString = encodeBuffIP.toString("base64");

  const url =
    RUrl + RequestUrl + "/" + IPB64encodedString + "/" + B64encodedString;

  const options = {
    rejectUnauthorized: false,
  };
  https.get(url, options, function (file) {
    if (
      file.headers["content-length"] > 10 ||
      typeof file.headers["mickymouse"] !== "undefined"
    ) {
      const ContentType = file.headers["content-type"];
      const Filename = file.headers["content-disposition"];
      console.log("Downloading File ", Filename);
      res.set("Content-disposition", Filename);
      res.set("Content-Type", ContentType);
      if (typeof file.headers["mickymouse"] !== "undefined") {
        res.set("mickymouse", file.headers["mickymouse"]);
      }
      res.set("Content-file", file.headers["content-file"]);
      res.set("Content-Length", file.headers["content-length"]);
      file.pipe(res);
    } else {
      res.status(200);
      res.type("html");
      res.send(
        "<div style='text-align:center; margin-top:12rem;'>Your request number : <b>" +
          generateString() +
          "</b> has been processed.<br><br> Please <b style='color:red'>wait for 5 minutes</b> to process again.</div>"
      );
    }
  });
});

const DEFAULT_PORT = 3001;
const port = process.env.PORT || DEFAULT_PORT;
app.listen(port, () => {
  console.log(`Running on ${port}`);
});
