eturns data for the matching option symbol. 
 *
 * Note that the open datum is not returned by Google that I can see. If you see it, let me know!
 * 
 * Usage examples:
 * 
 * Return data for a symbol that populates the cell the function is in and the cells to the right of it with the returned data:
 * 
 * =OPTIONPRICES("DIS160115C00057500", $Z$927)
 * 
 * To get just the bid:
 * 
 * =index(OPTIONPRICES("DIS160115C00057500", $Z$927),0,2)
 * 
 * @param {optionSymbol} The option symbol as a string, e.g. "SWIR141018P00012500" OR the data type must be string (e.g. output of the TEXT() function).
 * @param {timestamp} Always use $Z$927. This is a workaround to make sure the latest data is always fetched from Google Finance.
 * @return option symbol data in the following order: close, open, bid, ask, strike, expiry (formatted to MM/DD/YYYY) OR prints error message
 * @customfunction
 */
function OPTIONPRICES_IB(optionSymbol, timestamp) {
  
  //var optionSymbol="LL170120P00018000";
  
  var optionSymbolRegEx = /^([A-Z]{1,5})[\d]{0,1}([\d]{6})([P|C])[\d]{8}$/g;
  
  var match = optionSymbolRegEx.exec(optionSymbol);
  
  if(!match) {
    return 'Symbol does not match expected format (http://en.wikipedia.org/wiki/Option_symbol). Make sure symbol data is correct. Make sure you pass the symbol in as a string, e.g. =optionprices("'.concat(optionSymbol).concat(', $Z$927")');
  }
  
  //Prevent error (this is a Google recommended resolution): Service invoked too many times in a short time: urlfetch. 
  //Sleep a random amount of time up to x seconds. Random stops multiple tickers on a page waiting for the same amount of time
  //then all trying to do the next call at the same time.
  //var sleepTime = Math.random() * 7500;
  //log("Sleeping for " + sleepTime + "ms");
  //Utilities.sleep(sleepTime);
  
  var url = "http://52.31.140.109:7001/options/prices/" + optionSymbol;
  log("options url: " + url);
  var jsonStream = UrlFetchApp.fetch(url);
  var optionData = JSON.parse(jsonStream.getContentText("UTF-8"));
  
  
  var previousClose = JSON.stringify(optionData.close);
  var open = '-';
  var bid = JSON.stringify(optionData.bid);
  var ask = JSON.stringify(optionData.ask);
  var strike = JSON.stringify(optionData.strike);
  
  log("For option " + optionSymbol);
  log("previous close: " + previousClose);
  log("open: " + open);
  log("bid: " + bid);
  log("ask: " + ask);
  log("strike: " + strike);
  
  return [[previousClose, open, bid, ask, strike]];
}

 
 

function log(message) {
  var debug = true;
  
  if(debug) {
    Logger.log(message);
  }
}

/*
Comply with Google Apps Script publishing requirements.

Add the 1 hour refresh installable trigger.
*/
function onInstall(e) {
//Removed this trigger as may be causing max number requests quota errors
//  ScriptApp.newTrigger('optionprices')
//      .timeBased()
//      .everyHours(1)
//      .create();
  
  onOpen(e);
}

function onOpen(e) {  
  var menu = SpreadsheetApp.getUi().createAddonMenu();
  var refreshMenu = menu.addItem("Refresh", "refreshLastUpdate");
  var optionpricesMenu = menu.addItem("How to Use", "showUsageSidebar");
  menu.addToUi();
  
  SpreadsheetApp.getActiveSpreadsheet().getRange('Z927').clear();
}

function showUsageSidebar() {
  var usageHtml = HtmlService.createHtmlOutputFromFile('Usage')
      .setTitle('Option Prices IB Help')
      .setWidth(300);
  SpreadsheetApp.getUi()
      .showSidebar(usageHtml);
}

function refreshLastUpdate() {
  SpreadsheetApp.getActiveSpreadsheet().getRange('Z927').setValue(new Date().toTimeString());
}
 
 
/*
Example JSON that is returned
{"symbol":"KO170120P00040000","bid":-1.0,"ask":-1.0,"error":null,"close":2.58}
*/
