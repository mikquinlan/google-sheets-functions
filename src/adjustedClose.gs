function adjustedClose(stockTicker, date) {
  var year = date.getFullYear();
  var month = date.getMonth()-1;
  var day = date.getDay();
  
  Logger.log("Year " + year + " / month " + month + " / day " + day);
  
  var url = "http://ichart.yahoo.com/table.csv?s=" + stockTicker + "&a=" + month + "&b=" + day + "&c=" + year + "&d=" + day + "&e=" + month + "&f=" + year + "&g=w&ignore=.csv";
  Logger.log("URL: " + url);
  var data = UrlFetchApp.fetch(url);
  var dataString = new String(data);
  var adjustedCloseIndex = 9;
  var adjustedClose = dataString.split(',')[adjustedCloseIndex];
  return adjustedClose;
}

function runAdjustedClose() {
  var result = adjustedClose("VFINX", new Date(2014, 6, 2));
}
