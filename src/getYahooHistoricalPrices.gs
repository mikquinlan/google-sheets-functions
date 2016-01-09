/*
SPX:
From: 2-Dec-2014 to 31-Dec-2015
http://real-chart.finance.yahoo.com/table.csv?s=%5EGSPC&a=11&b=2&c=2014&d=11&e=31&f=2015&g=d&ignore=.csv

RUT:
From: 2-Dec-2014 to 31-Dec-2015

http://real-chart.finance.yahoo.com/table.csv?s=%5ERUT&a=11&b=2&c=2014&d=11&e=31&f=2015&g=d&ignore=.csv
*/
function getYahooHistoricalPrices(symbol, numberDaysBack) {
  //For testing only
  //var symbol = "SPX";
  //var numberDaysBack = 21;
  //var dateFrom = new Date(2015, 11, 29, 0, 0, 0, 0);
  //var dateTo = new Date(2015, 11, 31, 0, 0, 0, 0);
  
  var lastTradingDays = this.lastTradingDays(numberDaysBack);
  var dateTo = lastTradingDays[0];
  var dateFrom = lastTradingDays[lastTradingDays.length - 1];
  
  try {
    var urlEncodedSymbol = "";
    if(symbol === "SPX") {
      urlEncodedSymbol = "%5EGSPC"; //url-encoded Yahoo equivalent
    } else if(symbol === "RUT") {
      urlEncodedSymbol = "%5ERUT"; //url-encoded Yahoo equivalent
    } else {
      return "ERROR: Unrecognised symbol " + symbol;
    }
    
    var templateUrl = "http://real-chart.finance.yahoo.com/table.csv?s=|symbol|&a=|fromMonth|&b=|fromDay|&c=|fromYear|&d=|toMonth|&e=|toDay|&f=|toYear|&g=d&ignore=.csv"  
    var historicalPricesUrl = templateUrl
    .replace("|symbol|", urlEncodedSymbol)
    .replace("|fromMonth|", dateFrom.getMonth())
    .replace("|fromDay|", dateFrom.getDate())
    .replace("|fromYear|", dateFrom.getYear())
    .replace("|toMonth|", dateTo.getMonth())
    .replace("|toDay|", dateTo.getDate())
    .replace("|toYear|", dateTo.getYear());
    
    Logger.log("Historical prices URL: " + historicalPricesUrl);
    
    var historicalData = UrlFetchApp.fetch(historicalPricesUrl).toString();
    Logger.log("Yahoo data: ");
    Logger.log(historicalData);
    
    historicalData = historicalData.split("\n");
    //We end up with an extra blank line, so drop it
    historicalData = historicalData.slice(0, historicalData.length - 1);
    
    var displayableHistoricalData = [];
    
    for(i = 0; i < historicalData.length; i++) {
      displayableHistoricalData.push(historicalData[i].split(","));
    }    
    
    Logger.log("Displayable data (unformatted)");
    Logger.log(displayableHistoricalData);
    
    var formattedData = this.formatDataTypesInYahooReturnedData(displayableHistoricalData);
    
    Logger.log("Formatted data:");
    Logger.log(formattedData);
    
    return formattedData;
  } catch(err) {
    Logger.log("Error: " + err);
    return ["Error running function: " + err];
  }
}

/*
Everything we get back is a string and that doesn't work with Google sheets formulae
*/
function formatDataTypesInYahooReturnedData(historicalData) {
  var formattedData = [];
  for(i = 0; i < historicalData.length; i++) {
    
    //Headers already a string
    if(i == 0) {
      formattedData.push(historicalData[i]);
    } else {
      //First column is a date, volume column is int, rest are floating point
      //Data available: Date, Open, High, Low, Close, Volume, Adj Close
      var formattedDataRow = [];
      
      var date = this.formatYahooDate(historicalData[i][0]);
      var open = parseFloat(historicalData[i][1]);
      var high = parseFloat(historicalData[i][2]);
      var low = parseFloat(historicalData[i][3]);
      var close = parseFloat(historicalData[i][4]);
      var volume = parseInt(historicalData[i][5]);
      var adjClose = parseFloat(historicalData[i][6]);
      
      formattedDataRow.push(date, open, high, low, close, volume, adjClose);
      formattedData.push(formattedDataRow);
    }
  }
  
  return formattedData;
}

function formatYahooDate(dateString) {
  //Format is yyyy-mm-dd
  var dateComponents = dateString.split("-");
  if(dateComponents.length != 3) {
    throw "Date format in returned data not in expected format: " + historicalData[i][0];
  }
  var date = new Date();
  date.setFullYear(dateComponents[0]);
  date.setMonth(dateComponents[1] - 1); //Yahoo month index starts at 1 but in JavaScript we start at 0
  date.setDate(dateComponents[2]);
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  
  return date;
}

function lastTradingDays(daysInPast) {
//  var daysInPast = 10;
  
  //See https://www.nyse.com/markets/hours-calendars
  var nonTradingDays2016NYSE = [
    new Date(2016, 0, 1, 0, 0, 0, 0),
    new Date(2016, 0, 18, 0, 0, 0, 0),
    new Date(2016, 1, 15, 0, 0, 0, 0),
    new Date(2016, 2, 25, 0, 0, 0, 0),    
    new Date(2016, 4, 30, 0, 0, 0, 0),        
    new Date(2016, 6, 4, 0, 0, 0, 0),    
    new Date(2016, 8, 5, 0, 0, 0, 0),    
    new Date(2016, 10, 24, 0, 0, 0, 0),        
    new Date(2016, 11, 26, 0, 0, 0, 0)
  ];
  
  var today = new Date();
  today.setHours(0);
  today.setMinutes(0);
  today.setSeconds(0);
  today.setMilliseconds(0);
  
  Logger.log("Today is: " + today);
  
  var pastTradingDays = []
  
  var daysToSubtract = 1;
  while(pastTradingDays.length < daysInPast) {
    
    var date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysToSubtract);
    
    if(!isWeekend(date) && !isTradingHoliday(date, nonTradingDays2016NYSE)) {
      pastTradingDays.push(date);
    }
    daysToSubtract++;
  }
  
  Logger.log("Past trading days: " + pastTradingDays)
  
  return pastTradingDays;
}

function isWeekend(date) {
  var day = date.getDay();
  return (day == 6) || (day == 0); //6 is Saturday, 0 is Sunday
}

function isTradingHoliday(date, nonTradingDays) {
    var i;
    for (i = 0; i < nonTradingDays.length; i++) {
        if (nonTradingDays[i].getYear() === date.getYear()
          && nonTradingDays[i].getMonth() === date.getMonth()
          && nonTradingDays[i].getDate() === date.getDate()) {
            return true;
        }
    }

    return false;
}
