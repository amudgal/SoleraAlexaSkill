http = require('http');
https = require('https');

var reports = {
  "current month revenue":{
    "description":"This report gives you the current periods Revenue",
    "revenue":"Revenue is 120 million"
  },
  "region report":{
    "description":"This report gives you the Regional Revenue for current Period",
    "revenue":"Revenue is 20 million"
  }
}
var session = "";
var rpName = "";
// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function(event,context) {
  try{
    console.log("event.session.application.applicationId=" + event.session.application.applicationId);
    if(event.session.application.applicationId !=="amzn1.ask.skill.d874d75e-d29d-4647-b685-4d26f63fe730"){
      context.fail("invalid Application Id");
    }
     if(event.session.new){
       onSessionStarted({requestId: event.request.requestId},event.session);
       console.log("New Session established");
     }
     if(event.request.type === "LaunchRequest"){
       console.log("Launch Request Initiated");
       onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
     }else if(event.request.type === "IntentRequest"){
       console.log("Intent Request Initiated");
       onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
     }else if(event.request.type === "SessionEndedRequest"){
       onSessionEnded(event.request, event.session);
            context.succeed();
     }
  }catch(e){
    console.log('Error Captured' +e);
    context.fail("Exception: " + e);
  }
}

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    // add any session init logic here
}

function onLaunch(launchRequest, session, callback) {

    getWelcomeResponse(callback)
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {

    var intent = intentRequest.intent
    var intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
    if (intentName == "MicroStrategyReportActions") {
        console.log("Going in the Handle MSTR Response");
        handleMicroStrategyResponse(intent, session, callback);
    } else if (intentName == "AMAZON.YesIntent") {
        handleYesResponse(intent, session, callback)
    } else if (intentName == "AMAZON.NoIntent") {
        handleNoResponse(intent, session, callback)
    } else if (intentName == "AMAZON.HelpIntent") {
        handleGetHelpRequest(intent, session, callback)
    } else if (intentName == "AMAZON.StopIntent") {
        handleFinishSessionRequest(intent, session, callback)
    } else if (intentName == "AMAZON.CancelIntent") {
        handleFinishSessionRequest(intent, session, callback)
    } else {
        throw "Invalid intent"
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {

}

function getWelcomeResponse(callback) {
    var speechOutput = "Welcome to MicroStrategy! I can tell you about all the reports you can run: "+
    "Choices are Current month revenue and region report" +
    "Which report are you interested in running?"

    var reprompt = "Which Report are you interested in? current month revenue or region report."

    var header = "MicroStrategy Facts!"

    var shouldEndSession = false

    var sessionAttributes = {
        "speechOutput" : speechOutput,
        "repromptText" : reprompt
    }

    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession))

}


function handleMicroStrategyResponse(intent, session, callback) {
    var report = intent.slots.reports.value.toLowerCase()
    console.log("Intent:::::" + report);
    var repromptText = "Do you want to run any other report?"
    var header = capitalizeFirst(report);
    var speechOutput = "default";
    console.log("About to trigger report");
    rpName = report;
    makeReportRequest(function callback(err,wsCall){
         speechOutput = "Output got for report";
         console.log("O/P::"+wscall);

    })
    //var speechOutputJSON = makeReportRequest(report);
    console.log("output JSONL::");

    /*if (!reports[report]) {
        var speechOutput = "There is no such report listed. Try asking about another like Current Month revenue."
        var repromptText = "Try asking about another Report"
        var header = "Not Famous Enough"
    } else {
        var descrition = reports[report].description
        var revenue = reports[report].revenue
        var speechOutput = capitalizeFirst(report) + " " + descrition + " and " + revenue + ". Do you want to check more reports?"
        var repromptText = "Do you want to run any other report?"
        var header = capitalizeFirst(report)
    }
    */
    console.log("Triggered report");
    var shouldEndSession = false

    callback(session.attributes, buildSpeechletResponse(header, speechOutput, repromptText, shouldEndSession))
}

function handleYesResponse(intent, session, callback) {
    var speechOutput = "Great! Which Report? You can find out about Current month revenue or region report"
    var repromptText = speechOutput
    var shouldEndSession = false

    callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))
}

function handleNoResponse(intent, session, callback) {
    handleFinishSessionRequest(intent, session, callback)
}

function handleGetHelpRequest(intent, session, callback) {
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }

    var speechOutput = "You can run reports  " +
    "the reports available are Current month revenue at present."

    var repromptText = speechOutput

    var shouldEndSession = false

    callback(session.attributes, buildSpeechletResponseWithoutCard(speechOutput, repromptText, shouldEndSession))

}
function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye! Thank you for using MicroStrategy!", "", true));
}

// ------- Helper functions to build responses for Alexa -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function capitalizeFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}


function BuildSampleWebRequest(intent, session, response) {
        var speechOutput = "Hi from Amit!";
        response.tellWithCard(speechOutput, "MySkill", speechOutput)
}



function makeReportRequest(callback) {
 var env = "https://fpgm.solerainc.com:443/SoleraInc/asp/TaskAdmin.aspx?";
    var taskID = "EXECRPT001";
    var taskEnv = "xhr";
    var taskContentType = "json";
    var reportName = "Alexa - " + rpName;
    var responseObj = "";
    var endpoint = env + 'taskId='+taskID+'&taskEnv='+taskEnv+'&taskContentType='+taskContentType+'&ReportName='+reportName;
    console.log("makeReportRequest::Inside " + endpoint);
    console.log("Making https request .....");
    /*https.get(options, function(res) {
      console.log(res);
      console.log("For response ::" + res.statusCode);
    }).on('error',function(e){
      console.log("Got Error:" + e.message);
    });
    console.log("Made https Request ......");*/
    var output = "";
    try{
      var req = https.request(endpoint, function(res){
        res.setEncoding('utf-8');
        var responseString = '';
        res.on('data', function(data) {
               responseString += data;
        });
        res.on('end', function() {
          output = JSON.parse(responseString);
          console.log(responseString);
        });
      });
    }catch(e){console.log("Error:" +e);}
    console.log(req + output);

    /*https.get(endpoint, function (res) {
        var responseString = '';
        //console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            console.log("Error Occured");
            callback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            responseObj = JSON.parse(responseString);
            callback(null, responseObj);

        });
        console.log("output from web request::"+responseString);
    }).on('error', function (e) {
        console.log("Error initiated .....");
        var errorObj = {"result" : "error"};
        calback(null,errorObj);
    });*/
}
