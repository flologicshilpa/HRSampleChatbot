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
                }
                else if(res_action=="leave")
                {
                    session.beginDialog('setLeaveOption');
                }
                else if(res_action=="approval")
                {
                    getApproval(session);
                }
                else if(res_action=="status")
                {
                    getStatus(session);
                }
                else if(res_action=="leaveapplied")
                {
                        setLeaveApply(session,response.body);
                }  
                else if (res_action === "holiday") {
                    getHolidayList(session,response.body);
                } 
                else {
                    setResponse(session,response.body);
                }
                
            }
            else {
                console.log("enddialog");
                session.endDialog();
            }
        });//end   
    }

]);

bot.dialog('setLeaveOption', [
    function (session, args, next) {
        builder.Prompts.choice(session, "        What I can help you with today?        ", "Leave Balance|Approval List|My Leave Status|Apply for Leave|Leave Policy", { listStyle: builder.ListStyle.button });
    },
    function(session,results){

      var str = results.response.entity;
      var requestData = {
        "query": str,
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
            }
            else if(res_action=="approval")
            {
                getApproval(session);
            }  
            else if(res_action=="status")
            {
                    getStatus(session);
            }  
            else if(res_action=="leaveapplied")
            {
                    setLeaveApply(session,response.body);
            }      
            else {
                setResponse(session, response.body);
            }
            
        }
        else {
            console.log("enddialog");
            session.endDialog();
        }
    });//end           
    }
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

//approval
function getApproval(session) {

    var requestData = {
        "EmpCode": "78010125", 
         "ProcessType": "Leave"
    }

    var headers = { 'Content-Type': 'application/json; charset=utf-8'}

    // Configure the request
    var options = {
        url: baseWebUrl + "User/gettaskList",
        method: 'POST',
        headers: headers,
        json: requestData
    }
 
    Request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            console.log(response.body);
            
            var sendMessage = new builder.Message(session);
            var attachments = [];
            sendMessage.attachmentLayout(builder.AttachmentLayout.carousel);
            var attachments=getCardsAttachmentsForApproval(response.body);
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

//Get Leave Status

function getStatus(session) {

    var requestData = {
        EmpCode: empCode, 
        ProcessType: "Leave"
    }

    var headers = { 'Content-Type': 'application/json; charset=utf-8'}

    // Configure the request
    var options = {
        url: baseWebUrl + "User/getPendingTaskList",
        method: 'POST',
        headers: headers,
        json: requestData
    }
 
    Request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {

            console.log(response.body);
            
            var sendMessage = new builder.Message(session);
            var attachments = [];
            sendMessage.attachmentLayout(builder.AttachmentLayout.carousel);
            var attachments=getCardsAttachmentsForLeaveStatus(response.body);
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

//apply for leave

function setLeaveApply(session,data)
{
    var actioncomp = data.result.actionIncomplete;
    console.log("actioncomp",actioncomp);

    if (actioncomp == false) {
        coformationLeaveSubmit(session,data);
    } else {
        setResponse(session,data);
    }

}

function coformationLeaveSubmit(session,data)
{
    session.conversationData.formdate=data.result.parameters.fromdate;
    session.conversationData.todate=data.result.parameters.todate;
    session.conversationData.leavetype=data.result.parameters.leavetype;
    // //respose = $.parseJSON(data);
    // var formdate = data.result.parameters.fromdate;
     var todate = data.result.parameters.todate;
    // var leavetype = data.result.parameters.leavetype;

    if (todate == "") {
       // todate = formdate;
        session.conversationData.todate=session.conversationData.formdate
    }

    session.beginDialog('applyforleave');
    
    
}

bot.dialog('applyforleave', [
    function (session, args, next) {
        var textmessage="Your leave request for "+  session.conversationData.leavetype +"\r\n Start Date: **"+ session.conversationData.formdate + "** \r\n To Date: **"+session.conversationData.todate +"**";
        // session.send(textmessage);
         builder.Prompts.confirm(session,textmessage +"\r\n will be processed? (Y/N)"); 
    },
    function(session,results){      
      if(results.response==true)
      {
          session.send("Your leave application submited");
          session.endDialog();
      }
      else
      {
        session.send("Your leave application not submited");
        session.endDialog();
      }
    }
 
]);

function setResponse(session,val) {
    session.send(val.result.fulfillment.speech);
    console.log("actula result", val.result.fulfillment.speech);
}

//holiday code

function getHolidayList(session, val) {
    var date = "", month = "", holidaytype = "", currentmonth = "", commonentity = "", dateperiod = "";
    date = val.result.parameters.date;
    month = val.result.parameters.month;
    holidaytype = val.result.parameters.holidaytype;
    commonentity = val.result.parameters.commonentity;
    dateperiod = val.result.parameters.currentmonth;

    if (dateperiod !== "" && dateperiod !== undefined) {
        var dateres = dateperiod.substr(0, 10);
        var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Non", "Dec"
        ];
        var d = new Date(dateres);
        currentmonth = monthNames[d.getMonth()];
    }

    if (month !== "" && month !== undefined) {
        currentmonth = month;
    }

    var urlHoliday = baseWebUrl + "Leave/getHolidayList"

    var requestData = {
        "code": holidaytype,
        "holidaydate": date,
        "monthname": currentmonth,
        "parameter1": commonentity
    }

    // Set the headers
    var headers = { 'Content-Type': 'application/json; charset=utf-8' }

    // Configure the request
    var options = {
        url: urlHoliday,
        method: 'POST',
        headers: headers,
        json: requestData
    }

    Request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (date !== "" && date !== undefined) {
                holidayList(session, response);
            } else if (currentmonth !== "" && currentmonth !== undefined) {
                holidayList(session, response);
            } else if (commonentity !== "" && commonentity !== undefined) {
                holidayList(session, response);
            } else if (holidaytype !== "" && holidaytype !== undefined) {
                holidayList(session, response);
            } else {
                holidayListAll(session, response);
            }
        }
        else {
            console.log("enddialog");
            session.endDialog();
        }
    });
}

function holidayList(session, data) {
   
    var data=data.body;
    console.log("holidaylis........................................................",data);
    var attachments=[];
    var i;
    for(i=0;i<data.length;i++)
    {
        var card = {
            "contentType": "application/vnd.microsoft.card.hero",
            "content": {
                "title": "**"+ data[i].holidayName + "**",
                "subtitle": data[i].holidaydate +"(" + data[i].Day + ")",
                "text":data[i].information,
                "images": [
                    {
                        "url": data[i].ImageUrl
                    }
                ]
            }
        }
        attachments.push(card); 

    }


    var sendMessage = new builder.Message(session);
    sendMessage.attachments(attachments);
    session.send(sendMessage);
    session.endDialog();   
    

}

function holidayListAll(session, data) {
    console.log("holidaylis=====================");
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
    
function getCardsAttachmentsForApproval(data)
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
                                                "text": data[i].EMPLOYEE_NAME,
                                                "wrap": true
                                            }                                           
                                        ],
                                        "width": "stretch"
                                    }                                   

                                ] }
                            ]
                    },
                    {
                        "type": "Container",
                        "separator": true,
                        "type": "FactSet",
                        "facts": [
                          {
                            "value":data[i].DETAIL 
                          },
                          {
                            "value": data[i].HEADER_INFO 
                          },
                          {
                            "value": data[i].STEP_NAME 
                          },
                          {
                            "value": data[i].TARGET_DATE 
                          }
                        ],
                        
                    },
                     
                ],//body
                "actions": [
                    {
                      "type": "Action.Submit",
                      "title": "Approve",                     
                    },
                    {
                        "type": "Action.Submit",
                        "title": "Reject",                     
                    }]
                  
                
                }//content
            };
            attachments.push(card);  
    }
    return attachments;
}

function getCardsAttachmentsForLeaveStatus(data)
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
                                                "text": data[i].DETAIL,
                                                "wrap": true
                                            }                                           
                                        ],
                                        "width": "stretch"
                                    }                                   

                                ] }
                            ]
                    },
                    {
                        "type": "Container",
                        "separator": true,
                        "type": "FactSet",
                        "facts": [
                          {
                            "value":data[i].EmpCode  
                          },
                          {
                            "value": data[i].HEADER_INFO 
                          },
                          {
                            "value": data[i].ASSIGN_DATE 
                          }                          
                        ]                        
                    }                     
                ]              
                }//content
            };
            attachments.push(card);  
    }
    return attachments;

}
