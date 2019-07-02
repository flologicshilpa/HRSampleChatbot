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
            
            // var sendMessage = new builder.Message(session);
            // var attachments = [];
            
            // var attachments=getCardsAttachmentsForLeavetype(response.body);
            // sendMessage.attachments(attachments);
            // session.send(sendMessage);
            // session.endDialog();
            var card = {
                "contentType": "application/vnd.microsoft.card.adaptive",
                "content": {
                    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                    "type": "AdaptiveCard",
                    "version": "1.0",
                    "body": [
                        {
                            "type": "Container",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "text": "Publish Adaptive Card schema",
                                    "weight": "bolder",
                                    "size": "medium"
                                },
                                {
                                    "type": "ColumnSet",
                                    "columns": [
                                        {
                                            "type": "Column",
                                            "width": "auto",
                                            "items": [
                                                {
                                                    "type": "Image",
                                                    "url": "https://pbs.twimg.com/profile_images/3647943215/d7f12830b3c17a5a9e4afcc370e3a37e_400x400.jpeg",
                                                    "size": "small",
                                                    "style": "person"
                                                }
                                            ]
                                        },
                                        {
                                            "type": "Column",
                                            "width": "stretch",
                                            "items": [
                                                {
                                                    "type": "TextBlock",
                                                    "text": "Matt Hidinger",
                                                    "weight": "bolder",
                                                    "wrap": true
                                                },
                                                {
                                                    "type": "TextBlock",
                                                    "spacing": "none",
                                                    "text": "Created {{DATE(2017-02-14T06:08:39Z, SHORT)}}",
                                                    "isSubtle": true,
                                                    "wrap": true
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            "type": "Container",
                            "items": [
                                {
                                    "type": "TextBlock",
                                    "text": "Now that we have defined the main rules and features of the format, we need to produce a schema and publish it to GitHub. The schema will be the starting point of our reference documentation.",
                                    "wrap": true
                                },
                                {
                                    "type": "FactSet",
                                    "facts": [
                                        {
                                            "title": "Board:",
                                            "value": "Adaptive Card"
                                        },
                                        {
                                            "title": "List:",
                                            "value": "Backlog"
                                        },
                                        {
                                            "title": "Assigned to:",
                                            "value": "Matt Hidinger"
                                        },
                                        {
                                            "title": "Due date:",
                                            "value": "Not set"
                                        }
                                    ]
                                }
                            ]
                        }
                    ],
                    "actions": [
                        {
                            "type": "Action.ShowCard",
                            "title": "Set due date",
                            "card": {
                                "type": "AdaptiveCard",
                                "body": [
                                    {
                                        "type": "Input.Date",
                                        "id": "dueDate"
                                    }
                                ],
                                "actions": [
                                    {
                                        "type": "Action.Submit",
                                        "title": "OK"
                                    }
                                ]
                            }
                        },
                        {
                            "type": "Action.ShowCard",
                            "title": "Comment",
                            "card": {
                                "type": "AdaptiveCard",
                                "body": [
                                    {
                                        "type": "Input.Text",
                                        "id": "comment",
                                        "isMultiline": true,
                                        "placeholder": "Enter your comment"
                                    }
                                ],
                                "actions": [
                                    {
                                        "type": "Action.Submit",
                                        "title": "OK"
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        
            var msg = new builder.Message()
                .addAttachment(card)
            session.send(msg);
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



// function getCardsAttachmentsForLeavetype(data)
// {
//     var attachments=[];
//     var i;
//     console.log(data.length);
    

//     for(i=0;i<data.length;i++)
//     {      
//         var card = {
//             'contentType': 'application/vnd.microsoft.card.adaptive',
//             'content': {
//                 "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
//                 "type": "AdaptiveCard",
//                 "version": "1.0",
//                 "body": [                    
//                     {
//                         "type": "Container",
//                         "items": [
//                             {
//                                 "type": "ColumnSet",
//                                 "columns": [
//                                     {
//                                         "type": "Column",
//                                         "items": [
//                                             {
//                                                 "type": "TextBlock",
//                                                 "size": "Medium",
//                                                 "weight": "Bolder",
//                                                 "text": "Available Leave Balance",
//                                                 "wrap": true
//                                             }
//                                         ],
//                                         "width": "auto"
//                                     }

//                                 ] }
//                             ]
//                     },
//                     {
//                         "type": "Container",
//                         "seprator":"true",
//                         "items": [
//                             {
//                             "type": "ColumnSet",
//                             "columns": [
//                                 {
//                                     "type": "Column",
//                                     "items": [
//                                         {
//                                             "type": "TextBlock",
//                                             "size": "Medium",
//                                             "weight": "Bolder",
//                                             "text": "test",
                                            
//                                         },
                                    
//                                     ],
//                                     "width": 3
//                                 },
//                                 {
//                                     "type": "Column",
//                                     "items": [
//                                         {
//                                             "type": "TextBlock",
//                                             "size": "Medium",                                           
//                                             "text": "30",
                                        
//                                         }
//                                     ],
//                                     "width": 7
//                                 }
                           
//                             ] }
//                         ]
//                     }  
//                 ]//body close
          
//             }//content
//             };
//         attachments.push(card); 
//     }
//     return attachments;
// }
    
