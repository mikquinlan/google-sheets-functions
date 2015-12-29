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
  
  
  var pastTradingDays = []
  
  var daysToSubtract = 1;
  while(pastTradingDays.length < daysInPast) {
    
    var date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysToSubtract);
    
    if(!isWeekend(date) && !containsDate(date, nonTradingDays2016NYSE)) {
      pastTradingDays.push(date);
    }
    daysToSubtract++;
  }
  
  Logger.log(pastTradingDays)
  
  return pastTradingDays;
}

function isWeekend(date) {
  var day = date.getDay();
  return (day == 6) || (day == 0); //6 is Saturday, 0 is Sunday
}

function containsDate(date, nonTradingDays) {
    var i;
    for (i = 0; i < nonTradingDays.length; i++) {
        if (nonTradingDays[i].getYear() === date.getYear()
          && nonTradingDays[i].getMonth() === date.getMonth()
          && nonTradingDays[i].getDay() === date.getDay()) {
            return true;
        }
    }

    return false;
}
