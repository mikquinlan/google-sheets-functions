/*
Returns data for the matching option symbol. 
 
Note that the open datum is not returned by Google that I can see. If you see it, let me know!
 
Usage examples:
 
Return data for a symbol that populates the cell the row is in and the cells to the right of it with the returned data:
 
=googleoptions("DIS160115C00057500")
 
To get just the bid:
 
=index(googleoptions("DIS160115C00057500"),0,4)
 
Params:
  optionSymbol as a string, e.g. "SWIR141018P00012500" OR the data type must be string (you can use text() in Google Sheets).
 
Returns: option symbol data in the following order: close, open, bid, ask, strike, expiry (formatted to MM/DD/YYYY)
         OR prints error message
         
*/
function googleoptions(optionSymbol) {
  
  var optionSymbolRegEx = /^([A-Z]{1,5})[\d]{0,1}([\d]{6})([P|C])[\d]{8}$/g;
  //We get dates back with just the two digit year and we need the full year for querying Google Finance's JSON API. 
  //Um, y21k bug. Sorry. :-/
  var centuryPrefix = "20";
  
  var match = optionSymbolRegEx.exec(optionSymbol);
  
  if(!match) {
    return 'Symbol does not match expected format (http://en.wikipedia.org/wiki/Option_symbol). Make sure symbol data is correct. Make sure you pass the symbol in as a string, e.g. =googleoptions("'.concat(optionSymbol).concat('")');
  }
  
  var ticker = match[1];
  var expiryYYMMDD = match[2];
  var optionType = match[3];
  
  log("optionType: " + optionType);
  log("Ticker: " + ticker);
 
  //Work out the CID, expiry year, month and day so we can query Google for the options for the correct month.
  //Ref: http://www.focalshift.com/2014/06/24/the-google-finance-api-is-still-ticking/  
  try {
    var cid = getCidForTicker(ticker);  
  } catch(err) {
    return "Could not get option info for ticker " + ticker + ". Is it valid?";
  }
  var expiryYearYY = expiryYYMMDD.substring(0, 2);
  var expiryMonthMM = expiryYYMMDD.substring(2, 4);
  var expiryDayDD = expiryYYMMDD.substring(4, 6);
  log("Year/month/day: " + expiryYearYY + "/" + expiryMonthMM + "/" + expiryDayDD);
  
  //Prevent error (this is a Google recommended resolution): Service invoked too many times in a short time: urlfetch. 
  //Sleep a random amount of time up to 5 seconds. Random stops multiple tickers on a page waiting for the same amount of time
  //then all trying to do the next call at the same time.
  var sleepTime = Math.random() * 5000;
  log("Sleeping for " + sleepTime + "ms");
  Utilities.sleep(sleepTime);
  
  var optionsChainForMonthJson = getOptionsChainForMonth(cid, centuryPrefix.concat(expiryYearYY), expiryMonthMM, expiryDayDD);
  
  log("optionsChain: " + JSON.stringify(optionsChainForMonthJson));
  
  if (!optionsChainForMonthJson.puts && !optionsChainForMonthJson.calls) {
    log("Option chain not found");
    return "No option chain found. Have you input the correct date?";
  }
  
  var matchingOption = null;
  if (optionType === "P") {
    matchingOption = getMatchingOption(optionsChainForMonthJson.puts, optionSymbol);
  }
  
  if (optionType === "C") {
    matchingOption = getMatchingOption(optionsChainForMonthJson.calls, optionSymbol);
  } 
  
  if (!matchingOption) {
    return "Option symbol not found: " + optionSymbol;
  }
  
  var previousClose = JSON.stringify(matchingOption.p).replace(/"/g, '');;
  var open = '-';
  var bid = JSON.stringify(matchingOption.b).replace(/"/g, '');
  var ask = JSON.stringify(matchingOption.a).replace(/"/g, '');
  var strike = JSON.stringify(matchingOption.strike).replace(/"/g, '');
  var expiry = JSON.stringify(matchingOption.expiry).replace(/"/g, '');
  
  log("Found matching option " + JSON.stringify(matchingOption));
  log("previous close: " + previousClose);
  log("open: " + open);
  log("bid: " + bid);
  log("ask: " + ask);
  log("strike: " + strike);
  log("expiry: " + expiry);
  
  var parsedDate = new Date(expiry);
  var formattedExpiry = (parsedDate.getMonth() + 1) + "/" + parsedDate.getDate() + "/" + parsedDate.getFullYear();
  
  return [[previousClose, open, bid, ask, strike, formattedExpiry]];
}
 
function getTicker(optionSymbol) {
  var indexFirstDigit = optionSymbol.search(/\d/);
  var ticker = optionSymbol.substring(0, indexFirstDigit);
}
 
function getCidForTicker(ticker) {
  var templateUrl = "http://www.google.com/finance/option_chain?q=|ticker|&type=All&output=json"  
  var jsonUrl = templateUrl.replace("|ticker|", ticker);
  var jsonStream = UrlFetchApp.fetch(jsonUrl);
  var jsonData = fixGoogleOptionsJson(jsonStream.getContentText("UTF-8"));
  var jsonObject = JSON.parse(jsonData);
  
  log("cid JSON: " + jsonData);
  
  return jsonObject.underlying_id;
}
 
function getOptionsChainForMonth(cid, expiryYearYYYY, expiryMonthMM, expiryDayDD) {
  var templateUrl = "http://www.google.com/finance/option_chain?cid=|cid|&expd=|expd|&expm=|expm|&expy=|expy|&output=json";
  var jsonUrl = templateUrl.replace("|cid|", cid).replace("|expd|", expiryDayDD).replace("|expm|", expiryMonthMM).replace("|expy|", expiryYearYYYY);
  log("options chain json url: " + jsonUrl);
  var jsonStream = UrlFetchApp.fetch(jsonUrl);
  var jsonData = fixGoogleOptionsJson(jsonStream.getContentText("UTF-8"));
  return JSON.parse(jsonData);
}
 
function getMatchingOption(options, symbol) {
  log("Searching for symbol: " + symbol);
  
  for (var i = 0, option; i < options.length; i++) {
    option = options[i];
    optionString = JSON.stringify(option.s);
    optionString = optionString.replace(/"/g, '');
    log("Checking option: " + optionString);
    if(optionString === symbol) {
      return option;
    }    
  }
}
 
 
//Need to put the missing quotes around the keys to make it valid JSON. Thanks Google! :-/
function fixGoogleOptionsJson(json) {
  q=['cid','cp','s','cs','vol','expiry','underlying_id','underlying_price',
     'p','c','oi','e','b','strike','a','name','puts','calls','expirations',
     'y','m','d'];
 
  for (i in q) {
    var token = q[i];
    var startTokenRegEx = new RegExp("\{".concat(token).concat(":"), "g");
    var endTokenRegEx = new RegExp(",".concat(token).concat(":"), "g");
    json = json.replace(startTokenRegEx, '{"'.concat(token).concat('":'));
    json = json.replace(endTokenRegEx, ',"'.concat(token).concat('":'));
  }
 
  return json;
}

function log(message) {
  var debug = false;
  
  if(debug) {
    Logger.log(message);
  }
}

/*
Comply with Google Apps Script publishing requirements.
*/
function onInstall(e) {
  onOpen(e);
}

function onOpen(e) {
  //no-op. No menu function is required.
}
 
 
/*
Example JSON that is returned
{expiry:{y:2014,m:10,d:18},expirations:[{y:2014,m:10,d:18},{y:2014,m:11,d:22},{y:2014,m:12,d:20},{y:2015,m:1,d:17},{y:2015,m:3,d:20},{y:2016,m:1,d:15}],\
puts:[{cid:"993302430080571",name:"",s:"SWIR141018P00012500",e:"OPRA",p:"-",c:"-",b:"-",a:"0.15",oi:"0",vol:"-",strike:"12.50",expiry:"Oct 18, 2014"},
{cid:"1110400496228692",name:"",s:"SWIR141018P00015000",e:"OPRA",p:"-",c:"-",b:"-",a:"0.20",oi:"0",vol:"-",strike:"15.00",expiry:"Oct 18, 2014"},
{cid:"65217119924631",name:"",s:"SWIR141018P00017500",e:"OPRA",p:"0.15",cs:"chb",c:"0.00",cp:"0.00",b:"-",a:"0.20",oi:"1",vol:"-",strike:"17.50",expiry:"Oct 18, 2014"},
{cid:"624183533326177",name:"",s:"SWIR141018P00020000",e:"OPRA",p:"0.20",cs:"chb",c:"0.00",cp:"0.00",b:"-",a:"0.20",oi:"26",vol:"-",strike:"20.00",expiry:"Oct 18, 2014"},
{cid:"194653496366367",name:"",s:"SWIR141018P00022500",e:"OPRA",p:"0.23",cs:"chg",c:"+0.08",cp:"53.33",b:"0.15",a:"0.25",oi:"357",vol:"30",strike:"22.50",expiry:"Oct 18, 2014"},
{cid:"262624428111738",name:"",s:"SWIR141018P00025000",e:"OPRA",p:"0.83",cs:"chg",c:"+0.38",cp:"84.44",b:"0.70",a:"0.85",oi:"2340",vol:"139",strike:"25.00",expiry:"Oct 18, 2014"},
{cid:"332270725277985",name:"",s:"SWIR141018P00030000",e:"OPRA",p:"4.40",cs:"chg",c:"+1.10",cp:"33.33",b:"4.10",a:"5.00",oi:"424",vol:"2",strike:"30.00",expiry:"Oct 18, 2014"},
{cid:"887673543035833",name:"",s:"SWIR141018P00035000",e:"OPRA",p:"8.50",cs:"chb",c:"0.00",cp:"0.00",b:"8.70",a:"9.90",oi:"3",vol:"-",strike:"35.00",expiry:"Oct 18, 2014"},
{cid:"1053837661668743",name:"",s:"SWIR141018P00040000",e:"OPRA",p:"-",c:"-",b:"13.70",a:"15.00",oi:"0",vol:"-",strike:"40.00",expiry:"Oct 18, 2014"}],
calls:[{cid:"519162221679392",name:"",s:"SWIR141018C00012500",e:"OPRA",p:"-",c:"-",b:"12.60",a:"13.80",oi:"0",vol:"-",strike:"12.50",expiry:"Oct 18, 2014"},
{cid:"210253876585997",name:"",s:"SWIR141018C00015000",e:"OPRA",p:"-",c:"-",b:"10.10",a:"11.40",oi:"0",vol:"-",strike:"15.00",expiry:"Oct 18, 2014"},
{cid:"178577568687339",name:"",s:"SWIR141018C00017500",e:"OPRA",p:"-",c:"-",b:"7.60",a:"8.90",oi:"0",vol:"-",strike:"17.50",expiry:"Oct 18, 2014"},
{cid:"1080110085980496",name:"",s:"SWIR141018C00020000",e:"OPRA",p:"-",c:"-",b:"5.20",a:"6.40",oi:"0",vol:"-",strike:"20.00",expiry:"Oct 18, 2014"},
{cid:"795405966986565",name:"",s:"SWIR141018C00022500",e:"OPRA",p:"6.85",cs:"chb",c:"0.00",cp:"0.00",b:"2.95",a:"4.00",oi:"24",vol:"-",strike:"22.50",expiry:"Oct 18, 2014"},
{cid:"220284079078291",name:"",s:"SWIR141018C00025000",e:"OPRA",p:"1.32",cs:"chr",c:"-0.98",cp:"-42.61",b:"1.30",a:"1.45",oi:"385",vol:"28",strike:"25.00",expiry:"Oct 18, 2014"},
{cid:"361581164833900",name:"",s:"SWIR141018C00030000",e:"OPRA",p:"0.10",cs:"chr",c:"-0.15",cp:"-60.00",b:"0.10",a:"0.20",oi:"1825",vol:"87",strike:"30.00",expiry:"Oct 18, 2014"},
{cid:"312328058471168",name:"",s:"SWIR141018C00035000",e:"OPRA",p:"0.20",cs:"chb",c:"0.00",cp:"0.00",b:"-",a:"0.20",oi:"636",vol:"-",strike:"35.00",expiry:"Oct 18, 2014"},
{cid:"1092871044404603",name:"",s:"SWIR141018C00040000",e:"OPRA",p:"-",c:"-",b:"-",a:"0.15",oi:"0",vol:"-",strike:"40.00",expiry:"Oct 18, 2014"}],
underlying_id:"665077",underlying_price:25.59}
*/
