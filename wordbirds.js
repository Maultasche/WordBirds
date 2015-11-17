wordChallenges = new Mongo.Collection("wordChallenges");

if (Meteor.isClient) {
  Meteor.startup(function() {
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

  Session.setDefault("dataLoaded", false);

  Template.wordgame.helpers({
    challengeDifficulty: function() {
      var currentChallenge = getCurrentChallenge();
      var difficulty = "";

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

      if(Session.get("dataLoaded")) {
        currentChallenge = getCurrentChallenge();
      }

      return currentChallenge;
    },
    //Allows the template to find out whether there is a current challenge
    displayCurrentChallenge: function() {
      return Session.get("gameState") !== "done";
    },
    displayAnswerControls: function () {
      return Session.get("gameState") === "answering" || Session.get("gameState") === "wronganswer"; 
    },
    displayClearButton: function () {
      return Session.get("gameState") === "done";
    },
    displayCorrectAnswerControls: function() {
      return Session.get("gameState") === "correctanswer";
    },
    displayWrongAnswerControls: function() {
      return Session.get("gameState") === "wronganswer";
    },
    isLoading: function() {
      return !Session.get("dataLoaded");
    }
  });



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

  function clearAnsweredChallenges() {
    Session.set("answeredChallenges", []);
    Session.set("currentChallengeId", null);

    //Since we've cleared out all answered challenges, and are ready for the next one,
    //set the game state to answering
    Session.set("gameState", "answering");
  }

  function getCurrentChallenge() {
      var currentChallenge = null;

      //If the current challenge is null, retrieve another challenge that hasn't yet been answered
      if(Session.get("currentChallengeId") === null) {
        //Get the next challenge
        currentChallenge = getNextChallenge();   

        //If we have a challenge, set the ID as the current challenge
        if(currentChallenge) {
          Session.set("currentChallengeId", currentChallenge._id);          
        }
        else {
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

  function getChallenge(challengeId) {
    return wordChallenges.findOne({ _id: challengeId });
  }

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

    //The next time the view want the current challenge, the next challenge will be loaded  
  }

  function onCurrentAnswerUpdated(event) {
    Session.set("currentAnswer", event.target.value.trim().toLowerCase());

    //If the Enter key was pressed, the application will behave as if the Answer button was clicked
    if(event.keyCode === 13) {
      answerCurrentChallenge();
    }
  } 
  
  function scrollToGame() {
    var element_to_scroll_to = $('.example-gameplay')[0];
    element_to_scroll_to.scrollIntoView();
  }

  Template.body.events({
    "click #tryit": scrollToGame
  });

  Template.wordgame.events({
    "click #clearAnsweredChallengesButton": clearAnsweredChallenges,
    "click #answerButton": answerCurrentChallenge,
    "keyup #answerTextBox": onCurrentAnswerUpdated,
    "click #nextChallengeButton": goToNextChallenge,
    "click #skipButton": goToNextChallenge
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    //wordChallenges = new Mongo.Collection("wordChallenges");
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

    Meteor.publish("challenges", function() {
      //wordChallenges = new Mongo.Collection("wordChallenges");
      return wordChallenges.find();
    });
  });
}
