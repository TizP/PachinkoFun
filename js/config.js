// js/config.js

export const canvasConfig = {
    width: 500,
    height: 650,
};

export const physicsConfig = {
    gravity: 1,
    restitution: 0.4,
    friction: 0.01,
    pinFriction: 0.2,
};

export const ballConfig = {
    radius: 10,
    color: '#ff4081',
    spawnX: canvasConfig.width / 2,
    spawnY: 30,
    spawnXRandomness: 10,
};

export const pinConfig = {
    radius: 7,
    color: '#1e88e5',
    rows: 12,
    colsPadding: 50,
    rowsPadding: 40,
    offsetTop: 80,
    positionRandomness: 5,
    // starterPinRandomness: 4, // This line can be removed or commented out
};

export const bucketConfig = {
    count: 7,
    height: 50,
    wallColor: '#555555',
    wallThickness: 6,
    messages: [
        "So Close!",
        "Nice Try!",
        "Good Hit!",
        "** JACKPOT! **",
        "Good Hit!",
        "Nice Try!",
        "So Close!"
    ],
    prizeFont: 'bold 16px sans-serif',
    prizeColor: '#333333'
};

export const gameRules = {
    initialMoney: 10,
    costPerDrop: 1,
    bucketRewards: [
        0, 1, 2, 25, 2, 1, 0
    ]
};

// --- VALIDATION ---
if (bucketConfig.messages.length !== bucketConfig.count) {
    console.warn(`Warning: Bucket message count (${bucketConfig.messages.length}) doesn't match bucket count (${bucketConfig.count}). Adjusting messages.`);
    const messages = bucketConfig.messages;
    const count = bucketConfig.count;
    if (messages.length < count) {
         while (messages.length < count) {
            messages.push(messages[messages.length - 1] || "Default Message");
         }
    } else {
         messages.length = count;
    }
    bucketConfig.messages = messages;
}

if (gameRules.bucketRewards.length !== bucketConfig.count) {
     console.error(`Fatal Error: Bucket reward count (${gameRules.bucketRewards.length}) doesn't match bucket count (${bucketConfig.count}). Please fix config.js.`);
}
// --- END VALIDATION ---