// js/main.js
import { initGame, startGame, resetGame } from './game.js';
import { canvasConfig } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('pachinko-canvas');
    const startButton = document.getElementById('start-button');
    const resetButton = document.getElementById('reset-button');
    const messageArea = document.getElementById('message-area');
    const moneyDisplay = document.getElementById('money-display'); // Get money element

    if (!canvas || !startButton || !resetButton || !messageArea || !moneyDisplay) { // Check money element
        console.error("Initialization failed: Required elements not found.");
        if (!moneyDisplay) console.error("Specifically, #money-display element is missing.");
        return;
    }

    // Set canvas dimensions
    canvas.width = canvasConfig.width;
    canvas.height = canvasConfig.height;

    // Initialize the game, passing the money display element
    initGame(canvas, messageArea, moneyDisplay); // Pass moneyDisplay

    // Add button listeners
    startButton.addEventListener('click', startGame);
    resetButton.addEventListener('click', resetGame);

    console.log("Pachinko game initialized with money system.");
});