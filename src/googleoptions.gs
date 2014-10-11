//Returns an array with the bid in the first position and the ask in the second position
//Params:
//optionSymbol as a string, e.g. "SWIR141018P00012500"
//optionType as a string, e.g. "puts" OR "calls" (no other value is accepted)
function googleoptions(optionSymbol, optionType) {
  
  return [[0.1],[0.2]];
  
  //var optionSymbol = "SWIR141018P00012500"
  //var optionType = "puts"
  
  var result = [];
  if (optionType !== "puts" || optionType !== "calls") {
    result[0] = "Incorrect option type specified";
    return result;
  }
  
  var templateUrl = "http://www.google.com/finance/option_chain?q=|ticker|&output=json"
  var ticker = optionSymbol.substring(0, 4);
  var jsonUrl = templateUrl.replace("|ticker|", ticker);
  var jsonStream = UrlFetchApp.fetch(jsonUrl);
  var jsonData = fixGoogleOptionsJson(jsonStream.getContentText("UTF-8"));
  var jsonObject = JSON.parse(jsonData);
  
  var matchingOption = null;
  if (optionType === "puts") {
    matchingOption = getMatchingOption(jsonObject.puts, optionSymbol);
  }
  
  if (optionType === "calls") {
    matchingOption = getMatchingOptions(jsonObject.calls, optionSymbol);
  } 
  
  if (matchingOption == null) {
    result[0] = "Option symbol not found: " + optionSymbol;
    Logger.log(result);
    return result;
  }
  
  var bid = JSON.stringify(matchingOption.b).replace(/"/g, '');
  var ask = JSON.stringify(matchingOption.a).replace(/"/g, '');
  
  Logger.info("Found matching option " + JSON.stringify(matchingOption));
  Logger.info("bid: " + bid);
  Logger.info("ask: " + ask);
  
  result[0] = [bid, ask];
  
  return [[bid, ask]];
}

function getMatchingOption(options, symbol) {
  Logger.info("Searching for symbol: " + symbol);
  
  for (var i = 0, option; i < options.length; i++) {
    option = options[i];
    optionString = JSON.stringify(option.s);
    optionString = optionString.replace(/"/g, '');
    Logger.info("Checkign option: " + optionString);
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
