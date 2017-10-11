var library = (function () {

    var appName = 'MorningDose';
    var welcomeText = "Welcome to " + appName;
    var helpText = "You can say, tell me about my meetings, emails, , or github. You can also ask: read me my new messages";
    var exitText = 'Closed ' + appName;
    var subjectHelp = "Sorry, I didn't get that. Say tell me about github, email, or meetings.";
    var settingHelp = "Sorry, I didn't get that. Say configure workspace";
    var workspaceText = "Successfully set workspace";
    var serverErrorText = "Could not retrieve user information from server";

    return {
        APP_NAME: appName,
        WELCOME_TEXT: welcomeText,
        HELP_TEXT: helpText,
        EXIT_TEXT: exitText,
        SUBJECT_HELP_TEXT: subjectHelp,
        SETTING_HELP_TEXT: settingHelp,
        WORKSPACE_TEXT: workspaceText,
        SERVER_ERROR_TEXT: serverErrorText
    };

})();
module.exports = library;
