// Version 2.0 - Use classes

const express = require("express");
const axios = require("axios");
const router = express.Router();

// Include helper functions
const helpers = require("helpers");

const months = [
  "Tammikuu",
  "Helmikuu",
  "Maaliskuu",
  "Huhtikuu",
  "Toukokuu",
  "Kesäkuu",
  "Heinäkuu",
  "Elokuu",
  "Syyskuu",
  "Lokakuu",
  "Marraskuu",
  "Joulukuu",
];

const baseURL =
  "https://helsinki-openapi.nuuka.cloud/api/v1.0/EnergyData/Daily/ListByProperty?Record=LocationName&SearchString=1000%20Hakaniemen%20kauppahalli&ReportingGroup=Electricity&";

class EnergyData {
  constructor(timestamp, reportingGroup, locationName, value, unit) {
    this.timestamp = new Date(timestamp);
    this.reportingGroup = reportingGroup;
    this.locationName = locationName;
    this.value = value;
    this.unit = unit;

    // Return formatted object with more readable date and value
    this.getFormatted = function () {
      return {
        time: this.timestamp.toLocaleDateString(),
        repotingGroup: this.reportingGroup,
        locationName: this.locationName,
        value: this.value.toFixed(2),
        unit: this.unit,
      };
    };

    // Check if given month and year are equal to current object's date
    this.checkMonthAndYear = function (month, year) {
      if (
        this.timestamp.getMonth() === month &&
        this.timestamp.getFullYear() === year
      ) {
        return true;
      } else {
        return false;
      }
    };
  }
}

// Create a monthly HTML table from the given data
const createMonthlyTable = (data, month, year) => {
  let html = `<h3>${months[month]}</h3>`;
  let array = [];
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].checkMonthAndYear(month, year)) {
      array.push(data[i].getFormatted());
      sum += data[i].value;
    }
  }
  html += helpers.objToHTMLTable(array);
  html += `<p class="sum">Yhteensä ${sum.toFixed(2)} kWh</p>`;
  return html;
};

// Create a single HTML table from the given data
const createTable = (data) => {
  let html = "";
  let sum = 0;
  let array = [];
  for (let i = 0; i < data.length; i++) {
    array.push(data[i].getFormatted());
    sum += data[i].value;
  }
  html += helpers.objToHTMLTable(array);
  html += `<p class="sum">Yhteensä ${sum.toFixed(2)} kWh</p>`;
  return html;
};

// Create a CSV file from the data passed
const makeCSVLog = (data) => {
  data = data.map((item) => item.getFormatted());
  const CSV = helpers.convertToCSV(data, true);
  const now = helpers.createDatestring(Date.now());
  const path = "./logs/";
  const filename = `${path}${now}-HakaniemenKauppahalli.csv`;
  helpers.exportCSV(CSV, filename);
};

// Axios GET as EnergyData
const getEnergyData = (url) => {
  const promise = axios.get(url);
  const returnData = promise.then((response) => {
    data = response.data;
    let energyData = [];
    for (let i in data) {
      energyData.push(
        new EnergyData(
          data[i].timestamp,
          data[i].reportingGroup,
          data[i].locationName,
          data[i].value,
          data[i].unit
        )
      );
    }
    return energyData;
  });
  return returnData;
};

// Endpoint to get year 2019 and return monthly data as HTML tables
router.get("/", (req, res) => {
  const apiURL = baseURL + "StartTime=2019-01-01&EndTime=2019-12-31";
  getEnergyData(apiURL)
    .then((data) => {
      let html = "";
      for (let i = 0; i < months.length; i++) {
        html += createMonthlyTable(data, i, 2019);
      }
      res.send(html);
      makeCSVLog(data);
    })
    .catch((error) => {
      res.send(error.message);
    });
});

// Endpoint for given range of dates from API with parameters received from the client and process the response
router.get("/range/", (req, res) => {
  let startTime = req.query.StartTime;
  let endTime = req.query.EndTime;
  if (startTime > endTime) {
    [startTime, endTime] = [endTime, startTime];
  }
  const apiURL = `${baseURL}&StartTime=${startTime}&EndTime=${endTime}`;
  getEnergyData(apiURL)
    .then((data) => {
      let html = `<h3>${new Date(startTime).toLocaleDateString()} - ${new Date(
        endTime
      ).toLocaleDateString()}</h3>`;
      html += createTable(data);
      res.send(html);
      makeCSVLog(data);
    })
    .catch((error) => {
      res.send("Server error: " + error);
    });
});

module.exports = router;
