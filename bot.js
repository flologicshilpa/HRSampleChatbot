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
var startingid="";

var inMemoryStorage = new builder.MemoryBotStorage();

//universal bot connection
const bot = module.exports = new builder.UniversalBot(connector, function (session, args) {
    session.beginDialog('startingDialog');
}).set('storage', inMemoryStorage);


//Get ticket Dialog
bot.dialog('startingDialog', [
    function (session, args, next) {
        
        var jsonData = JSON.stringify(session.message);
        var jsonParse = JSON.parse(jsonData);
        var conid=jsonParse.address.id

        if(startingid=="")
        {
            startingid = getdatetime(conid);
        }
       
        
        var requestData = {
            "query": session.message.text,
            "lang": "en",
            "sessionId": startingid
        }

        console.log("Start Dialog----------------------------------",startingid);
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
                    getLeaveBalance(session, response.body);
                }
                else if (res_action == "leave") {
                    session.beginDialog('setLeaveOption');
                }
                else if (res_action == "approval") {
                    getApproval(session);
                }
                else if (res_action == "status") {
                    getStatus(session);
                }
                else if (res_action == "leaveapplied") {
                    setLeaveApply(session, response.body);
                }
                else if (res_action === "holiday") {
                    getHolidayList(session, response.body);
                }
                else if (res_action === "travelPolicy") {
                    setTravelPolicy(session, response.body);
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

]);
function getdatetime(conid)
{
    var currentdate = new Date(); 
        var datetime =   currentdate.getDate() 
                        + (currentdate.getMonth()+1)  
                        + currentdate.getFullYear() 
                        + currentdate.getHours()   
                        + currentdate.getMinutes()
                        + currentdate.getSeconds();


     
       var id= conid + "_"+ datetime;
        return id;
}

bot.dialog('setLeaveOption', [
    function (session, args, next) {
        builder.Prompts.choice(session, "        What I can help you with today?        ", "Leave Balance|Approval List|My Leave Status|Apply for Leave|Leave Policy", { listStyle: builder.ListStyle.button });
    },
    function (session, results) {

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
                    getLeaveBalance(session, response.body);
                }
                else if (res_action === "approval") {
                    getApproval(session);
                }
                else if (res_action === "status") {
                    getStatus(session);
                }
                else if (res_action === "leaveapplied") {
                    setLeaveApply(session, response.body);
                }
                else if (res_action === "holiday") {
                    getHolidayList(session, response.body);
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

function getLeaveBalance(session, val) {

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

            var attachments = getCardsAttachmentsForLeavetype(response.body);
            sendMessage.attachments(attachments);
            session.send(sendMessage);
            startingid="";
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

    var headers = { 'Content-Type': 'application/json; charset=utf-8' }

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
            var attachments = getCardsAttachmentsForApproval(response.body);
            sendMessage.attachments(attachments);
            session.send(sendMessage); 
            startingid="";           
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

    var headers = { 'Content-Type': 'application/json; charset=utf-8' }

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
            var attachments = getCardsAttachmentsForLeaveStatus(response.body);
            sendMessage.attachments(attachments);
            session.send(sendMessage);
            startingid="";
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

function setLeaveApply(session, data) {
    var actioncomp = data.result.actionIncomplete;
    console.log("actioncomp", actioncomp);

    if (actioncomp == false) {
        coformationLeaveSubmit(session, data);
    } else {
      
        session.send(data.result.fulfillment.speech);
        //setResponse(session, data);
    }

}

function coformationLeaveSubmit(session, data) {
    session.conversationData.formdate = data.result.parameters.fromdate;
    session.conversationData.todate = data.result.parameters.todate;
    session.conversationData.leavetype = data.result.parameters.leavetype;
    // //respose = $.parseJSON(data);
    // var formdate = data.result.parameters.fromdate;
    var todate = data.result.parameters.todate;
    // var leavetype = data.result.parameters.leavetype;

    if (todate == "") {
        // todate = formdate;
        session.conversationData.todate = session.conversationData.formdate
    }

    session.beginDialog('applyforleave');


}

bot.dialog('applyforleave', [
    function (session, args, next) {
        var textmessage = "Your leave request for " + session.conversationData.leavetype + "\r\n Start Date: **" + session.conversationData.formdate + "** \r\n To Date: **" + session.conversationData.todate + "**";
        // session.send(textmessage);
        builder.Prompts.confirm(session, textmessage + "\r\n will be processed? (Y/N)");
    },
    function (session, results) {
        if (results.response == true) {
            session.send("Your leave application submited");
            
            session.endDialog();
        }
        else {
            session.send("Your leave application not submited");
           
            session.endDialog();
        }
    }

]);

function setResponse(session, val) {
    session.send(val.result.fulfillment.speech);
    console.log("actula result", val.result.fulfillment.speech);
    startingid="";
    session.endDialog();
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
                holidayList(session, response);
            }
        }
        else {
            console.log("enddialog");
            session.endDialog();
        }
    });
}

function holidayList(session, data) {

    var data = data.body;

    var attachments = [];
    var i;
    for (i = 0; i < data.length; i++) {
        var card = {
            "contentType": "application/vnd.microsoft.card.thumbnail",
            "content": {
                "title": "**" + data[i].holidayName + "**",
                "subtitle": data[i].holidaydate + "(" + data[i].Day + ")",
                "text": data[i].information,
                "images": [
                    {
                        "type": "Image",
                        "style": "Person",
                        "size": "small",
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


function getCardsAttachmentsForLeavetype(data) {
    var attachments = [];
    var i;
   

    for (i = 0; i < data.length; i++) {
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

                                ]
                            }
                        ]
                    },
                    {
                        "type": "Container",
                        "seprator": "true",
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
                                                "text": "" + data[i].LeaveBalance + "",

                                            }
                                        ],
                                        "width": 7
                                    }

                                ]
                            }
                        ]
                    }
                ]//body close

            }//content
        };
        attachments.push(card);
    }
    return attachments;
}

function getCardsAttachmentsForApproval(data) {
    var attachments = [];
    var i;
    console.log(data.length);


    for (i = 0; i < 10; i++) {
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
                                            },
                                            {
                                                "type": "TextBlock",
                                                "text": (i+1) + "/10",                                                               
                                                "color": "black",
                                                "weight": "bolder",
                                                "size": "medium"
                                            }
                                        ],
                                        "width": "stretch"
                                    }

                                ]
                            }
                        ]
                    },
                    {
                        "type": "Container",
                        "separator": true,
                        "type": "FactSet",
                        "facts": [
                            {
                                "value": data[i].DETAIL.replace('<br>', '')
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
                        "data":"RequestForApproval"                      
                      
                    },
                    {
                        "type": "Action.Submit",
                        "title": "Reject",
                        "data":"RequestForReject" 
                    }]


            }//content
        };
        attachments.push(card);
    }
    return attachments;
}

function getCardsAttachmentsForLeaveStatus(data) {
    var attachments = [];
    var i;
    for (i = 0; i < 10; i++) {

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
                                                "text": data[i].DETAIL.replace('<br>', ''),
                                                "wrap": true
                                            },
                                             {
                                                "type": "TextBlock",
                                                "text": (i+1) + "/10",                                                               
                                                "color": "black",
                                                "weight": "bolder",
                                                "size": "medium"
                                            }
                                        ],
                                        "width": "stretch"
                                    }

                                ]
                            }
                        ]
                    },
                    {
                        "type": "Container",
                        "separator": true,
                        "type": "FactSet",
                        "facts": [
                            {
                                "value": data[i].EmpCode
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

bot.dialog('RequestForApproval', [
    function (session, args, next)
        {
            session.send("Your request submited sucessfully");
            session.endDialog();
        } 
])
.triggerAction({
    matches: /RequestForApproval/i
});

bot.dialog('RequestForReject', [
    function (session, args, next)
        {
            session.send("Your request not submited at this time");
            session.endDialog();
        } 
])
.triggerAction({
    matches: /RequestForReject/i
});

//travel Policy

function setTravelPolicy(session, data) {
    var actioncomp = data.result.actionIncomplete;
    console.log("actioncomp", data);

    if (actioncomp == false) {
        var traveltype = data.result.parameters.traveltype;
        console.log("sdfs",traveltype);
        var mes = setTravelPolicyDetails(session,traveltype);
        session.send(mes);       
        session.endDialog();
    } else {
        session.beginDialog('setTravelPolicy');

    }
}

bot.dialog('setTravelPolicy', [
    function (session, args, next) {
        builder.Prompts.choice(session, "        What I can help you with today?        ", "Air Travel|Car Rental|Personal Car|Taxis|Hotels|Meals", { listStyle: builder.ListStyle.button });
    },
    function (session, results) {
        var traveltype = results.response.entity;
        var mes = setTravelPolicyDetails(session,traveltype);
        startingid="";
        session.send(mes);       
        session.endDialog();
    }
    
]);

function setTravelPolicyDetails(session,data) {

    var traveltype = data;
    console.log("sdfghjdsgfjhdsfgdsjhfgdsfgdsh",traveltype);
    var jsonLeavePolicy = {
        "traveltype": {
            "Air Travel": [
                { "parameter": "3.1 All employees traveling via air carrier must utilize Lowest Fare Routing (LFR).  LFR is quoted logical lowest fare for the business trip, which will (where possible):" },
                { "parameter": "a) Provide cost savings for the round trip air ticket." },
                { "parameter": "b) Result in total layover time not exceeding one hour." },
                { "parameter": "c) Increase the one-way total elapsed trip time by no more than two and one-half hours." },
                { "parameter": "d) Require no more than one interim stop each way." },
                { "parameter": "3.2 Exceptions to this policy statement will be allowed with approval by the employees’ supervisor so that additional cost is authorized." },
            ],
            "Car Rental": [
                { "parameter": "4.1 Please note that car rental discounts are base on volume.  The travel agent will be able to tell you which rental agency we use at the time you make your reservations." },
                { "parameter": "4.2 Insurance should not be purchased from the rental agency and will not be reimbursed.  All drivers must hold a valid drivers license or a car may not be rented." },
                { "parameter": "4.3 Car rentals are generally the most expensive mode of transportation and should only be used when the nature of the trip or the locations of the customer being visited is such that the use of local transportation (i.e. taxis or limousines ) is not practical or would be more expensive." }
            ],
            "Personal Car": [
                { "parameter": "Hmmm.. I guess I am not trained to answer this question. I will try my best next time!" },
            ],
            "Taxis": [
                { "parameter": "Hmmm.. I guess I am not trained to answer this question. I will try my best next time!" },
            ],
            "Hotels": [
                { "parameter": "Hmmm.. I guess I am not trained to answer this question. I will try my best next time!" },
            ],
            "Meals": [
                { "parameter": "Hmmm.. I guess I am not trained to answer this question. I will try my best next time!" },
            ]
        }
    }
    if (jsonLeavePolicy) {

        var value = "";
        var result = "";
        var leavePolicy = "**" + traveltype + "**" + "\r\n";
        var val = jsonLeavePolicy.traveltype[traveltype];
        console.log("length",val.length);
        for (i = 0; i < val.length; i++) {
            leavePolicy = "\r\n" + leavePolicy + "\r\n" + val[i].parameter;
        }        
    }  
    console.log("leavepolicy",leavePolicy);
    return leavePolicy;
}
