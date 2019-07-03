'use strict';
const builder = require('botbuilder');


const connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var Request = require("request");

//common variable
var i, intent = "";

var accessToken = 'a8be5eed29a84393b073ec02b5cd5e79';  //Replace access token here
var baseUrl = "https://api.api.ai/v1/";
var baseWebUrl = "https://flologicbots.com:105/api/";
var empCode = "78010182";


var inMemoryStorage = new builder.MemoryBotStorage();

//universal bot connection
const bot = module.exports = new builder.UniversalBot(connector, function (session, args) {
    session.beginDialog('startingDialog');
}).set('storage', inMemoryStorage);
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        message.membersAdded.forEach(function (identity) {
            if (identity.id == message.address.bot.id) {
                // Bot is joining conversation
                // - For WebChat channel you'll get this on page load.
                var reply = new builder.Message()
                        .address(message.address)
                        .text("Welcome to my page");
                bot.send(reply);
            } else {
                // User is joining conversation
                // - For WebChat channel this will be sent when user sends first message.
                // - When a user joins a conversation the address.user field is often for
                //   essentially a system account so to ensure we're targeting the right 
                //   user we can tweek the address object to reference the joining user.
                // - If we wanted to send a private message to teh joining user we could
                //   delete the address.conversation field from the cloned address.
                var address = Object.create(message.address);
                address.user = identity;
                var reply = new builder.Message()
                        .address(address)
                        .text("Hello %s", identity.name);
                bot.send(reply);
            }
        });
    }
});
//Get ticket Dialog
bot.dialog('startingDialog', [
    function (session, args, next) {
        var requestData = {
            "query": session.message.text,
            "lang": "en",
            "sessionId": "123456"
        }

        // Set the headers
        var headers = { 'Content-Type': 'application/json; charset=utf-8', 'Authorization': 'Bearer ' + accessToken }

        // Configure the request
        var options = {
            url: baseUrl + "query?v=20150910",
            method: 'POST',
            headers: headers,
            json: requestData
        }

        Request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var res_action = response.body.result.action;

                if (res_action === "balance") {
                    getLeaveBalance(session,response.body);
                } else {
                    setResponse(session, response.body);
                }
                
            }
            else {
                console.log("enddialog");
                session.endDialog();
            }
        });//end
    }//end function

])

function getLeaveBalance(session,val){

    var leaveBalance = baseWebUrl + "Leave/getLeaveBalance"

    var requestData = {
        "EmpCode": empCode, 
        "LEAVE_TYPE": val.result.parameters.leavetype
    }

    // Set the headers
    var headers = { 'Content-Type': 'application/json; charset=utf-8' }

    // Configure the request
    var options = {
        url: leaveBalance,
        method: 'POST',
        headers: headers,
        json: requestData
    }

    Request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            console.log(response.body);
            
            var sendMessage = new builder.Message(session);
            var attachments = [];
            
            var attachments=getCardsAttachmentsForLeavetype(response.body);
            sendMessage.attachments(attachments);
            session.send(sendMessage);
            session.endDialog();
          
        
            

          
           // setResponse(session, response.body);
        }
        else {
            console.log("enddialog");
            session.endDialog();
        }
    });
}

function setResponse(session, val) {
    session.send(val.result.fulfillment.speech);
    console.log("actula result", val.result.fulfillment.speech);
}



function getCardsAttachmentsForLeavetype(data)
{
    var attachments=[];
    var i;
    console.log(data.length);
    

    for(i=0;i<data.length;i++)
    {      
        var card = {
            'contentType': 'application/vnd.microsoft.card.adaptive',
            'content': {
                "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                "type": "AdaptiveCard",
                "version": "1.0",
                "body": [                    
                    {
                        "type": "Container",
                        "items": [
                            {
                                "type": "ColumnSet",
                                "columns": [
                                    {
                                        "type": "Column",
                                        "items": [
                                            {
                                                "type": "TextBlock",
                                                "size": "Medium",
                                                "weight": "Bolder",
                                                "text": "Available Leave Balance",
                                                "wrap": true
                                            }
                                        ],
                                        "width": "auto"
                                    }

                                ] }
                            ]
                    },
                    {
                        "type": "Container",
                        "seprator":"true",
                        "items": [
                            {
                            "type": "ColumnSet",
                            "columns": [
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "size": "Medium",
                                            "weight": "Bolder",
                                            "text": data[i].LEAVE_TYPE,
                                            
                                        },
                                    
                                    ],
                                    "width": 3
                                },
                                {
                                    "type": "Column",
                                    "items": [
                                        {
                                            "type": "TextBlock",
                                            "size": "Medium",                                           
                                            "text": ""+ data[i].LeaveBalance +"",
                                        
                                        }
                                    ],
                                    "width": 7
                                }
                           
                            ] }
                        ]
                    }  
                ]//body close
          
            }//content
            };
        attachments.push(card); 
    }
    return attachments;
}
    
