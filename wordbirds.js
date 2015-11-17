wordChallenges = new Mongo.Collection("wordChallenges");

//Code that gets run in the browser
if (Meteor.isClient) {
  Meteor.startup(function() {
    //Subscribe to the challenges data
    Meteor.subscribe("challenges", function() {
      //Now that we have data, load the current challenge
      Session.set("dataLoaded", true);
    });
  });

  //User initially hasn't answered any challenges
  Session.setDefault("answeredChallenges", []);

  //Store the ID of the challenge the user is currently viewing
  Session.setDefault("currentChallengeId", null);
  
  //Store the game state. Values: answering, correctanswer, wronganswer, done
  Session.setDefault("gameState", "answering");
  
  //Store the current answer
  Session.setDefault("currentAnswer", "");

  //Store a flag that indicates whether the data has been loaded or not.
  //We don't want to start doing stuff with the data before it has finished loading
  Session.setDefault("dataLoaded", false);

  //Helper functions for the wordgame template
  Template.wordgame.helpers({
    //Gets the text for the difficulty of the current challenge
    challengeDifficulty: function() {
      //Retrieve the current challenge
      var currentChallenge = getCurrentChallenge();
      var difficulty = "";

      //Match the difficulty with some text
      if(currentChallenge) {
        if(currentChallenge.difficulty === 1) {
          difficulty = "1 syllable";
        }
        else if(currentChallenge.difficulty === 2) {
          difficulty = "2 syllables";
        }
        else if(currentChallenge.difficulty === 3) {
          difficulty = "3 syllables";
        }
        else if(currentChallenge.difficulty === 4) {
          difficulty = "4 syllables";
        }
      }
      
      return difficulty;
    },
    //Allows the template to retrieve the current challenge
    currentChallenge: function() {
      var currentChallenge = null;

      //If the data has been loaded from the database, get the current challenge
      if(Session.get("dataLoaded")) {
        currentChallenge = getCurrentChallenge();
      }

      return currentChallenge;
    },
    //Allows the template to find out whether there is a current challenge
    displayCurrentChallenge: function() {
      return Session.get("gameState") !== "done";
    },
    //Indicates whether the answer controls should be displayed
    displayAnswerControls: function () {
      return Session.get("gameState") === "answering" || Session.get("gameState") === "wronganswer"; 
    },
    //Indicates whether the clear (aka try again) button should be displayed
    displayClearButton: function () {
      return Session.get("gameState") === "done";
    },
    //Indicates whether the controls that appear for a correct answer are to be displayed
    displayCorrectAnswerControls: function() {
      return Session.get("gameState") === "correctanswer";
    },
    //Indicates whether the controls that appear for a wrong answer are to be displayed
    displayWrongAnswerControls: function() {
      return Session.get("gameState") === "wronganswer";
    },
    //Indicates whether data is still being loaded from the database
    isLoading: function() {
      return !Session.get("dataLoaded");
    }
  });

  //This function attempts to answer the current challenge using the text in the text box
  function answerCurrentChallenge() {
    //Get the current answer
    var currentAnswer = Session.get("currentAnswer");

    //Get the current challenge
    var currentChallenge = getCurrentChallenge();

    //Compare the current answer against the actual answer.
    if(currentChallenge.answer === currentAnswer) {
      //If correct, set the game state accordingly
      Session.set("gameState", "correctanswer");
    }
    else {
      //If incorrect, set the game state accordingly
      Session.set("gameState", "wronganswer");
    }
  }

  //Clears the collection of answered challenges, allowing the user to try the examples again
  function clearAnsweredChallenges() {
    Session.set("answeredChallenges", []);
    Session.set("currentChallengeId", null);

    //Since we've cleared out all answered challenges, and are ready for the next one,
    //set the game state to answering
    Session.set("gameState", "answering");
  }

  //Gets the current challenge. If there is no current challenge, the next challenge is retrieved
  //from the database. If there are no more challenges to be answered, this function returns null.
  function getCurrentChallenge() {
      var currentChallenge = null;

      //If the current challenge is null, retrieve another challenge that hasn't yet been answered
      if(Session.get("currentChallengeId") === null) {
        //Get the next challenge
        currentChallenge = getNextChallenge();   

        
        if(currentChallenge) {
          //If we have a challenge, set the ID as the current challenge
          Session.set("currentChallengeId", currentChallenge._id);          
        }
        else {
          //If we have no more challenges, clear the current challenge data
          Session.set("currentChallengeId", null);
          currentChallenge = null;

          //Since we have no more challenges, set the game state to done
          Session.set("gameState", "done");
        }
      }

      //If the current challenge is not null, then retrieve and return it
      else {
        currentChallenge = getChallenge(Session.get("currentChallengeId"));
      }  

      return currentChallenge;  
  }

  //Retrieves a challenge from the database by ID
  function getChallenge(challengeId) {
    return wordChallenges.findOne({ _id: challengeId });
  }

  //Retrieves the next challenge from the database that isn't in the list of answered challenges
  function getNextChallenge() {
    return wordChallenges.findOne({ _id : { $nin: Session.get("answeredChallenges") }});
  }

  //Goes to the next challenge
  function goToNextChallenge() {
    //Add the current challenge to the answered challenges collection
    var answeredChallenges = Session.get("answeredChallenges");
    answeredChallenges.push(Session.get("currentChallengeId"));
    Session.set("answeredChallenges", answeredChallenges);

    //Clear the current challenge ID
    Session.set("currentChallengeId", null); 

    //Clear the answer text box
    $('#answerTextBox').val("");

    //Set the game state to answering
    Session.set("gameState", "answering");

    //The next time the view wants the current challenge, the next challenge will be loaded  
  }

  //This function is called when the value of the answer text box is updated
  function onCurrentAnswerUpdated(event) {
    //Set the current answer to the text in the answer text box
    Session.set("currentAnswer", event.target.value.trim().toLowerCase());

    //If the Enter key was pressed, the application will behave as if the Answer button was clicked
    if(event.keyCode === 13) {
      answerCurrentChallenge();
    }
  } 
  
  //Scrolls the page to the gameplay example part of the page
  function scrollToGame() {
    var element_to_scroll_to = $('.example-gameplay')[0];
    element_to_scroll_to.scrollIntoView();
  }

  //Event handlers for the body section of the web page
  Template.body.events({
    "click #tryit": scrollToGame
  });

  //Event handlers for the word game template
  Template.wordgame.events({
    "click #clearAnsweredChallengesButton": clearAnsweredChallenges,
    "click #answerButton": answerCurrentChallenge,
    "keyup #answerTextBox": onCurrentAnswerUpdated,
    "click #nextChallengeButton": goToNextChallenge,
    "click #skipButton": goToNextChallenge
  });
}

//Code that gets run on the server
if (Meteor.isServer) {
  Meteor.startup(function () {
    //Lock down our data so that it is read-only for any subscribers
    wordChallenges.allow({
      insert: function() {
        return false;
      },
      update: function() {
        return false;
      },
      remove: function() {
        return false;
      }
    });

    //Publish the challenges
    Meteor.publish("challenges", function() {
      return wordChallenges.find();
    });
  });
}
