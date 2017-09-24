var APP_ID = "amzn1.ask.skill.d874d75e-d29d-4647-b685-4d26f63fe730",
    http = require('http'),
    https = require('https'),
    AlexaSkill = require('./AlexaSkill');

var MySkill = function () {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
MySkill.prototype = Object.create(AlexaSkill.prototype);
MySkill.prototype.constructor = MySkill;

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    var mySkill = new MySkill();
    mySkill.execute(event, context);
};

// ----------------------- Override AlexaSkill request and intent handlers -----------------------
MySkill.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    handleWelcomeRequest(response);
};

MySkill.prototype.intentHandlers = {
    "MicroStrategyReportActions": function (intent, session, response) {
        handleActiveWebSessionsCountRequest(intent, session, response);
    }
};

// -------------------------- Welcome Dialog--------------------------
function handleWelcomeRequest(response) {
        var speechOutput = {
            speech: "<speak> Welcome to your custom skill.</speak>",
            type: AlexaSkill.speechOutputType.SSML
        },
        repromptOutput = {
            speech: "What do you want to do?",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
    response.ask(speechOutput, repromptOutput);
}

//---------------------------MSTR STUFF ----------------------------------
function handleActiveWebSessionsCountRequest_old(intent, session, response) {
        var speechOutput = "HI!";
        response.tellWithCard(speechOutput, "MySkill", speechOutput)
}

function handleActiveWebSessionsCountRequest(intent, session, response) {

    makeActiveSessionsRequest(function callback(err, webserviceCall) {
        var speechOutput;
        var  mstrWebSessionCount =  0;
        if (err) {
            speechOutput = "I had a problem getting your session count, can you try again?";
        } else {
            console.log("Output Data::"+webserviceCall.data);
            /*for(var i = 0; i < webserviceCall.data.length; i++){
                var mstrSess = webserviceCall.data[i];

                if(mstrSess.projectName != "<Server>"){
                    mstrWebSessionCount++;
                }
            }*/
            if(mstrWebSessionCount == 0){
                speechOutput = "Currently, there are no active web connections.";
            }
            else{
                speechOutput = "Currently, there are " + mstrWebSessionCount +" active web connections.";
            }
        }

        response.tellWithCard(speechOutput, "MySkill", speechOutput);
    });
}

function makeActiveSessionsRequest(callback) {
  var env = "https://fpgm.solerainc.com:443/SoleraInc/asp/TaskAdmin.aspx?";
     var taskID = "EXECRPT001";
     var taskEnv = "xhr";
     var taskContentType = "json";
     var reportName = "Alexa_current_month_revenue";
     var endpoint = env + 'taskId='+taskID+'&taskEnv='+taskEnv+'&taskContentType='+taskContentType+'&ReportName='+reportName;


    https.get(endpoint, function (res) {
        var responseString = '';
        console.log('Status Code: ' + res.statusCode);

        if (res.statusCode != 200) {
            callback(new Error("Non 200 Response"));
        }

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            var responseObj = JSON.parse(responseString);
            console.log(responseObj);
            callback(null, responseObj);

        });
    }).on('error', function (e) {
        var errorObj = {"result" : "error"};
            callback(null, errorObj);
    });
}
