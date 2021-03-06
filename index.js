'use strict';
/*
 Alexa Skill for delivering the user's "Morning Dose" of information to the IBM watson workplace user.
 App interacts with github,
 v1.0.0
 */
var Alexa = require('alexa-sdk');
var morningDose = require('morningDose');
var watson = require('watson');
var APP_ID = undefined;

var handlers = {
    'LaunchRequest': function () {
        console.log('LaunchRequest');
        // this.attributes['startedSessionCount'] += 1;
        var userId = this.event.session.user.userId;
        var userToken = this.event.session.user.accessToken + "";
        console.log('user token : ' + userToken);
        if (userToken != undefined && userToken != null) {
            var workspaceId = this.attributes[userToken];
            if (workspaceId != undefined && workspaceId != null) {
                watson.getMessages(this, userToken, workspaceId);
            } else {
                // Prompt user for workspace.
                watson.configureWorkspace(this, userToken);
            }

        } else {
            // Tell user to authenticate in alexa app.
            watson.configureAuth(this, userId);
        }
    },
 
   'LogFoodIntent': function() {
      this.emit(':ask', 'Ok. What did you eat?', 'Ok. What did you eat?');
   },
 
  'GrilledCheeseIntent': function() {
      this.emit(':ask', 'One grilled cheese sandwich at 8:18 p.m. recorded. It has 350 calories, 10 grams of carbohydrates, and 2 grams of sugar. Would you like to do something else?', 'Can you please repeat that?');
   },
 
  'MonitorGlucoseIntent': function() {
    this.emit(":ask","Ok. Your last glucose reading was at 5:15 p.m. It was 70 milligrams per deciliter. Would you like to know more?","Would you like to know more?");
  },
 
  'TrendIntent': function() {
   this.emit(":ask","Ok. For the past 7 days, your average glucose level was 81 milligrams per deciliters. That is lower than eighty six per cent of people in your age group. Keep up the good work!","Sorry I didn't get that. Can you please repeat that?");
  },
 
  'HealthIntent': function() {
   this.emit(":ask","Ok I've noticed that after eating sushi, your blood glucose level spikes up to 235 milligrams per deciliter. White rice has been found to cause blood sugar spikes. Try replacing white rice with brown rice in your diet.","Sorry I didn't get that. Can you please repeat that?");
  },

    'ChangeWorkspaceIntent': function() {
        var userToken = this.event.session.user.accessToken;
        watson.configureWorkspace(this, userToken);
    },

    'HomeIntent': function() {
        /*
         var baseText = "Here is your summary again. ";
         watson.summarizeMessages(this, baseText);
         */
        this.emit('LaunchRequest');
    },

    'MessageIntent': function() {
        // Reads the last message presented in the workspace and allows the user to respond.
        // Need to know workspaceId
        var accessToken = this.event.session.user.accessToken;
        var workspaceIndex = this.event.request.intent.slots.Workspace.value;
        var workspaceId = watson.getWorkspaceId(this,accessToken,workspaceIndex);

        //console.log('message intent workspaceId: ' + workspaceId);

    },

    'SubjectIntent': function() {
        console.log('SubjectIntent');
        var subject = this.event.request.intent.slots.Subject.value;
        subject = subject.toLowerCase();
        if (subject.includes('github')) {
            watson.handleGithub(this);
        } else if (subject.includes('email')) {
            watson.handleEmail(this);
        } else if (subject.includes('meeting')) {
            watson.handleMeetings(this);
        } else if (subject.includes('message')) {
            this.emit('MessageIntent');
            // watson.handleQuestions(this);
        } else {
            var subjectHelpText = morningDose.SUBJECT_HELP_TEXT;
            this.emit(':ask', subjectHelpText, subjectHelpText);
        }
    },

    'DescribeIntent':function() {
        watson.readComments(this);
    },

    'WorkspaceIntent': function() {
        // Configure linked workspace for user.
        var userToken = this.event.session.user.accessToken;
        var workspaceIndex = this.event.request.intent.slots.Workspace.value;
        //var userId = this.event.session.user.userId;
        //this.attributes[userId] = workspaceId;
        watson.setWorkspace(this, userToken, workspaceIndex);
        this.emit('LaunchRequest');
    },

    'CommentIntent': function() {
        var userToken = this.event.session.user.accessToken;
        var workspaceIndex = this.event.request.intent.slots.Workspace.value;
        var comment = this.event.request.intent.slots.Comment.value;
        console.log('You said: ' + comment);
        watson.commentWorkspace(this, userToken, workspaceIndex, comment);
    },

    'Unhandled': function() {
        var repromptText = "Say 'main menu' to return to the main menu.";
        var speechText = "Sorry, I didn\'t get that. " + repromptText;
        this.emit(':ask', speechText, repromptText);
    },

    'AMAZON.HelpIntent': function () {
        var speechOutput = morningDose.HELP_TEXT;
        var reprompt = morningDose.HELP_TEXT;
        this.emit(':ask', speechOutput, reprompt);
    },

    'AMAZON.CancelIntent': function () {
        this.emit(':tell', morningDose.EXIT_TEXT);
    },

    'AMAZON.StopIntent': function () {
        this.emit(':tell', morningDose.EXIT_TEXT);
    },

    'SessionEndedRequest': function () {
        this.attributes['endedSessionCount'] += 1;
        // Save state to dynamo.
        this.emit(':saveState', true);
        console.log('session ended!');
    }
};

// https://github.com/rmtuckerphx/alexa-skill-serverless-starter-template/blob/master/src/handler.js
// module.exports.skill  = function(event, context, callback) {
exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    // var languageStrings = fitnessTips.LANGUAGE_STRINGS;
    // alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};
