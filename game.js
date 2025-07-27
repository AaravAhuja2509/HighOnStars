// Sprite creation functions// Game variables
let player, pills, enemies, traps, cursors;
let chaosLevel = 1;
let survivalTimer = 0;
let pillsConsumed = 0;
let shakeAmount = 0;
let speedBoost = 0;
let colorFlash = 0;
let dizzyEffect = 0;
let greenSpeedActive = false;
let discoLights = 0;
let gameRunning = true;
let gameStarted = false;
let lives = 3;
let score = 0;
let backgroundColorIndex = 0;
let gameScene;
let stars = [];
let musicEnabled = true;
let backgroundMusic;

// Music and sound functions
function createSpaceMusic() {
    try {
        // Use your theme.wav file
        const musicUrl = 'theme.wav';

        backgroundMusic = {
            audio: null,

            init: function (url) {
                this.audio = new Audio(url);
                this.audio.loop = true;
                this.audio.volume = 0.3; // Adjust volume as needed
                this.audio.preload = 'auto';

                // Handle loading errors gracefully
                this.audio.addEventListener('error', (e) => {
                    console.log('Could not load music file, using fallback');
                    createSynthesizedMusic();
                });

                // Log when music is ready
                this.audio.addEventListener('canplaythrough', () => {
                    console.log('Music loaded successfully!');
                });
            },

            start: function () {
                if (!musicEnabled || !this.audio) return;

                this.audio.currentTime = 0;
                this.audio.play().catch(error => {
                    console.log('Could not play music:', error);
                    // Fallback to synthesized music if file doesn't work
                    createSynthesizedMusic();
                    if (backgroundMusic.start) backgroundMusic.start();
                });
            },

            stop: function () {
                if (this.audio) {
                    this.audio.pause();
                }
                musicEnabled = false;
            },

            resume: function () {
                musicEnabled = true;
                if (this.audio && gameRunning) {
                    this.audio.play().catch(error => {
                        console.log('Could not resume music:', error);
                    });
                }
            },

            setVolume: function (volume) {
                if (this.audio) {
                    this.audio.volume = Math.max(0, Math.min(1, volume));
                }
            }
        };

        // Initialize with your theme.wav file
        backgroundMusic.init(musicUrl);

    } catch (error) {
        console.log('Audio not available, using fallback');
        createSynthesizedMusic();
    }
}

function createSynthesizedMusic() {
    // Fallback synthesized music if theme.wav doesn't load
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        function playSpaceTheme() {
            if (!musicEnabled) return;

            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator1.type = 'sine';
            oscillator2.type = 'triangle';
            oscillator1.frequency.setValueAtTime(220, audioContext.currentTime);
            oscillator2.frequency.setValueAtTime(110, audioContext.currentTime);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 4);

            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator1.start();
            oscillator2.start();
            oscillator1.stop(audioContext.currentTime + 4);
            oscillator2.stop(audioContext.currentTime + 4);

            setTimeout(() => {
                if (musicEnabled && gameRunning) {
                    playSpaceTheme();
                }
            }, 4000);
        }

        backgroundMusic = {
            start: playSpaceTheme,
            stop: () => { musicEnabled = false; },
            resume: () => {
                musicEnabled = true;
                if (gameRunning) playSpaceTheme();
            },
            setVolume: () => { } // No-op for synthesized music
        };

    } catch (error) {
        console.log('Audio context not available, music disabled');
        backgroundMusic = {
            start: () => { },
            stop: () => { },
            resume: () => { },
            setVolume: () => { }
        };
    }
}

function toggleMusic() {
    if (musicEnabled) {
        backgroundMusic.stop();
        return false;
    } else {
        backgroundMusic.resume();
        return true;
    }
}

function playCollectSound() {
    if (!musicEnabled) return;

    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        // Silently fail if audio isn't available
    }
}

function playTeleportSound() {
    if (!musicEnabled) return;

    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        // Silently fail if audio isn't available
    }
}
function createRocket(scene) {
    const graphics = scene.add.graphics();

    // Rocket body (blue-gray)
    graphics.fillStyle(0x4a90e2);
    graphics.fillTriangle(12, 0, 8, 20, 16, 20);

    // Rocket fins
    graphics.fillStyle(0x2c5282);
    graphics.fillTriangle(6, 15, 8, 20, 10, 18);
    graphics.fillTriangle(18, 15, 16, 20, 14, 18);

    // Rocket window
    graphics.fillStyle(0x87ceeb);
    graphics.fillCircle(12, 8, 3);

    // Rocket flames (orange/red)
    graphics.fillStyle(0xff4500);
    graphics.fillTriangle(10, 20, 14, 20, 12, 26);
    graphics.fillStyle(0xffd700);
    graphics.fillTriangle(11, 20, 13, 20, 12, 24);

    graphics.generateTexture('rocket', 24, 28);
    graphics.destroy();
}

function createStar(scene, color, name) {
    const graphics = scene.add.graphics();

    // Draw outer glow first
    graphics.fillStyle(color, 0.3);
    graphics.fillCircle(25, 25, 24);

    // Draw main star body
    graphics.fillStyle(color, 1.0);

    // Draw 5-pointed star using triangles for better visibility
    const centerX = 25;
    const centerY = 25;
    const outerRadius = 18;
    const innerRadius = 7;

    for (let i = 0; i < 5; i++) {
        const angle1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const angle2 = ((i + 0.5) * 2 * Math.PI) / 5 - Math.PI / 2;
        const angle3 = ((i + 1) * 2 * Math.PI) / 5 - Math.PI / 2;

        const x1 = centerX + Math.cos(angle1) * outerRadius;
        const y1 = centerY + Math.sin(angle1) * outerRadius;
        const x2 = centerX + Math.cos(angle2) * innerRadius;
        const y2 = centerY + Math.sin(angle2) * innerRadius;
        const x3 = centerX + Math.cos(angle3) * outerRadius;
        const y3 = centerY + Math.sin(angle3) * outerRadius;

        graphics.fillTriangle(centerX, centerY, x1, y1, x2, y2);
        graphics.fillTriangle(centerX, centerY, x2, y2, x3, y3);
    }

    // Add bright center
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(centerX, centerY, 4);

    graphics.generateTexture(name, 50, 50);
    graphics.destroy();
}

function createBlackHole(scene) {
    const graphics = scene.add.graphics();

    // Outer distortion field
    graphics.fillGradientStyle(0x8a2be2, 0x4b0082, 0x2c1810, 0x000000, 1);
    graphics.fillCircle(25, 25, 22);

    // Multiple accretion disk layers
    graphics.lineStyle(3, 0xff6b35, 0.8);
    graphics.strokeCircle(25, 25, 20);
    graphics.lineStyle(2, 0xff9500, 0.7);
    graphics.strokeCircle(25, 25, 17);
    graphics.lineStyle(2, 0x8a2be2, 0.6);
    graphics.strokeCircle(25, 25, 14);
    graphics.lineStyle(1, 0xda70d6, 0.5);
    graphics.strokeCircle(25, 25, 11);

    // Event horizon
    graphics.fillGradientStyle(0x4b0082, 0x1a0033, 0x000000, 0x000000, 1);
    graphics.fillCircle(25, 25, 15);

    // Inner black core with slight purple tint
    graphics.fillStyle(0x0a0008);
    graphics.fillCircle(25, 25, 8);

    // Hawking radiation effect
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x = 25 + Math.cos(angle) * 18;
        const y = 25 + Math.sin(angle) * 18;
        graphics.fillStyle(0x00ffff, 0.3);
        graphics.fillCircle(x, y, 2);
    }

    graphics.generateTexture('blackhole', 50, 50);
    graphics.destroy();
}

function createAlien(scene) {
    const graphics = scene.add.graphics();

    // Alien body (green)
    graphics.fillStyle(0x32cd32);
    graphics.fillEllipse(15, 20, 20, 15);

    // Alien head
    graphics.fillStyle(0x228b22);
    graphics.fillEllipse(15, 8, 15, 12);

    // Eyes
    graphics.fillStyle(0xff0000);
    graphics.fillCircle(12, 8, 2);
    graphics.fillCircle(18, 8, 2);

    // Antennae
    graphics.lineStyle(2, 0x228b22);
    graphics.lineBetween(10, 4, 8, 0);
    graphics.lineBetween(20, 4, 22, 0);
    graphics.fillStyle(0xff0000);
    graphics.fillCircle(8, 0, 1);
    graphics.fillCircle(22, 0, 1);

    graphics.generateTexture('alien', 30, 25);
    graphics.destroy();
}

// Fixed starfield functions
function createStarfield() {
    stars = [];
    for (let i = 0; i < 150; i++) {
        // Create different types of stars for variety
        const starType = Math.random();
        let star;

        if (starType < 0.7) {
            // Regular white stars
            star = gameScene.add.circle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                Phaser.Math.Between(1, 2),
                0xffffff,
                Phaser.Math.FloatBetween(0.6, 1)
            );
            star.speed = Phaser.Math.FloatBetween(0.3, 1.5);
        } else if (starType < 0.85) {
            // Bright blue stars
            star = gameScene.add.circle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                Phaser.Math.Between(1, 3),
                0x87ceeb,
                Phaser.Math.FloatBetween(0.7, 1)
            );
            star.speed = Phaser.Math.FloatBetween(0.5, 2);
        } else {
            // Golden stars
            star = gameScene.add.circle(
                Phaser.Math.Between(0, 800),
                Phaser.Math.Between(0, 600),
                Phaser.Math.Between(2, 4),
                0xffd700,
                Phaser.Math.FloatBetween(0.8, 1)
            );
            star.speed = Phaser.Math.FloatBetween(0.2, 1);
        }

        // Set depth to ensure stars appear behind game objects
        star.setDepth(-1);
        star.twinkleTimer = Math.random() * 100;
        stars.push(star);
    }
}

function animateStarfield() {
    if (!gameScene || !stars) return;

    stars.forEach((star, index) => {
        if (!star || !star.active) return;

        // Move stars downward
        star.y += star.speed;
        if (star.y > 620) {
            star.y = -20;
            star.x = Phaser.Math.Between(0, 800);
        }

        // Enhanced twinkling effect
        star.twinkleTimer += 0.5;
        if (star.twinkleTimer > 100) {
            star.twinkleTimer = 0;
            gameScene.tweens.add({
                targets: star,
                alpha: Math.random() * 0.4 + 0.6,
                scaleX: Math.random() * 0.5 + 0.8,
                scaleY: Math.random() * 0.5 + 0.8,
                duration: 300 + Math.random() * 200,
                ease: 'Sine.easeInOut'
            });
        }
    });
}

// Start screen function
function showStartScreen() {
    gameScene.cameras.main.setBackgroundColor('#000022');

    const title = gameScene.add.text(400, 200, '🚀 HIGH ON STARS 🌟', {
        fontSize: '48px',
        fill: '#00ffff',
        fontFamily: 'Courier New',
        stroke: '#000000',
        strokeThickness: 2
    }).setOrigin(0.5).setDepth(10);

    const subtitle = gameScene.add.text(400, 260, 'BLACKHOLE Edition', {
        fontSize: '24px',
        fill: '#ffff00',
        fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(10);

    const instructions = gameScene.add.text(400, 320, 'Navigate your rocket through space\nCollect cosmic stars to survive\nAvoid aliens and black holes', {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Courier New',
        align: 'center'
    }).setOrigin(0.5).setDepth(10);

    const startText = gameScene.add.text(400, 420, 'Press SPACE to launch into the cosmos!', {
        fontSize: '20px',
        fill: '#00ff00',
        fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(10);

    // Music toggle instruction
    const musicText = gameScene.add.text(400, 480, 'Press M to toggle music', {
        fontSize: '16px',
        fill: '#888888',
        fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(10);

    // Pulsing effect on start text
    gameScene.tweens.add({
        targets: startText,
        alpha: 0.3,
        duration: 1000,
        yoyo: true,
        repeat: -1
    });

    // Initialize music system
    createSpaceMusic();

    // Fixed space key handling
    const spaceKey = gameScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey.once('down', () => {
        gameStarted = true;
        // Start music when game begins
        backgroundMusic.start();
        gameScene.scene.restart();
    });

    // Music toggle key
    const mKey = gameScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    mKey.on('down', () => {
        const enabled = toggleMusic();
        musicText.setText(enabled ? 'Music: ON (Press M to toggle)' : 'Music: OFF (Press M to toggle)');
        musicText.setFill(enabled ? '#00ff00' : '#ff0000');
    });
}

// Phaser scene functions
function preload() {
    // Create space-themed sprites
    createRocket(this);
    createStar(this, 0x0099ff, 'blue_star');
    createStar(this, 0x00cc00, 'green_star');
    createStar(this, 0xff0000, 'red_star');
    createStar(this, 0xffff00, 'yellow_star');
    createStar(this, 0x9900ff, 'purple_star');
    createAlien(this);
    createBlackHole(this);
}

function create() {
    gameScene = this;

    // Create starfield background first
    createStarfield();

    if (!gameStarted) {
        showStartScreen();
        return;
    }

    // Player setup (rocket)
    player = this.physics.add.sprite(400, 300, 'rocket').setCollideWorldBounds(true);
    player.setDisplaySize(48, 56); // Doubled from 24, 28 to 48, 56
    player.setDepth(5); // Ensure player appears above stars

    // Input
    cursors = this.input.keyboard.createCursorKeys();

    // Add music toggle key during gameplay
    const mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    mKey.on('down', () => {
        toggleMusic();
    });

    // Groups
    pills = this.physics.add.group();
    enemies = this.physics.add.group();
    traps = this.physics.add.group();

    // Collisions
    this.physics.add.overlap(player, pills, collectPill, null, this);
    this.physics.add.overlap(player, enemies, hitEnemy, null, this);
    this.physics.add.overlap(player, traps, hitTrap, null, this);

    // UI Elements
    createUI();

    // Spawn initial star
    spawnRandomPill();

    // Timers
    this.time.addEvent({
        delay: 3000,
        callback: spawnRandomPill,
        loop: true
    });

    this.time.addEvent({
        delay: 8000,
        callback: spawnEnemy,
        loop: true
    });

    this.time.addEvent({
        delay: 20000, // Increased from 12000 to 20000 (20 seconds)
        callback: spawnTrap,
        loop: true
    });

    // Survival timer
    this.time.addEvent({
        delay: 1000,
        callback: () => {
            if (!gameRunning) return;
            survivalTimer++;
            score += 10;
            updateUI();

            if (survivalTimer > Math.max(35 - chaosLevel, 15)) {
                loseLife("You drifted too far from the stars... Lost in space.");
            }
        },
        loop: true
    });

    // Animate starfield
    this.time.addEvent({
        delay: 50,
        callback: animateStarfield,
        loop: true
    });
}

function update() {
    if (!gameStarted || !gameRunning || !player) return;

    // Player movement with chaos effects
    player.setVelocity(0);
    let baseSpeed = 200;
    let totalSpeed = baseSpeed + speedBoost + (chaosLevel * 15);

    if (greenSpeedActive) {
        totalSpeed *= 10;
    }

    // Apply dizzy effect (reverse controls)
    let leftKey = dizzyEffect > 0 ? cursors.right : cursors.left;
    let rightKey = dizzyEffect > 0 ? cursors.left : cursors.right;
    let upKey = dizzyEffect > 0 ? cursors.down : cursors.up;
    let downKey = dizzyEffect > 0 ? cursors.up : cursors.down;

    if (leftKey.isDown) {
        player.setVelocityX(-totalSpeed);
        player.setRotation(-0.2);
    } else if (rightKey.isDown) {
        player.setVelocityX(totalSpeed);
        player.setRotation(0.2);
    } else {
        player.setRotation(0);
    }

    if (upKey.isDown) player.setVelocityY(-totalSpeed);
    if (downKey.isDown) player.setVelocityY(totalSpeed);

    // Apply screen shake
    if (shakeAmount > 0 || dizzyEffect > 0) {
        let shakeIntensity = shakeAmount + (dizzyEffect * 0.1);
        gameScene.cameras.main.shake(100, 0.001 * shakeIntensity);
        shakeAmount *= 0.92;
    }

    // Speed boost decay
    if (speedBoost > 0) {
        speedBoost *= 0.98;
    }

    // Dizzy effect decay
    if (dizzyEffect > 0) {
        dizzyEffect *= 0.997;
        if (dizzyEffect < 1) dizzyEffect = 0;
    }

    // Color flash effect
    if (colorFlash > 0) {
        const colors = ['#ff0000', '#0000ff', '#ffff00', '#ff00ff'];
        gameScene.cameras.main.setBackgroundColor(colors[Math.floor(Math.random() * colors.length)]);
        colorFlash--;
    }
    // Disco lights effect
    else if (discoLights > 0) {
        const discoColors = ['#ff0080', '#8000ff', '#0080ff', '#ff8000', '#80ff00', '#ff0040'];
        gameScene.cameras.main.setBackgroundColor(discoColors[Math.floor(Math.random() * discoColors.length)]);
        discoLights--;
    } else {
        gameScene.cameras.main.setBackgroundColor('#000011');
    }

    // Camera rotation when dizzy
    if (dizzyEffect > 0) {
        gameScene.cameras.main.setRotation(Math.sin(gameScene.time.now * 0.005) * 0.02 * (dizzyEffect / 100));
    } else {
        gameScene.cameras.main.setRotation(0);
    }

    // Move aliens toward player
    if (enemies && enemies.children) {
        enemies.children.entries.forEach(enemy => {
            if (!enemy.active) return;
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
            const speed = 30 + chaosLevel * 5;
            enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
            enemy.rotation += 0.02;
        });
    }

    // Animate black holes with enhanced effects
    if (traps && traps.children) {
        traps.children.entries.forEach(trap => {
            if (!trap.active) return;

            // Basic rotation is handled in spawnTrap now
            // Add gravitational pull effect on nearby objects
            const distanceToPlayer = Phaser.Math.Distance.Between(trap.x, trap.y, player.x, player.y);
            if (distanceToPlayer < 100) {
                // Subtle gravitational pull on player
                const pullStrength = (100 - distanceToPlayer) / 100 * 5;
                const angle = Phaser.Math.Angle.Between(player.x, player.y, trap.x, trap.y);
                player.x += Math.cos(angle) * pullStrength;
                player.y += Math.sin(angle) * pullStrength;

                // Visual distortion effect when player is near
                if (distanceToPlayer < 60) {
                    gameScene.cameras.main.shake(50, 0.002);
                }
            }

            // Pull in collectible stars if they're too close
            if (pills && pills.children) {
                pills.children.entries.forEach(pill => {
                    if (!pill.active) return;
                    const distanceToPill = Phaser.Math.Distance.Between(trap.x, trap.y, pill.x, pill.y);
                    if (distanceToPill < 80) {
                        const pullStrength = (80 - distanceToPill) / 80 * 2;
                        const angle = Phaser.Math.Angle.Between(pill.x, pill.y, trap.x, trap.y);
                        pill.x += Math.cos(angle) * pullStrength;
                        pill.y += Math.sin(angle) * pullStrength;

                        // Destroy pill if it gets too close
                        if (distanceToPill < 25) {
                            pill.destroy();
                        }
                    }
                });
            }
        });
    }
}

// Spawning functions
function spawnRandomPill() {
    if (!gameScene || !pills) return;

    const starTypes = [
        { sprite: 'blue_star', effect: 'blue' },
        { sprite: 'green_star', effect: 'green' },
        { sprite: 'red_star', effect: 'red' },
        { sprite: 'yellow_star', effect: 'yellow' },
        { sprite: 'purple_star', effect: 'purple' }
    ];

    const star = Phaser.Utils.Array.GetRandom(starTypes);
    const x = Phaser.Math.Between(50, 750);
    const y = Phaser.Math.Between(50, 550);

    const starSprite = pills.create(x, y, star.sprite);
    starSprite.setDisplaySize(50, 50); // Made larger for better visibility
    starSprite.pillType = star.effect;
    starSprite.setDepth(3); // Ensure collectible stars appear above background stars
    starSprite.setAlpha(1.0); // Full opacity

    // Add a bright glow effect
    const glow = gameScene.add.circle(x, y, 30, 0xffffff, 0.2);
    glow.setDepth(2);

    // Make the glow follow the star
    gameScene.tweens.add({
        targets: glow,
        alpha: 0.1,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Store glow reference to destroy it with the star
    starSprite.glowEffect = glow;

    // Make stars pulse more noticeably
    gameScene.tweens.add({
        targets: starSprite,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Add rotation
    gameScene.tweens.add({
        targets: starSprite,
        rotation: Math.PI * 2,
        duration: 2000,
        repeat: -1,
        ease: 'Linear'
    });

    // Clean up glow when star is destroyed
    const originalDestroy = starSprite.destroy;
    starSprite.destroy = function () {
        if (this.glowEffect && this.glowEffect.active) {
            this.glowEffect.destroy();
        }
        originalDestroy.call(this);
    };
}

function spawnEnemy() {
    if (!gameScene || !enemies) return;

    const x = Math.random() < 0.5 ? Phaser.Math.Between(-50, 0) : Phaser.Math.Between(800, 850);
    const y = Phaser.Math.Between(50, 550);

    const enemy = enemies.create(x, y, 'alien');
    enemy.setDisplaySize(30, 25);
    enemy.setCollideWorldBounds(true);
    enemy.setBounce(1);
    enemy.setDepth(4); // Above stars but below player

    // Remove enemy after 15 seconds
    gameScene.time.delayedCall(15000, () => {
        if (enemy && enemy.active) enemy.destroy();
    });
}

function spawnTrap() {
    if (!gameScene || !traps) return;

    const x = Phaser.Math.Between(100, 700);
    const y = Phaser.Math.Between(100, 500);

    const trap = traps.create(x, y, 'blackhole');
    trap.setDisplaySize(50, 50);
    trap.setDepth(2);
    trap.teleportCount = 0;
    trap.maxTeleports = Phaser.Math.Between(2, 4);

    // Create gravitational distortion effect
    const distortionField = gameScene.add.circle(x, y, 35, 0x4b0082, 0.1);
    distortionField.setDepth(1);
    trap.distortionField = distortionField;

    // Create particle effects around the black hole
    const particles = [];
    for (let i = 0; i < 12; i++) {
        const particle = gameScene.add.circle(x, y, 2, 0x00ffff, 0.8);
        particle.setDepth(3);
        particles.push(particle);
    }
    trap.particles = particles;

    // Animate gravitational field pulsing
    gameScene.tweens.add({
        targets: distortionField,
        scaleX: 1.5,
        scaleY: 1.5,
        alpha: 0.05,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Animate the black hole itself with multiple effects
    gameScene.tweens.add({
        targets: trap,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Rotation with increasing speed
    let rotationSpeed = 0.03;
    const rotationTimer = gameScene.time.addEvent({
        delay: 100,
        callback: () => {
            if (trap && trap.active) {
                trap.rotation += rotationSpeed;
                rotationSpeed += 0.001; // Accelerating rotation

                // Animate particles orbiting the black hole
                particles.forEach((particle, index) => {
                    if (particle && particle.active) {
                        const angle = (index / particles.length) * Math.PI * 2 + trap.rotation * 2;
                        const radius = 25 + Math.sin(gameScene.time.now * 0.01 + index) * 5;
                        particle.x = trap.x + Math.cos(angle) * radius;
                        particle.y = trap.y + Math.sin(angle) * radius;

                        // Particle flickering
                        particle.alpha = 0.5 + Math.sin(gameScene.time.now * 0.02 + index) * 0.3;
                    }
                });
            }
        },
        loop: true
    });

    // Teleportation system
    const teleportTimer = gameScene.time.addEvent({
        delay: Phaser.Math.Between(4000, 7000),
        callback: () => {
            if (trap && trap.active && trap.teleportCount < trap.maxTeleports) {
                teleportBlackHole(trap);
                trap.teleportCount++;

                // Schedule next teleport with decreasing intervals
                teleportTimer.delay = Math.max(2000, teleportTimer.delay - 500);
                teleportTimer.reset({
                    delay: teleportTimer.delay,
                    callback: teleportTimer.callback,
                    loop: false
                });
            }
        },
        loop: false
    });

    // Store timers for cleanup
    trap.rotationTimer = rotationTimer;
    trap.teleportTimer = teleportTimer;

    // Enhanced cleanup function
    const originalDestroy = trap.destroy;
    trap.destroy = function () {
        if (this.distortionField && this.distortionField.active) {
            this.distortionField.destroy();
        }
        if (this.particles) {
            this.particles.forEach(particle => {
                if (particle && particle.active) particle.destroy();
            });
        }
        if (this.rotationTimer) this.rotationTimer.destroy();
        if (this.teleportTimer) this.teleportTimer.destroy();
        originalDestroy.call(this);
    };

    // Remove black hole after extended time
    gameScene.time.delayedCall(25000, () => {
        if (trap && trap.active) trap.destroy();
    });
}

// New teleportation function
function teleportBlackHole(blackHole) {
    if (!blackHole || !blackHole.active) return;

    // Create dramatic teleport-out effect
    gameScene.cameras.main.shake(200, 0.01);

    // Implosion effect
    gameScene.tweens.add({
        targets: [blackHole, blackHole.distortionField],
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: 300,
        ease: 'Power2.easeIn',
        onComplete: () => {
            // Teleport to new position
            const newX = Phaser.Math.Between(100, 700);
            const newY = Phaser.Math.Between(100, 500);

            blackHole.setPosition(newX, newY);
            if (blackHole.distortionField) {
                blackHole.distortionField.setPosition(newX, newY);
            }

            // Explosion effect at new location
            const explosionParticles = [];
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const particle = gameScene.add.circle(
                    newX + Math.cos(angle) * 20,
                    newY + Math.sin(angle) * 20,
                    3,
                    0x8a2be2,
                    0.8
                );
                particle.setDepth(4);
                explosionParticles.push(particle);

                // Animate explosion particles
                gameScene.tweens.add({
                    targets: particle,
                    x: newX + Math.cos(angle) * 60,
                    y: newY + Math.sin(angle) * 60,
                    alpha: 0,
                    scaleX: 0.1,
                    scaleY: 0.1,
                    duration: 500,
                    ease: 'Power2.easeOut',
                    onComplete: () => particle.destroy()
                });
            }

            // Flash effect
            const flash = gameScene.add.circle(newX, newY, 80, 0xffffff, 0.6);
            flash.setDepth(5);
            gameScene.tweens.add({
                targets: flash,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                duration: 400,
                ease: 'Power2.easeOut',
                onComplete: () => flash.destroy()
            });

            // Restore black hole with dramatic entrance
            gameScene.tweens.add({
                targets: [blackHole, blackHole.distortionField],
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                duration: 500,
                ease: 'Back.easeOut'
            });

            // Screen flash
            gameScene.cameras.main.flash(300, 139, 69, 19, false, (camera, progress) => {
                if (progress === 1) {
                    gameScene.cameras.main.shake(100, 0.005);
                }
            });
        }
    });
}

// Game mechanics
function collectPill(player, pill) {
    playCollectSound(); // Add sound effect
    applyPillEffect(pill.pillType);
    pill.destroy();
    chaosLevel++;
    pillsConsumed++;
    score += 50;
    survivalTimer = 0;
    updateUI();
}

function applyPillEffect(type) {
    switch (type) {
        case 'blue':
            // Hyperdrive boost + clear all effects
            speedBoost += 150;
            dizzyEffect = 0;
            greenSpeedActive = false;
            discoLights = 0;
            colorFlash = 0;
            break;

        case 'green':
            // Warp speed + clear dizzy effect
            greenSpeedActive = true;
            dizzyEffect = 0;
            chaosLevel = Math.max(1, chaosLevel - 0.5);
            discoLights = 0;
            colorFlash = 0;
            break;

        case 'red':
            // Navigation malfunction + space turbulence
            dizzyEffect = 80;
            shakeAmount += 8;
            greenSpeedActive = false;
            discoLights = 0;
            colorFlash = 0;
            gameScene.cameras.main.setBackgroundColor('#330000');
            break;

        case 'yellow':
            // Quantum teleport + clear all effects
            const x = Phaser.Math.Between(50, 750);
            const y = Phaser.Math.Between(50, 550);
            player.setPosition(x, y);
            dizzyEffect = 0;
            greenSpeedActive = false;
            discoLights = 0;
            colorFlash = 0;
            gameScene.cameras.main.setBackgroundColor('#333300');
            break;

        case 'purple':
            // Cosmic disco + clear dizzy effect
            discoLights = 60;
            shakeAmount += 4;
            speedBoost += 75;
            dizzyEffect = 0;
            greenSpeedActive = false;
            colorFlash = 0;
            break;
    }
}

function hitEnemy(player, enemy) {
    enemy.destroy();
    chaosLevel += 1;
    shakeAmount += 5;
    score -= 25;

    if (chaosLevel > 20) {
        loseLife("The cosmic chaos overwhelmed your systems... Life support failing!");
    }
}

function hitTrap(player, trap) {
    playTeleportSound(); // Add teleport sound effect

    // Create dramatic teleportation effect
    gameScene.cameras.main.flash(200, 138, 43, 226, false);
    gameScene.cameras.main.shake(300, 0.02);

    // Player teleportation effect
    const playerTeleportEffect = gameScene.add.circle(player.x, player.y, 40, 0x8a2be2, 0.8);
    playerTeleportEffect.setDepth(10);

    gameScene.tweens.add({
        targets: playerTeleportEffect,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 500,
        ease: 'Power2.easeOut',
        onComplete: () => playerTeleportEffect.destroy()
    });

    // Teleport player to random safe location
    const newX = Phaser.Math.Between(80, 720);
    const newY = Phaser.Math.Between(80, 520);
    player.setPosition(newX, newY);

    // Create arrival effect at new position
    const arrivalEffect = gameScene.add.circle(newX, newY, 60, 0xff6b35, 0.6);
    arrivalEffect.setDepth(10);

    gameScene.tweens.add({
        targets: arrivalEffect,
        scaleX: 0.2,
        scaleY: 0.2,
        alpha: 0,
        duration: 400,
        ease: 'Power2.easeIn',
        onComplete: () => arrivalEffect.destroy()
    });

    // Particle burst at arrival location
    for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const particle = gameScene.add.circle(
            newX + Math.cos(angle) * 10,
            newY + Math.sin(angle) * 10,
            3,
            0xffffff,
            0.9
        );
        particle.setDepth(11);

        gameScene.tweens.add({
            targets: particle,
            x: newX + Math.cos(angle) * 40,
            y: newY + Math.sin(angle) * 40,
            alpha: 0,
            duration: 300,
            ease: 'Power2.easeOut',
            onComplete: () => particle.destroy()
        });
    }

    // Apply negative effects
    speedBoost -= 30; // Reduced penalty since teleportation can be helpful
    chaosLevel += 0.3; // Reduced chaos increase
    shakeAmount += 4;
    score -= 15; // Reduced score penalty
    dizzyEffect += 20; // Add some disorientation after teleportation

    // Show teleportation message
    const teleportText = gameScene.add.text(newX, newY - 50, 'QUANTUM TELEPORT!', {
        fontSize: '16px',
        fill: '#00ffff',
        fontFamily: 'Courier New',
        stroke: '#000000',
        strokeThickness: 2
    }).setOrigin(0.5).setDepth(12);

    gameScene.tweens.add({
        targets: teleportText,
        y: newY - 80,
        alpha: 0,
        duration: 1500,
        ease: 'Power2.easeOut',
        onComplete: () => teleportText.destroy()
    });


    updateUI();
}

function createUI() {
    // Lives display
    const livesLabel = gameScene.add.text(20, 20, '🚀 Lives:', {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
    }).setDepth(10);

    const livesValue = gameScene.add.text(100, 20, lives.toString(), {
        fontSize: '18px',
        fill: '#00ff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setDepth(10);
    livesValue.name = 'livesDisplay';

    // Score display
    const scoreLabel = gameScene.add.text(20, 50, '⭐ Score:', {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
    }).setDepth(10);

    const scoreValue = gameScene.add.text(100, 50, score.toString(), {
        fontSize: '18px',
        fill: '#ffff00',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setDepth(10);
    scoreValue.name = 'scoreDisplay';

    // Chaos level display
    const chaosLabel = gameScene.add.text(20, 80, '🌪 Chaos:', {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
    }).setDepth(10);

    const chaosValue = gameScene.add.text(110, 80, Math.floor(chaosLevel).toString(), {
        fontSize: '18px',
        fill: '#ff6600',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setDepth(10);
    chaosValue.name = 'chaosDisplay';

    // Survival timer display
    const timerLabel = gameScene.add.text(200, 20, '⏱ Time:', {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
    }).setDepth(10);

    const timerValue = gameScene.add.text(270, 20, survivalTimer.toString() + 's', {
        fontSize: '18px',
        fill: '#00ffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setDepth(10);
    timerValue.name = 'timerDisplay';

    // Stars collected display
    const starsLabel = gameScene.add.text(200, 50, '⭐ Stars:', {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
    }).setDepth(10);

    const starsValue = gameScene.add.text(280, 50, pillsConsumed.toString(), {
        fontSize: '18px',
        fill: '#ff00ff',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setDepth(10);
    starsValue.name = 'starsDisplay';

    // Speed indicator
    const speedLabel = gameScene.add.text(200, 80, '🚀 Speed:', {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
    }).setDepth(10);

    const speedValue = gameScene.add.text(290, 80, 'Normal', {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Courier New',
        fontStyle: 'bold'
    }).setDepth(10);
    speedValue.name = 'speedDisplay';
}

function loseLife(message) {
    lives--;

    if (lives <= 0) {
        gameOver(message);
    } else {
        // Flash screen and continue
        gameScene.cameras.main.flash(500, 255, 0, 0);

        // Reset some stats but keep playing
        chaosLevel = Math.max(1, chaosLevel - 2);
        survivalTimer = 0;
        speedBoost = 0;
        dizzyEffect = 0;

        // Show life lost message briefly
        const lostLifeText = gameScene.add.text(400, 300, `Hull Breach! ${lives} lives remaining`, {
            fontSize: '24px',
            fill: '#ff0000',
            fontFamily: 'Courier New'
        }).setOrigin(0.5).setDepth(10);

        gameScene.time.delayedCall(2000, () => {
            if (lostLifeText && lostLifeText.active) {
                lostLifeText.destroy();
            }
        });
    }

    updateUI();
}

function gameOver(message) {
    gameRunning = false;
    gameScene.physics.pause();

    // Dark overlay
    const overlay = gameScene.add.rectangle(400, 300, 800, 600, 0x000000, 0.8).setDepth(15);

    // Game over text
    gameScene.add.text(400, 200, 'MISSION FAILED', {
        fontSize: '48px',
        fill: '#ff0000',
        fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(20);

    gameScene.add.text(400, 250, message, {
        fontSize: '20px',
        fill: '#ffffff',
        fontFamily: 'Courier New',
        wordWrap: { width: 600 }
    }).setOrigin(0.5).setDepth(20);

    gameScene.add.text(400, 300, `Final Stats:`, {
        fontSize: '24px',
        fill: '#00ff00',
        fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(20);

    gameScene.add.text(400, 330, `Score: ${score}`, {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(20);

    gameScene.add.text(400, 350, `Stars Collected: ${pillsConsumed}`, {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(20);

    gameScene.add.text(400, 370, `Chaos Level Reached: ${Math.floor(chaosLevel)}`, {
        fontSize: '18px',
        fill: '#ffffff',
        fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(20);

    const playAgainText = gameScene.add.text(400, 430, 'Press SPACE to launch again!', {
        fontSize: '20px',
        fill: '#00ff00',
        fontFamily: 'Courier New'
    }).setOrigin(0.5).setDepth(20);

    // Pulsing effect on play again text
    gameScene.tweens.add({
        targets: playAgainText,
        alpha: 0.3,
        duration: 1000,
        yoyo: true,
        repeat: -1
    });

    const spaceKey = gameScene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceKey.once('down', () => {
        resetGame();
        gameScene.scene.restart();
    });
}

function updateUI() {
    // Find and update display elements by name
    const livesDisplay = gameScene.children.getByName('livesDisplay');
    const scoreDisplay = gameScene.children.getByName('scoreDisplay');
    const chaosDisplay = gameScene.children.getByName('chaosDisplay');
    const timerDisplay = gameScene.children.getByName('timerDisplay');
    const starsDisplay = gameScene.children.getByName('starsDisplay');
    const speedDisplay = gameScene.children.getByName('speedDisplay');

    if (livesDisplay) {
        livesDisplay.setText(lives.toString());
        // Color coding for lives
        if (lives > 2) livesDisplay.setFill('#00ff00');
        else if (lives > 1) livesDisplay.setFill('#ffff00');
        else livesDisplay.setFill('#ff0000');
    }

    if (scoreDisplay) {
        scoreDisplay.setText(score.toString());
    }

    if (chaosDisplay) {
        chaosDisplay.setText(Math.floor(chaosLevel).toString());
        // Color coding for chaos level
        if (chaosLevel < 5) chaosDisplay.setFill('#00ff00');
        else if (chaosLevel < 10) chaosDisplay.setFill('#ffff00');
        else if (chaosLevel < 15) chaosDisplay.setFill('#ff6600');
        else chaosDisplay.setFill('#ff0000');
    }

    if (timerDisplay) {
        timerDisplay.setText(survivalTimer.toString() + 's');
        // Warning color when timer gets high
        if (survivalTimer > 25) timerDisplay.setFill('#ff0000');
        else if (survivalTimer > 20) timerDisplay.setFill('#ffff00');
        else timerDisplay.setFill('#00ffff');
    }

    if (starsDisplay) {
        starsDisplay.setText(pillsConsumed.toString());
    }

    if (speedDisplay) {
        let speedText = 'Normal';
        let speedColor = '#ffffff';

        if (greenSpeedActive) {
            speedText = 'WARP!';
            speedColor = '#00ff00';
        } else if (speedBoost > 100) {
            speedText = 'Boost';
            speedColor = '#00ffff';
        } else if (speedBoost < -50) {
            speedText = 'Slow';
            speedColor = '#ff0000';
        } else if (dizzyEffect > 0) {
            speedText = 'Dizzy';
            speedColor = '#ff00ff';
        }

        speedDisplay.setText(speedText);
        speedDisplay.setFill(speedColor);
    }

    // Legacy DOM element updates (if they exist)
    const livesElement = document.getElementById('lives');
    const scoreElement = document.getElementById('score');
    const chaosElement = document.getElementById('chaos');
    const timerElement = document.getElementById('timer');
    const pillsElement = document.getElementById('pills');

    if (livesElement) livesElement.textContent = lives;
    if (scoreElement) scoreElement.textContent = score;
    if (chaosElement) chaosElement.textContent = Math.floor(chaosLevel);
    if (timerElement) timerElement.textContent = survivalTimer;
    if (pillsElement) pillsElement.textContent = pillsConsumed;
}

function resetGame() {
    // Reset all game variables
    chaosLevel = 1;
    survivalTimer = 0;
    pillsConsumed = 0;
    shakeAmount = 0;
    speedBoost = 0;
    colorFlash = 0;
    dizzyEffect = 0;
    greenSpeedActive = false;
    discoLights = 0;
    gameRunning = true;
    lives = 3;
    score = 0;
    backgroundColorIndex = 0;

    // Restart music
    if (musicEnabled && backgroundMusic) {
        backgroundMusic.start();
    }
}

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#000011',
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload,
        create,
        update
    }
};

// Initialize the game
const game = new Phaser.Game(config);