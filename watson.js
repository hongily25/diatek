'use strict';
// Library containing IBM Watson utility functions.
// https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
var library = (function () {
    // var oauth = require('./oauth');
    var request = require('request');
    var morningDose = require('./morningDose');

    // App ID retrieved from registration process.
    //var APP_ID = '3e0d3ef0-7335-4788-a0c3-74107eccb5ea';
    // App secret retrieved from registration process.
    //var APP_SECRET = '6n4oh8lv7u9zgifnlsxdrxyzzrsi0ntt';

    // Set in setWorkspace
    var workspaceId = undefined;
    var token = undefined;

    // subcategories of retrieved messages.
    var githubs, meetings, emails, questions;
    // assigned when user selects details for specific category.
    var readList;

    // parameters: wid is workspace index ie 3
    function setWorkspace(self, userToken, wid) {
        token = userToken;
        console.log('setWorkspace token: ' + token);
        var workspaceIndex = wid - 1;
        console.log('setWorkspace workspaceIndex: ' + workspaceIndex);
        var options = {
            method: 'POST',
            url: 'https://api.watsonwork.ibm.com/graphql',
            headers: {
                'postman-token': '04a6940f-96a6-8e3f-f1e2-7813d23c374e',
                'cache-control': 'no-cache',
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: 'Bearer ' + token
            },
            body: {
                query: 'query getSpaces {\n spaces(first: 50) {\n items {\n title\n id \n description\n membersUpdated\n members {\n items {\n email\n displayName\n}\n }\n}\n}\n}\n',
                variables: null,
                operationName: 'getSpaces'
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                console.log('Error: ' + error);
                self.emit(":tell", "Could not retrieve user information from server");
                return;
            }
            body = JSON.stringify(body);
            console.log('Body: ' + body);
            body = JSON.parse(body);
            var workspaceItem = body.data.spaces.items[workspaceIndex];
            workspaceId = workspaceItem.id;
            console.log('set my token: ' + token);
            console.log('set my workspaceId: ' + workspaceId);
            self.attributes[token] = workspaceId;
            console.log('Saved: ' + token + ": " + self.attributes[token]);
        });
    }

    function getMessages(self, accessToken, wid) {
        //self.emit(':tell', 'handleRefresh');
        token = accessToken;
        workspaceId = wid;
        var retrievedText = baseSpeechText;
        var options = { method: 'POST',
            url: 'https://api.watsonwork.ibm.com/graphql',
            headers:
                { 'postman-token': '04a6940f-96a6-8e3f-f1e2-7813d23c374e',
                    'cache-control': 'no-cache',
                    accept: 'application/json',
                    'content-type': 'application/json',
                    authorization: 'Bearer ' + token
                },
            body:
                { query: "query getConversation {\n  conversation(id: '" + workspaceId + "') {\n    id\n    created\n    updated\n    messages (first: 50){\n      items {\n        content\n        annotations\n      }\n    }\n  }\n}\n",
                    variables: null,
                    operationName: 'getConversation' },
            json: true };

        request(options, function (error, response, body) {
            if (error) {
                console.log('Error: ' + error);
                self.emit(":tell", morningDose.SERVER_ERROR_TEXT);
                return;
            }
            body = JSON.stringify(body);
            console.log('Body: ' + body);
            body = JSON.parse(body);

            var messages = body.data.conversation.messages.items;
            console.log('handleRefresh Conversation items: ' + messages);
            processMessages(messages);
            summarizeMessages(self, "");
        });
    }

    function yesterdayAtFive() {
        var date = new Date();
        date.setDate(date.getDate() - 1);
        date.setHours(17);
        return date.getTime();
    }

    var configureWorkspace = function (self, accessToken) {

        token = accessToken;
        console.log ('configureWorkspace token: ' + token);
        console.log('yesterdayAtFive: ' + yesterdayAtFive());

        var options = {
            method: 'POST',
            url: 'https://api.watsonwork.ibm.com/graphql',
            headers: {
                'postman-token': '04a6940f-96a6-8e3f-f1e2-7813d23c374e',
                'cache-control': 'no-cache',
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: 'Bearer ' + token
            },
            body: {
                query: 'query getSpaces {\n spaces(first: 50) {\n items {\n title\n id \n description\n membersUpdated\n members {\n items {\n email\n displayName\n}\n }\n}\n}\n}',
                variables: null,
                operationName: 'getSpaces'
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                console.log('Error: ' + error);
                self.emit(":tell", "Could not retrieve user information from server");
                return;
            }
            body = JSON.stringify(body);
            console.log('configureWorkspace Body: ' + body);
            body = JSON.parse(body);
            console.log('configureWorkspace After Parse Body: ' + body);

            var workspaceItems = body.data.spaces.items;
            var listOfWorkspaces = "";

            for (var i = 0; i < workspaceItems.length; i++) {
                if (i == 0) {
                    listOfWorkspaces = ' To select workspace ' + workspaceItems[i].title + ', ' + ' say "workspace ' + (i + 1) + ", "
                } else {
                    listOfWorkspaces += ' for ' + workspaceItems[i].title + ', ' + ' say "workspace ' + (i + 1) + '", ';
                }
                console.log(listOfWorkspaces);
            }

            var baseSummaryText = morningDose.WELCOME_TEXT + '.' + listOfWorkspaces;
            self.emit(':ask', baseSummaryText, baseSummaryText);
        });
    };

    function parseSentiment(annotations) {
        console.log('annotations length: ' + annotations.length);
        for (var i in annotations) {
            var a = JSON.parse(annotations[i]);
            console.log('a: ' + JSON.stringify(a));
            if (a.hasOwnProperty('docSentiment')) {
                var b = a.docSentiment;
                if (b.hasOwnProperty('score')) {
                    var score = b.score;
                    return score;
                }
            }
        }
        return 0;
    }

    function getWorkspace() {
        return workspaceId;
    }

    // Takes in workspaceIndex as wid, then readsLastMessage from that workspace
    function getWorkspaceId(self, userToken, wid) {
        token = userToken;
        console.log('getWorkspace token: ' + token);
        if (wid == null) {
            self.emit(":tell","Please say a workspace number. If you do not know one, you can say, list my workspaces");
        }
        var workspaceIndex = wid - 1;

        console.log('getWorkspace workspaceIndex: ' + workspaceIndex);
        var options = {
            method: 'POST',
            url: 'https://api.watsonwork.ibm.com/graphql',
            headers: {
                'postman-token': '04a6940f-96a6-8e3f-f1e2-7813d23c374e',
                'cache-control': 'no-cache',
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: 'Bearer ' + token
            },
            body: {
                query: 'query getSpaces {\n spaces(first: 50) {\n items {\n title\n id \n description\n membersUpdated\n members {\n items {\n email\n displayName\n}\n }\n}\n}\n}\n',
                variables: null,
                operationName: 'getSpaces'
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                console.log('Error: ' + error);
                self.emit(":tell", morningDose.SERVER_ERROR_TEXT);
                return;
            }
            body = JSON.stringify(body);
            console.log('Body: ' + body);
            body = JSON.parse(body);
            var workspaceItem = body.data.spaces.items[workspaceIndex];
            workspaceId = workspaceItem.id;
            console.log('getWorkspace my token: ' + token);
            console.log('getWorkspace my workspaceId: ' + workspaceId);
            readLastMessage(self,token,workspaceId);

        });
    }

    function readLastMessage(self,accessToken,workspaceId) {
        token = accessToken;
        console.log('readlastmessage workspaceID:' + workspaceId);
        var options = { method: 'POST',
            url: 'https://api.watsonwork.ibm.com/graphql',
            headers:
                { 'postman-token': '04a6940f-96a6-8e3f-f1e2-7813d23c374e',
                    'cache-control': 'no-cache',
                    accept: 'application/json',
                    'content-type': 'application/json',
                    authorization: 'Bearer ' + token
                },
            body:
                { query: 'query getConversation {\n  conversation(id: "' + workspaceId + '") {\n    id\n    created\n    updated\n    messages (first: 5) {\n      items {\n        content\n        annotations\n      }\n    }\n  }\n}\n',
                    variables: null,
                    operationName: 'getConversation' },
            json: true };

        request(options, function (error, response, body) {
            if (error) {
                console.log('Error: ' + error);
                self.emit(":tell", morningDose.SERVER_ERROR_TEXT);
                return;
            }
            body = JSON.stringify(body);
            body = JSON.parse(body);
            if (body.data.conversation == null) {
                self.emit(":tell", "I couldn't find a conversation for that workspace ID, please say 'set workspace' followed by your workspace ID");
            }

            var messages = body.data.conversation.messages.items;
            var speechText = '', repromptText ='';
            console.log('messages: ' + JSON.stringify(messages));
            if (messages.length) {
                var lastMessage = messages[0];
                var annotations = lastMessage.annotations;
                console.log('annotations: ' + annotations);
                var score = parseSentiment(annotations);
                console.log('score: ' + score);
                speechText = "Your last message was: " + lastMessage.content + ". ";
                if (score > .7) {
                    repromptText = "Seems positive. Would you like to congratulate back? ";
                } else if (score < -.7) {
                    repromptText = "Seems bad. Would you like to call in sick?";
                }
                repromptText += " What should I reply? Say 'reply' followed by your comment or say 'main menu'.";
                self.emit(":ask", speechText + repromptText , repromptText);
                return;
            }
            speechText = "You have no recent messages. ";
            repromptText = "Ask about something else?";
            self.emit(":ask", speechText + repromptText, repromptText);
        });
    }

    function pluralize(item, count) {
        if (count != 1) {
            item += 's'
        }
        return count + " " + item;
    }

    function configureAuth(self) {
        var repromptText = ". Please go to your Alexa app to log into your workspace. ";
        var speechText = morningDose.WELCOME_TEXT + repromptText;
        self.emit(':tellWithLinkAccountCard', speechText, repromptText);
    }

    function summarizeMessages(self, baseMessage) {
        var summaryText,repromptText;

        if (!emails.length && !meetings.length && !githubs.length) {
            summaryText = "You have no new messages since yesterday at 5 p.m. ";
            repromptText = "What would you like to do? Say 'look at history' or 'cancel' to exit";
        } else {
            summaryText = "You have " + pluralize('email', emails.length) + ", " + pluralize('meeting', meetings.length) + ","
            summaryText += " and " + pluralize('github issue', githubs.length) + " since yesterday. ";
            repromptText = "What would you like to know about? For example, you can say read my last message.";
        }
        self.emit(':ask', baseMessage + summaryText + repromptText, repromptText);
    }

    function commentWorkspace(self,userToken,wid,comment) {
        token = userToken;
        console.log('getWorkspace token: ' + token);
        if (wid == null) {
            self.emit(":tell","Please say a workspace number. If you do not know one, you can say, list my workspaces");
        }
        var workspaceIndex = wid - 1;

        console.log('getWorkspace workspaceIndex: ' + workspaceIndex);
        var options = {
            method: 'POST',
            url: 'https://api.watsonwork.ibm.com/graphql',
            headers: {
                'postman-token': '04a6940f-96a6-8e3f-f1e2-7813d23c374e',
                'cache-control': 'no-cache',
                accept: 'application/json',
                'content-type': 'application/json',
                authorization: 'Bearer ' + token
            },
            body: {
                query: 'query getSpaces {\n spaces(first: 50) {\n items {\n title\n id \n description\n membersUpdated\n members {\n items {\n email\n displayName\n}\n }\n}\n}\n}\n',
                variables: null,
                operationName: 'getSpaces'
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                console.log('Error: ' + error);
                self.emit(":tell", morningDose.SERVER_ERROR_TEXT);
                return;
            }
            body = JSON.stringify(body);
            console.log('Body: ' + body);
            body = JSON.parse(body);
            var workspaceItem = body.data.spaces.items[workspaceIndex];
            workspaceId = workspaceItem.id;
            console.log('getWorkspace my token: ' + token);
            console.log('getWorkspace my workspaceId: ' + workspaceId);
            makeComment(self,token,workspaceId,comment);

        });
    }

    // cb is the callback error.
    function makeComment(self,userToken,workspaceId,text) {
        var commentTitle = "Reply:";
        token = userToken;
        console.log('MakeComment Token: ' + token);
        request.post(
            'https://api.watsonwork.ibm.com/v1/spaces/' + workspaceId + '/messages', {
                headers: {
                    Authorization: 'Bearer ' + token
                },
                json: true,
                // An App message can specify a color, a title, markdown text and
                // an 'actor' useful to show where the message is coming from
                body: {
                    type: 'appMessage',
                    version: 1.0,
                    annotations: [{
                        type: 'generic',
                        version: 1.0,
                        color: '#6CB7FB',
                        title: commentTitle,
                        text: text,
                        actor: {
                            name: 'from sample echo app',
                            avatar: 'https://avatars1.githubusercontent.com/u/22985179',
                            url: 'https://github.com/watsonwork/watsonwork-echo'
                        }
                    }]
                }
            }, function(err, res) {
                console.log('MakeComment Response: ' + JSON.stringify(res));
                if(err || res.statusCode !== 201) {
                    console.log('makeComment error: %o', err || res.statusCode);
                } else {
                    console.log('Send result %d, %o', res.statusCode, res.body);
                }
                self.emit(':tellWithCard', "I commented: " + text);

            });
    }

    // TODO: improve filtering to be less general - needs to work under non-custom message tags that appear in the workspace.
    function processMessages(messages) {

        function isGithub(m) {
            return JSON.stringify(m['annotations']).includes('Github');
        }
        githubs = messages.filter(isGithub);

        function isMeeting(m) {
            var msg = JSON.stringify(m['annotations']);
            return msg.includes('Ends:');
        }
        meetings = messages.filter(isMeeting);

        function isEmail(m) {
            return JSON.stringify(m['annotations']).includes('Subject:');
        }
        emails = messages.filter(isEmail);

        function isQuestion(m) {
            var msg = JSON.stringify(m['annotations']);
            return msg.includes('lens');
        }
        questions = messages.filter(isQuestion);
    }

    function readComments(self) {
        var speechText, repromptText;
        if (readList.length) {
            var content = readList.map(function (m) {
                return m['content'];
            });
            repromptText = "Messages complete. Say 'back to menu' to return";
            speechText = "Here are your messages: " + content.join(', ') + ". " + repromptText;
        } else {
            repromptText = "Say 'back to menu' to return";
            speechText = "You have no messages." + repromptText;
        }
        self.emit(':ask', speechText, repromptText);
    }

    function handleGithub(self) {
        // var yourGithub = findOwnerGithub();
        var speechText = 'ok, there are ' + githubs.length + ' new issues reported. ';
        var repromptText = "Say 'describe github issues', or say 'back to menu'";
        readList = githubs;
        self.emit(':ask', speechText + repromptText, repromptText);
    }
    function handleMeetings(self) {
        var speechText = 'ok, you have ' + meetings.length + ' meetings scheduled for today.';
        var repromptText = "Say 'describe meetings', or say 'back to menu'";
        readList = meetings;
        self.emit(':ask', speechText + repromptText, repromptText);
    }
    function handleEmail(self) {
        var speechText = 'ok, you have ' + emails.length + ' new emails since yesterday';
        var repromptText = "Say 'describe emails' or say 'back to menu'";
        readList = emails;
        self.emit(':ask', speechText + repromptText, repromptText);
    }
    function handleQuestions(self) {
        var speechText = 'You have ' + questions.length + ' new questions since yesterday. ';
        var repromptText = "Say 'describe questions'. You can say 'comment'  or 'reply' to reply to the workspace";
        readList = questions;
        self.emit(':ask', speechText + repromptText, repromptText);
    }

    return {
        summarizeMessages: summarizeMessages,
        getToken: function() { return token; },
        makeComment: makeComment,
        handleGithub: handleGithub,
        handleMeetings: handleMeetings,
        handleEmail: handleEmail,
        handleQuestions: handleQuestions,
        readLastMessage: readLastMessage,
        configureWorkspace: configureWorkspace,
        configureAuth: configureAuth,
        setWorkspace: setWorkspace,
        getWorkspace: getWorkspace,
        getMessages: getMessages,
        getWorkspaceId: getWorkspaceId,
        commentWorkspace: commentWorkspace,
        readComments: readComments
    };
})();
module.exports = library;
