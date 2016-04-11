function adjustedClose(stockTicker, date) {
  try {
    var year = date.getUTCFullYear();
    var month = date.getUTCMonth();
    var dateOfMonth = date.getUTCDate();
    
    var url = "http://ichart.yahoo.com/table.csv?s=" + stockTicker + "&a=" + month + "&b=" + dateOfMonth + "&c=" + year + "&d=" + month + "&e=" + dateOfMonth + "&f=" + year + "&g=d&ignore=.csv";
    //Expected value from this URL is 122.44.
    //var url = "http://ichart.yahoo.com/table.csv?s=" + stockTicker + "&a=2&b=21&c=2012&d=2&e=21&f=2012&g=d&ignore=.csv";
    var cidSleepTime = Math.random() * 10000;
    //log("Before getting CID - sleeping for " + cidSleepTime + "ms");
    Utilities.sleep(cidSleepTime);
    var data = UrlFetchApp.fetch(url);
    var dataString = new String(data).trim();
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
