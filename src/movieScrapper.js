//
// Small web scrapping exercise implemented for a freelancer interview
// A node script that gets the weekly programming for a cinema (odeonstar)
// 
// Resulst must be returned as a JSON object with the following format:
//
// [
//   { movie: <title>,
//     date: <screening_date> in DD/MM/YYYYTHH:mm format
//   }
// ]
// 
// An object must be added for every movie screening, and 
// Moment.js should be used to handle dates
//
// usage;
// $> node movieScrapper.js > jsonData.json
//

let request = require('request');
let cheerio = require('cheerio');
let moment = require('moment');

// we need this map to create the ISO strings used to create moment dates avoiding deprecation warnings
const monthsToNumbers = new Map([
  ['Jan', '01'],
  ['Feb', '02'],
  ['Mar', '03'],
  ['Apr', '04'],
  ['May', '05'],
  ['Jun', '06'],
  ['Jul', '07'],
  ['Aug', '08'],
  ['Sep', '09'],
  ['Oct', '10'],
  ['Nov', '11'],
  ['Dec', '12']
]);

const targetUrl = 'http://www.odeonstar.com.au/session-times/';

let options = {
  headers: {'user-agent': 'node.js'}
};

// GET movies site sessions page
request(targetUrl, options, function (error, response, html) {
  if (!error && response.statusCode == 200) {
    let $ = cheerio.load(html);
    let jsonResult = [];
    
    // get every movie block
    $('div.movie-content-column').each(function(i, element) {
      
      // get title
      let title = $(this).children('span.movie-title').text();
      
      // get sessions data table
      let sessions = $(this).children('span.movie-sessions').children('table.show-on-desktop').children('tbody').children('tr');
      
      // now we need an item for every movie date in every table row
      $(sessions).each(function(i, element) {
        // get this row day and hours
        let sessionDate = $(this).children('.date').text();
        let hours = $(this).children(':not(.date)');
        
        // we add one item for each hour
        $(hours).each(function(i, element) {
          if ( $(this).text().length > 1 ) {
            
            // we need to format the hours, removing 'noon' in favor of 'pm', and substituting '.' with ':'
            let formattedHour = ($(this).text()).split('.').join(':');
            if (formattedHour.includes('noon')) {
              formattedHour = formattedHour.split('noon')[0] + ':00am';
            }
            
            // lets format the day and month
            let day = sessionDate.split(' ')[1].replace(/\D/g,'');
            day = (day < 10) ? '0' + day : day;
            let month = sessionDate.split(' ')[2].substring(0,3);
            
            // lets format hours and minutes
            // the hour should be casted from am/pm notation to 24 hours notation
            // we can simply multiply by 1 to get an integer from a string
            let hour = formattedHour.includes('pm') ? (formattedHour.split(':')[0]*1) + 12 : formattedHour.split(':')[0];
            let minutes = formattedHour.split(':')[1].replace(/\D/g,'');
            
            // lets format our final date string, to create a moment date
            let dateString = (new Date).getFullYear() + '-' + monthsToNumbers.get(month) + '-' + day + ' ' + hour + ':' + minutes;
            let momentDate = moment(dateString).format('DD/MM/YYYYTHH:mm');
            
            // finally, we add a new object to the results JSON
            let sessionObj = {
              movie: title,
              date: momentDate
            };
            jsonResult.push(sessionObj);
          }
        });
      });
    });
    console.log(JSON.stringify(jsonResult, null, ' '));
  }
});
