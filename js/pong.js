/*

Ryan Fritsch

Web-Based Pong Game

*/


// Create objects for the game
var userPaddle = new Object();
var aiPaddle = new Object();
var ball = new Object();

// Will contain scores and other statistics for game
var gameMetrics = new Object();

var weatherColors = [
                    '#723aff',  // colder than 50 degrees
                    '#3ab7ff',  // between 50 and 59 degrees
                    '#3affd4',  // between 60 and 69 degrees
                    '#2ff943',  // between 70 and 79 degrees
                    '#f5f92f',  // between 80 and 89 degrees
                    '#f26615',  // between 90 and 99 degrees
                    '#f11515'   // 100 degrees or warmer
                ];



// get weather data for paddle color change
var weatherData = new Object();

function getWeather() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
          weatherData = JSON.parse(this.responseText);

          // Change temps to Fahrenheit
          weatherData['main']['temp'] = ((weatherData['main']['temp'])*1.8) - 459.67;
        }
    };
    xhttp.open("POST", "https://api.openweathermap.org/data/2.5/weather?zip=89109,us&APPID=36b74c30f9f3784e1d2f0b02a0da45b7", true);
    xhttp.send();
}

// using temperature value from weather API, return the associated color value
function getWeatherColor(temperature)
{
         if(temperature < 50){ return weatherColors[0]; }
    else if(temperature >= 50 && temperature < 60) { return weatherColors[1]; }
    else if(temperature >= 60 && temperature < 70){ return weatherColors[2]; }
    else if(temperature >= 70 && temperature < 80){ return weatherColors[3]; }
    else if(temperature >= 80 && temperature < 90){ return weatherColors[4]; }
    else if(temperature >= 90 && temperature < 100){ return weatherColors[5]; }
    else if(temperature >= 100){ return weatherColors[6]; }
}






//******* INITIALIZATION *******//
$( document ).ready(function() {
    getWeather();

    loadInstructions();

    // set initial values
    userPaddle.height = 80;
    userPaddle.move = 0;
    userPaddle.top = 260;
    userPaddle.speed = 10;

    aiPaddle.height = 80;
    aiPaddle.destination = 0;
    aiPaddle.top = 260;
    aiPaddle.speed = 3.3;
    aiPaddle.moveNow = false;

    // ball data
    ball.height = 20
    ball.top = 290;
    ball.left = 540;
    ball.moving = false;
    ball.speed = 10;
    ball.directionX = -1 * ball.speed;
    ball.directionY = (Math.random() < 0.5 ? -1 : 1) * ball.speed;

    // set initial metrics
    gameMetrics.userScore = 0;
    gameMetrics.aiScore = 0;

    gameMetrics.upArrow = false;
    gameMetrics.downArrow = false;
    gameMetrics.recentPress = 0;

    gameMetrics.boardTop = 0;
    gameMetrics.boardBottom = 600;

    gameMetrics.boardLeft = 0;
    gameMetrics.boardRight = 1100;

    gameMetrics.changingUI = false;

});

// loads initial instructions screen
function loadInstructions()
{
    $('#welcomeText').delay(500).fadeIn(function(){
        $('#startInst').fadeIn(function(){
            $('#moveInstr').fadeIn(function(){
                $('#goButtonContainer').fadeIn();
                $('#cookieButtonContainer').fadeIn();
            });
        });
    });
}

// 'Lets Go' button is clicked, show game items
function startGame()
{
    $('#introScreen').fadeOut(function(){
        $('#gameTitle').delay(200).fadeIn(function(){
            $('#userTitle').fadeIn()
            $('#aiTitle').fadeIn(function(){
                $('#userScore').fadeIn()
                $('#aiScore').fadeIn(function(){
                    $('#dividerTop').fadeIn();
                    $('#dividerBottom').fadeIn();
                    $('#gameBoard').fadeIn(function(){
                        $('#userPaddle').delay(400).fadeOut(function(){
                            $('#userPaddle').css( "background-color", getWeatherColor(weatherData['main']['temp']));
                            $('#userPaddle').fadeIn();
                        })
                    })
                })
            })
        });
    });
}







/*********    GAME IMPLEMENTATION    **********/

/*
    The updateGame function is the heart of the game's animations. The function
    is called many times per second and updates the locations of the elements
    in the game when necessary.
*/
function updateGame()
{
    // paddle movement
    userPaddle.move = getUserPaddleMove();
    userPaddle.top += userPaddle.move;
    document.getElementById('userPaddle').style.top = (userPaddle.top) + 'px';

    // ball movement
    if(ball.moving){ moveBall(); }

    // ai paddle move
    if(aiPaddle.moveNow){ moveAIPaddle(); }
}




/*
    These key listeners change the properties within
    gameMetrics for userPaddle movement when the up or
    down arrow is pressed, and start the game with the
    space bar.
*/
$(document).keydown(function(e) {
    if (e.which === 38) { // up arrow
        gameMetrics.upArrow = true;
        gameMetrics.recentPress = 38;
    }
    if (e.which === 40) { // down arrow
        gameMetrics.downArrow = true;
        gameMetrics.recentPress = 40;
    }
    if(e.which === 32)
    {
        // start ball in a random spot
        var randomSet = (Math.random() < 0.5 ? -1 : 1) * Math.floor((Math.random() * 80) + 0);
        $('#ball').animate({top: '+='+randomSet}, function(){
            ball.moving = !(ball.moving);
        });
    }
});

// up or down arrow key is released
$(document).keyup(function(e) {
    if (e.which === 38) {
        gameMetrics.upArrow = false;
    }
    if (e.which === 40) {
        gameMetrics.downArrow = false;
    }
});






/*************       PADDLE FUNCTIONALITY        *************/

// based on current keys pressed and ability to move, returns
// direction of user paddle move.
function getUserPaddleMove()
{
    // up arrow only
    if(gameMetrics.upArrow && !(gameMetrics.downArrow))
    {
        if(paddleCanMove("up"))
        {
            return -1 * userPaddle.speed;
        }
        else { return 0; }
    }

    // down arrow only
    else if(!(gameMetrics.upArrow) && gameMetrics.downArrow)
    {
        if(paddleCanMove("down"))
        {
            return userPaddle.speed;
        }
        else{ return 0; }
    }

    // both up and down arrow pressed;
    // will start moving in direction of most recent key press
    else if(gameMetrics.upArrow && gameMetrics.downArrow)
    {
        if(gameMetrics.recentPress === 38)
        {
            if(paddleCanMove("up"))
            {
                return -1 * userPaddle.speed;
            }
            else{ return 0; }
        }

        else if(gameMetrics.recentPress === 40)
        {
            if(paddleCanMove("down"))
            {
                return userPaddle.speed;
            }
            else{ return 0; }
        }
    }

    // no key pressed
    else
    {
        return 0;
    }

}

// checks to see if the paddle is at the bounds of the game table.
// returns true if user paddle can move, false if it cannot.
function paddleCanMove(direction)
{
    if(direction === "up")
    {
        if(userPaddle.top <= gameMetrics.boardTop)
        {
            return false;
        }
        else
        {
            return true;
        }
    }

    else if(direction === "down")
    {
        if(userPaddle.top >= (gameMetrics.boardBottom - userPaddle.height))
        {
            return false;
        }
        else
        {
            return true;
        }
    }
}

/*
    moveAIPaddle has a lot of the same functionalities as getUserPaddleMove.
    However, aiPaddle is controlled with a tracking algorithm rather then
    by keyboard keys. The algorithm is explained in more detail in the README.
*/
function moveAIPaddle()
{
    // destination position is greater than current position
    if((aiPaddle.destination - aiPaddle.top) > 0)
    {
        // if the current position is within one move of the destination position,
        // just move it to the destination position.
        if((aiPaddle.destination - aiPaddle.top) < aiPaddle.speed)
        {
            aiPaddle.top = aiPaddle.destination;
            aiPaddle.moveNow = false;
        }
        else
        {
            aiPaddle.top += aiPaddle.speed;
        }
    }

    // destination position is less than current position
    else if((aiPaddle.destination - aiPaddle.top) < 0)
    {
        if((aiPaddle.top - aiPaddle.destination) < aiPaddle.speed)
        {
            aiPaddle.top = aiPaddle.destination;
            aiPaddle.moveNow = false;
        }
        else
        {
            aiPaddle.top -= aiPaddle.speed;
        }
    }

    // if the aiPaddle is at the destination, stop moving
    else if(aiPaddle.top === aiPaddle.destination)
    {
        aiPaddle.moveNow = false;
    }

    // if the aiPaddle has gone out of bounds, move it back within the boundaries
    if(aiPaddle.top < 0)
    {
        aiPaddle.top = 0;
    }
    else if(aiPaddle.top > 520)
    {
        aiPaddle.top = 520;
    }

    // apply changes to aiPaddle element
    document.getElementById('aiPaddle').style.top = (aiPaddle.top) + 'px';

}


// Uses current position of ball compared to bounds of both paddles to check for
// a collision. If found, change direction
function checkPaddleCollision()
{
    // collision with userPaddle
    if(ball.left <= 60 && ball.left >= 50){
        if((ball.top + 20) >= userPaddle.top && (ball.top <= (userPaddle.top + 80)))
        {
            aiPaddle.moveNow = true;
            aiPaddleMoveCalculation();
            return true;
        }
    }

    // collision with aiPaddle
    else if(ball.left >= 1020 && ball.left <= 1050 && (((ball.top + 20) >= aiPaddle.top) && (ball.top < (aiPaddle.top + 80))))
    {
        return true;
    }

    // no collisions, we're good
    else { return false; }
}


// This function calculates the position of the aiPaddle based on the
// collision location of the ball and userPaddle. A more in-depth explanation
// of this algorithm can be found in the README
function aiPaddleMoveCalculation()
{

    var a = 0;
    var aiTop = 0;

    if(ball.directionY < 0)
    {
        a = ball.top + 10;
    }
    else
    {
        a = 600 - (ball.top + 10);
    }

    // calculate bounces
    var b = (60 + a + 600);
    var c = 1040 - b;

    if(b > 1040) // one bounce, one mirror
    {
        var short = b - 1040;
        if(ball.directionY > 0)
        {
            aiPaddle.destination = short - 40;
        }
        else
        {
            aiPaddle.destination = 600 - short - 40;
        }
    }
    else if(b < 1040) // two bounces, two mirrors
    {
        if(ball.directionY > 0)
        {
            aiPaddle.destination = c - 40;
        }
        else
        {
            aiPaddle.destination = 600 - c - 40;
        }

    }

}

/***********     END PADDLE IMPLEMENTATION     ************/







/*
    The moveBall function handles the direction in which the ball
    moves across the table by checking its top and left locations
    to the positions of the top and bottom boundaries of the table.
    Also checks for out of bounds to the left or right, signaling
    a goal/score for one of the players.
*/
function moveBall()
{
    // if collision with paddle, flip X direction
    if(checkPaddleCollision())
    {
        ball.directionX = -1 * ball.directionX;
        ball.top += ball.directionY;
        ball.left += ball.directionX;
    }

    // ball collides with top or bottom of game boundary
    else if(ball.top <= gameMetrics.boardTop || ball.top >= (gameMetrics.boardBottom - ball.height))
    {
        ball.directionY = -1 * ball.directionY;
        ball.top += ball.directionY;
        ball.left += ball.directionX;
    }

    // out of bounds to the left, score for aiPaddle
    else if(ball.left < 0)
    {
        if(!(gameMetrics.changingUI)){ goalScored("ai"); }  // animations
    }

    // out of bounds to the right, score for userPaddle
    else if(ball.left > 1080)
    {
        if(!(gameMetrics.changingUI)){ goalScored("user"); } // animations
    }

    // update top and left positions
    ball.top += ball.directionY;
    ball.left += ball.directionX;

    // apply position changes to element
    document.getElementById('ball').style.top = (ball.top) + 'px';
    document.getElementById('ball').style.left = (ball.left) + 'px';

}






// Goal has been scored by one of the players (passed in as
// either "user" or "ai") and UI changes are made.
function goalScored(player)
{
    // makes sure this function is not called again while animating
    gameMetrics.changingUI = true;

    // change player's score
    gameMetrics[player+'Score'] += 1;

    // animations to retrieve ball after a goal
    $('#ball').fadeOut(200, function(){
        ball.moving = false;
        ball.top = 290;
        ball.left = 540;

        ball.directionX = -1 * ball.speed;
        ball.directionY = (Math.random() < 0.5 ? -1 : 1) * ball.speed;

        // return ball to middle of table
        document.getElementById('ball').style.top = (ball.top) + 'px';
        document.getElementById('ball').style.left = (ball.left) + 'px';
        $('#ball').delay(800).fadeIn();
    });

    // temporary scoreboard color change
    document.getElementById(player+'Score').style.color = '#25ff11';
    scoreFade(player);
}


// run a set of fade-in/fade-out animations on the scoreboard
function scoreFade(player)
{
    var time = 400;
    $('#'+player+'Mask').fadeTo(0, 0.1).fadeTo(time, 0.4, function(){
        $('#'+player+'Mask').fadeTo(0, 0.4).fadeTo(time, 0.0);
    });

    $('#'+player+'Score').fadeOut(function(){
        $('#'+player+'Score').fadeIn(function(){
            $('#'+player+'Score').fadeOut(function(){
                $('#'+player+'Score').fadeIn(function(){
                    $('#'+player+'Score').fadeOut(function(){
                        document.getElementById(player+'Score').style.color = 'white';
                        document.getElementById(player+'Score').innerHTML = gameMetrics[player+'Score'];
                        $('#'+player+'Score').fadeIn(function(){
                            gameMetrics.changingUI = false; // all done with UI changes
                        });
                    });
                });
            });
        });
    });
}


// Continuous game update
window.setInterval(function show() {
    updateGame();
}, 1000/60);
