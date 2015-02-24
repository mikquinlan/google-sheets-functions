/*
If ticker is in cell A1 and date is in B1, =adjustedClose(A1, B1)
or if manually entering into Google Sheets =adjustedClose("VFINX", Date(2014, 05, 01))
*/
function adjustedClose(stockTicker, date) {
  try {
    var year = date.getUTCFullYear();
    var month = date.getUTCMonth();
    var dateOfMonth = date.getUTCDate();
    
    Logger.log("Year " + year + " / month " + month + " / day " + date);
    
    var url = "http://ichart.yahoo.com/table.csv?s=" + stockTicker + "&a=" + month + "&b=" + dateOfMonth + "&c=" + year + "&d=" + month + "&e=" + dateOfMonth + "&f=" + year + "&g=d&ignore=.csv";
    //Expected value from this URL is 122.44.
    //var url = "http://ichart.yahoo.com/table.csv?s=" + stockTicker + "&a=2&b=21&c=2012&d=2&e=21&f=2012&g=d&ignore=.csv";
    Logger.log("URL: " + url);
    var data = UrlFetchApp.fetch(url);
    var dataString = new String(data);
    Logger.log(dataString);
    var adjustedCloseIndex = 12;
    var adjustedClose = dataString.split(',')[adjustedCloseIndex];
    return adjustedClose;
  } catch(err) {
    return "ERROR: " + err.message;
  }
}

function runAdjustedClose() {
  var result = adjustedClose("VFINX", new Date(2012, 3, 21));
  Logger.log("Result: " + result);
  return result;
}

