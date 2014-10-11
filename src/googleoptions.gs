//Returns an array with the bid in the first position and the ask in the second position
//Params:
//optionSymbol as a string, e.g. "SWIR141018P00012500"
function googleoptions(optionSymbol) {
  
  var optionSymbolRegEx = /^([A-Z]{1,5})([\d]{6})([P|C])[\d]{8}$/g;
  //We get dates back with just the two digit year and we need the full year for querying Google Finance's JSON API. 
  //Um, y21k bug. Sorry. :-/
  var centuryPrefix = "20";
  
  var match = optionSymbolRegEx.exec(optionSymbol);
  
  if(match === null) {
    return "Symbol is invalid. Must be of the correct format. You supplied: " + optionSymbol;
  }
  
  var ticker = match[1];
  var expiryYYMMDD = match[2];
  var optionType = match[3];
  
  Logger.log("optionType: " + optionType);
  Logger.log("Ticker: " + ticker);

  //Work out the CID, expiry yeah, month and day so we can query Google for the options for the correct month.
  //Ref: http://www.focalshift.com/2014/06/24/the-google-finance-api-is-still-ticking/  
  try {
    var cid = getCidForTicker(ticker);  
  } catch(err) {
    return "Could not get option info for ticker " + ticker + ". Is it valid?";
  }
  var expiryYearYY = expiryYYMMDD.substring(0, 2);
  var expiryMonthMM = expiryYYMMDD.substring(2, 4);
  var expiryDayDD = expiryYYMMDD.substring(4, 6);
  Logger.log("Year/month/day: " + expiryYearYY + "/" + expiryMonthMM + "/" + expiryDayDD);
  
  var optionsChainForMonthJson = getOptionsChainForMonth(cid, centuryPrefix.concat(expiryYearYY), expiryMonthMM, expiryDayDD);
  
  Logger.log("optionsChain: " + JSON.stringify(optionsChainForMonthJson));
  
  var matchingOption = null;
  if (optionType === "P") {
    matchingOption = getMatchingOption(optionsChainForMonthJson.puts, optionSymbol);
  }
  
  if (optionType === "C") {
    matchingOption = getMatchingOption(optionsChainForMonthJson.calls, optionSymbol);
  } 
  
  if (matchingOption === null) {
    return "Option symbol not found: " + optionSymbol;
  }
  
  var previousClose = JSON.stringify(matchingOption.p).replace(/"/g, '');;
  var open = '-';
  var bid = JSON.stringify(matchingOption.b).replace(/"/g, '');
  var ask = JSON.stringify(matchingOption.a).replace(/"/g, '');
  var strike = JSON.stringify(matchingOption.strike).replace(/"/g, '');
  var expiry = JSON.stringify(matchingOption.expiry).replace(/"/g, '');
  
  Logger.info("Found matching option " + JSON.stringify(matchingOption));
  Logger.info("previous close: " + previousClose);
  Logger.info("open: " + open);
  Logger.info("bid: " + bid);
  Logger.info("ask: " + ask);
  Logger.info("strike: " + strike);
  Logger.info("expiry: " + expiry);
  
  var parsedDate = new Date(expiry);
  var formattedExpiry = (parsedDate.getMonth() + 1) + "/" + parsedDate.getDate() + "/" + parsedDate.getFullYear();
  
  return [[previousClose, open, bid, ask, strike, formattedExpiry]];
}

function getTicker(optionSymbol) {
  var indexFirstDigit = optionSymbol.search(/\d/);
  Logger.log("indexFirstDigit: " + indexFirstDigit);
  var ticker = optionSymbol.substring(0, indexFirstDigit);
  Logger.log("Ticker: " + ticker);
}

function getCidForTicker(ticker) {
  var templateUrl = "http://www.google.com/finance/option_chain?q=|ticker|&type=All&output=json"  
  var jsonUrl = templateUrl.replace("|ticker|", ticker);
  var jsonStream = UrlFetchApp.fetch(jsonUrl);
  var jsonData = fixGoogleOptionsJson(jsonStream.getContentText("UTF-8"));
  var jsonObject = JSON.parse(jsonData);
  
  return jsonObject.underlying_id;
}

function getOptionsChainForMonth(cid, expiryYearYYYY, expiryMonthMM, expiryDayDD) {
  var templateUrl = "http://www.google.com/finance/option_chain?cid=|cid|&expd=|expd|&expm=|expm|&expy=|expy|&output=json";
  var jsonUrl = templateUrl.replace("|cid|", cid).replace("|expd|", expiryDayDD).replace("|expm|", expiryMonthMM).replace("|expy|", expiryYearYYYY);
  Logger.log("options chain json url: " + jsonUrl);
  var jsonStream = UrlFetchApp.fetch(jsonUrl);
  var jsonData = fixGoogleOptionsJson(jsonStream.getContentText("UTF-8"));
  return JSON.parse(jsonData);
}

function getMatchingOption(options, symbol) {
  Logger.info("Searching for symbol: " + symbol);
  
  for (var i = 0, option; i < options.length; i++) {
    option = options[i];
    optionString = JSON.stringify(option.s);
    optionString = optionString.replace(/"/g, '');
    Logger.info("Checking option: " + optionString);
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
