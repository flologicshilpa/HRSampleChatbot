'use strict';
const builder = require('botbuilder');


const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var Request = require("request");

//common variable
var i,intent="";

var accessToken = 'a8be5eed29a84393b073ec02b5cd5e79';  //Replace access token here
var baseUrl = "https://api.api.ai/v1/";


var inMemoryStorage = new builder.MemoryBotStorage();

//universal bot connection
const  bot = module.exports =  new builder.UniversalBot(connector, function (session, args) {
    
    session.beginDialog('startingDialog');

    //  var reply = createEvent("changeBackground", session.message.text, session.message.address);
    //     session.endDialog(reply);

 }).set('storage', inMemoryStorage); 

 

 //Get ticket Dialog
bot.dialog('startingDialog',[
    function (session, args, next) { 

       var text="hi";
        var requestData = {
         "query": text, 
          "lang": "en", 
          "sessionId":"123456"         
        }
        
        // Set the headers
        var headers = {'Content-Type': 'application/json; charset=utf-8','Authorization':'Bearer '+ accessToken} 

        // Configure the request
        var options = {
            url: baseUrl + "query?v=20150910",
            method: 'POST',
            headers: headers,
            json: requestData
        }  

        Request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {    
                
            
               setResponse(session,response);
            
             
                console.log("actula result",response.body.result.fulfillment.speech);
                // session.send(response.body.result.fulfillment.speech);
                // session.endDialog();
            }
            else{
               console.log("enddialog");
                  session.endDialog();
            }      
        });//end
  }//end function
           
])

function setResponse(session,response)
{

    session.send(response.body.result.fulfillment.speech);
    session.endDialog();
 
console.log("actula result",response.body.result.fulfillment.speech);
}