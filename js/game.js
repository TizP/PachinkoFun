// js/game.js
import {
    setupPhysics, createBall, removeBall, getAllBodies, getEngine,
    getCurrentBall, setupCollisionEvents, getLastBallSpawnOffsetX // Import the new helper
} from './physics.js';
import { render } from './graphics.js';
import { bucketConfig, gameRules, ballConfig } from './config.js'; // Import ballConfig for center spawn X

let engine;
let world;
let ctx;
let messageElement;
let moneyDisplayElement;
let animationFrameId = null;
let isBallActive = false;
let playerMoney = 0;

/**
 * Initializes the game environment.
 */
export function initGame(canvas, msgElement, moneyEl) {
    ctx = canvas.getContext('2d');
    messageElement = msgElement;
    moneyDisplayElement = moneyEl;

    playerMoney = gameRules.initialMoney;
    updateMoneyDisplay();

    const physicsObjects = setupPhysics();
    engine = physicsObjects.engine;
    world = physicsObjects.world;

    setupCollisionEvents(handleBallInBucket);

    render(ctx, getAllBodies());
    runGameLoop();
}

/** The main game loop */
function runGameLoop() {
    function loop(time) {
        Matter.Engine.update(engine);
        render(ctx, getAllBodies());

        const ball = getCurrentBall();
        if (ball && ball.position.y > ctx.canvas.height + 50) {
            handleBallOutcome(-1);
        }

        animationFrameId = requestAnimationFrame(loop);
    }
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    animationFrameId = requestAnimationFrame(loop);
}

/** Starts a new game round by dropping a ball */
export function startGame() {
    if (isBallActive) {
        setMessage("Ball already in play!");
        return;
    }
    if (playerMoney < gameRules.costPerDrop) {
        setMessage("Not enough money!");
        return;
    }

    playerMoney -= gameRules.costPerDrop;
    updateMoneyDisplay();

    clearMessage();
    const newBall = createBall(); // Create the ball first
    isBallActive = true;

    // --- UPDATED CONSOLE LOG ---
    // Get the offset from the helper function in physics.js
    const spawnOffsetX = getLastBallSpawnOffsetX();
    // Calculate the final clamped position used
    const finalSpawnX = newBall.position.x;
    console.log(`Ball dropped! Start Offset: ${spawnOffsetX.toFixed(2)}px (Final X: ${finalSpawnX.toFixed(2)}px)`);
    // --- END UPDATED CONSOLE LOG ---


    if (!animationFrameId) {
        runGameLoop();
    }
}

/** Resets the game state (ball only) */
export function resetGame() {
    console.log("Resetting game (ball only)...");
    removeBall();
    isBallActive = false;
    clearMessage();
    render(ctx, getAllBodies());
}

/** Sets the message displayed */
function setMessage(text) {
    if (messageElement) {
        messageElement.textContent = text;
    }
}

/** Clears the message area */
function clearMessage() {
    setMessage("");
}

/** Updates the money display */
function updateMoneyDisplay() {
    if (moneyDisplayElement) {
        moneyDisplayElement.textContent = `Money: ${playerMoney}€`;
    }
     const startButton = document.getElementById('start-button');
     if (startButton) {
         startButton.disabled = playerMoney < gameRules.costPerDrop;
         startButton.textContent = `Drop Ball (${gameRules.costPerDrop}€)`;
     }
}

/** Handles ball outcome (bucket or lost) */
 function handleBallOutcome(bucketIndex) {
    if (!isBallActive) return;

    let message = "";
    let rewardAmount = 0;

    if (bucketIndex >= 0 && bucketIndex < gameRules.bucketRewards.length) {
        rewardAmount = gameRules.bucketRewards[bucketIndex];
        message = bucketConfig.messages[bucketIndex];
        console.log(`Ball landed in bucket ${bucketIndex}, Reward: ${rewardAmount}€`);
    } else {
        message = "Ball lost!";
        rewardAmount = 0;
        console.log("Ball out of bounds or lost.");
    }

    playerMoney += rewardAmount;
    updateMoneyDisplay();

    if (rewardAmount > 0) {
        setMessage(`${message} +${rewardAmount}€!`);
    } else {
        setMessage(message);
    }

    removeBall();
    isBallActive = false;
}

/** Callback passed to physics engine */
function handleBallInBucket(bucketIndex) {
    handleBallOutcome(bucketIndex);
}