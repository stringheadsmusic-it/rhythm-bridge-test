/**
 * Rhythmic Constants based on Spec
 */
const RHYTHM_CONFIG = {
    BPM: 120,
    BEAT_UNIT: 100, // 1 Unit (U) = 100px
    BEAT_DURATION: 0.5 // 1 Beat = 0.5s
};

/**
 * Audio Engine Setup
 */
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Master Limiter to cut off all audio beyond -0.1 dB
const limiter = audioCtx.createDynamicsCompressor();
limiter.threshold.setValueAtTime(-0.1, audioCtx.currentTime); // Threshold -0.1 dB
limiter.knee.setValueAtTime(0, audioCtx.currentTime);        // Hard knee
limiter.ratio.setValueAtTime(20, audioCtx.currentTime);      // Limiting ratio
limiter.attack.setValueAtTime(0.003, audioCtx.currentTime);  // Fast attack (3ms)
limiter.release.setValueAtTime(0.1, audioCtx.currentTime);   // Release (100ms)
limiter.connect(audioCtx.destination);

function playAudioNote(duration, type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // Pick frequency based on block type: Q=C5 (523.25Hz), H=G4 (392.00Hz), W=C4 (261.63Hz)
    let freq = 261.63; // Default to W (C4)
    if (type === 'Q') freq = 523.25;
    else if (type === 'H') freq = 392.00;
    
    const now = audioCtx.currentTime;
    
    // Detuned fundamental oscillators (triangle waves) for a rich, warm chorus effect (prevents dry/harsh test tones)
    const osc1a = audioCtx.createOscillator();
    osc1a.type = 'triangle';
    osc1a.frequency.setValueAtTime(freq - 1.5, now);
    
    const osc1b = audioCtx.createOscillator();
    osc1b.type = 'triangle';
    osc1b.frequency.setValueAtTime(freq + 1.5, now);
    
    // Metal/wood strike transient (simulates mallet hit)
    const osc2 = audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.5, now); // 2.5x harmonic
    
    // Gain nodes for volume envelopes
    const gain1 = audioCtx.createGain();
    const gain2 = audioCtx.createGain();
    
    // Lowpass filter with exponential damping sweep (makes the sustain warmer and more soothing over time)
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + duration); // Damping sweep from 1200Hz to 300Hz
    filter.Q.setValueAtTime(1, now);
    
    // Route detuned fundamental oscs
    osc1a.connect(gain1);
    osc1b.connect(gain1);
    gain1.connect(filter);
    
    // Route strike osc (strike node decays extremely fast)
    osc2.connect(gain2);
    gain2.connect(filter);
    
    // Connect filter to master limiter
    filter.connect(limiter);
    
    // Envelope for fundamental (ADSR curve for prominent, clear sustain)
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.005); // Attack
    gain1.gain.exponentialRampToValueAtTime(0.06, now + 0.15); // Decay to sustain level
    gain1.gain.setValueAtTime(0.06, now + duration - 0.1); // Sustain hold
    gain1.gain.linearRampToValueAtTime(0.001, now + duration); // Release
    
    // Envelope for strike transient (sharp hit)
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.05, now + 0.002);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04); // 40ms decay
    
    osc1a.start(now);
    osc1b.start(now);
    osc2.start(now);
    
    osc1a.stop(now + duration + 0.1);
    osc1b.stop(now + duration + 0.1);
    osc2.stop(now + 0.05);
}

function playMajorChord() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    // C4, E4, G4
    [261.63, 329.63, 392.00].forEach(freq => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime + 1.0);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.0);
        
        osc.connect(gainNode);
        gainNode.connect(limiter);
        osc.start();
        osc.stop(audioCtx.currentTime + 2.0);
    });
}

function playGlitchNoise() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.3); // Drop rapidly
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    osc.connect(gainNode);
    gainNode.connect(limiter);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

function playClickSound(pitch = 800) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);
    
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // keep volume subtle in background
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
    
    osc.connect(gainNode);
    gainNode.connect(limiter);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.08);
}

/**
 * Sync Engine - Handles Game Loop & Movement
 */
class SyncEngine {
    constructor() {
        this.player = document.getElementById('player');
        this.gameContainer = document.querySelector('.game-container');
        this.playerBody = this.player.querySelector('.player-body');
        this.earLeft = this.player.querySelector('.rabbit-ear.left');
        this.earRight = this.player.querySelector('.rabbit-ear.right');
        
        this.state = 'IDLE'; // 'IDLE' or 'WALK'
        
        // Cache layer nodes to avoid querying DOM in update/render loops
        this.clouds = document.querySelector('.layer-clouds');
        this.back = document.querySelector('.layer-back');
        this.mid = document.querySelector('.layer-mid');
        this.front = document.querySelector('.layer-front');
        this.scoreEl = document.getElementById('live-score');
        this.pContainer = document.getElementById('particle-container');
        
        // Arrays for gap/block caching instead of DOM traversal
        this.gaps = [];
        this.placedBlocks = [];
        
        // Spec: 120 BPM -> 2 beats per second. 1 Beat = 100px.
        // Therefore, velocity = 2 * 100px = 200px/s
        this.currentBPM = RHYTHM_CONFIG.BPM;
        this.velocity = (this.currentBPM / 60) * RHYTHM_CONFIG.BEAT_UNIT; 
        
        // Start position (moved back one block to start at 0)
        this.positionX = 0; 
        this.lastTime = 0;
        this.requestID = null;
        this.currentBlock = null;
        
        this.lastGapChecked = null;
        this.currentGapWaiting = null;
        this.lastRenderedPositionX = null;
        this.lastClickBeat = -1;
        
        // Initialize starting infinite bridge variables
        this.lastBridgeSegmentType = 'solid';
        this.extendBridge();
        
        this.init();
    }
    
    init() {
        this.setPlayerState('IDLE');
        // Start game loop
        this.loop = this.loop.bind(this);
        this.requestID = requestAnimationFrame(this.loop);
    }
    
    startCharacter() {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        this.setPlayerState('WALK');
    }

    setPlayerState(state) {
        this.state = state;
        if (state === 'IDLE') {
            this.player.className = 'player-character idle';
        } else if (state === 'WALK') {
            this.player.className = 'player-character walk';
        } else if (state === 'FALL') {
            this.player.className = 'player-character fall';
        }
    }
    
    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = (timestamp - this.lastTime) / 1000; // converted to seconds
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();
        
        this.requestID = requestAnimationFrame(this.loop);
    }
    
    update(deltaTime) {
        if (this.state === 'WALK') {
            this.positionX += this.velocity * deltaTime;
            
            // Metronome Click Track Trigger (synchronized to rabbit's position beats)
            const triggerX = this.positionX + 100;
            const currentBeat = Math.floor(triggerX / RHYTHM_CONFIG.BEAT_UNIT);
            if (currentBeat !== this.lastClickBeat) {
                this.lastClickBeat = currentBeat;
                const isDownbeat = (currentBeat % 4 === 0);
                playClickSound(isDownbeat ? 1000 : 600);
            }
            
            // Dynamic difficulty: speed up BPM by 2 for every 2 beats traveled, uncapped to increase difficulty indefinitely
            const beatIndex = Math.floor(this.positionX / RHYTHM_CONFIG.BEAT_UNIT);
            const speedIncrease = Math.floor(beatIndex / 2) * 2;
            const targetBPM = 120 + speedIncrease;
            if (this.currentBPM !== targetBPM) {
                this.currentBPM = targetBPM;
                this.velocity = (this.currentBPM / 60) * RHYTHM_CONFIG.BEAT_UNIT;
                
                const beatDuration = 60 / this.currentBPM;
                this.player.style.setProperty('--walk-duration', `${beatDuration}s`);
            }
            
            // Update live score display via cached reference
            if (this.scoreEl) {
                this.scoreEl.textContent = `SCORE: ${beatIndex}`;
            }
            
            // Extend the bridge dynamically
            this.extendBridge();
            
            this.checkGapDetection();
            this.checkAudioTriggers();
        }
    }
    
    checkGapDetection() {
        const triggerX = this.positionX + 100;
        
        for (let gap of this.gaps) {
            const gapAbsLeft = gap.offsetLeft;
            
            // When rabbit leading edge enters the gap
            if (triggerX >= gapAbsLeft && triggerX < gapAbsLeft + gap.offsetWidth) {
                if (this.lastGapChecked !== gap) {
                    this.lastGapChecked = gap;
                    
                    const block = gap.querySelector('.note-block');
                    if (block) {
                        const type = block.dataset.type;
                        const expectedWidth = type === 'W' ? 400 : (type === 'H' ? 200 : 100);
                        const gapWidth = gap.offsetWidth;
                        
                        if (expectedWidth === gapWidth) {
                            // Correct block! Add bloom effect and let rabbit pass
                            block.classList.add('active-bloom');
                        } else {
                            // Incorrect block! Block and rabbit fall together immediately
                            block.classList.add('wrong-fit');
                            block.classList.add('falling');
                            this.triggerFall();
                            break;
                        }
                    } else {
                        // Unfilled gap! Rabbit falls immediately into the void
                        this.triggerFall();
                        break;
                    }
                }
            }
        }
        
        // Garbage collect array cache references for gaps that are completely behind the rabbit (keeps array length very small)
        this.gaps = this.gaps.filter(gap => gap.offsetLeft + gap.offsetWidth > this.positionX - 200);
    }
    
    handleInput(type) {
        if (this.state !== 'WALK') return;
        
        const triggerX = this.positionX + 100;
        let targetGap = null;
        
        for (let gap of this.gaps) {
            // Must be ahead of rabbit (with a 50px buffer)
            if (gap.offsetLeft > triggerX - 50) {
                const block = gap.querySelector('.note-block');
                if (!block) {
                    targetGap = gap;
                    break;
                }
            }
        }
        
        if (targetGap) {
            targetGap.innerHTML = '';
            const newBlock = document.createElement('div');
            newBlock.className = `note-block block-${type.toLowerCase()}`;
            newBlock.dataset.type = type;
            
            // If the placed block size does not match the gap width, immediately style it as disorganized/wrong-fit
            const expectedWidth = type === 'W' ? 400 : (type === 'H' ? 200 : 100);
            if (expectedWidth !== targetGap.offsetWidth) {
                newBlock.classList.add('wrong-fit');
            }
            
            targetGap.appendChild(newBlock);
            this.placedBlocks.push(newBlock); // Add reference to cache
        }
    }
    
    triggerFall() {
        this.setPlayerState('FALL');
        playGlitchNoise();
        
        const glitchOverlay = document.getElementById('screen-glitch');
        glitchOverlay.classList.add('active');
        
        document.body.classList.add('failed');
        
        const score = Math.floor(this.positionX / RHYTHM_CONFIG.BEAT_UNIT);
        const highScore = parseInt(localStorage.getItem('rhythm_best_score') || '0', 10);
        
        let newBest = false;
        if (score > highScore) {
            localStorage.setItem('rhythm_best_score', score);
            newBest = true;
        }
        
        const finalHighScore = newBest ? score : highScore;
        
        const finalScoreEl = document.getElementById('final-score');
        if (finalScoreEl) finalScoreEl.textContent = score;
        
        const gameOverBestScoreEl = document.getElementById('game-over-best-score');
        if (gameOverBestScoreEl) gameOverBestScoreEl.textContent = finalHighScore;
        
        const gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'flex';
        }
        
        setTimeout(() => {
            glitchOverlay.classList.remove('active');
        }, 600);

        // Reset the level automatically after 2 seconds so the player can try again
        setTimeout(() => {
            this.resetLevel();
        }, 2000);
    }
    
    extendBridge() {
        const bridgeContainer = document.getElementById('bridge');
        if (!bridgeContainer) return;
        
        const gameWorld = document.getElementById('game-world');
        
        let lastX = 0;
        const lastChild = bridgeContainer.lastElementChild;
        if (lastChild) {
            lastX = lastChild.offsetLeft + lastChild.offsetWidth;
        }
        
        // Keep generating bridge segments up to 2000px ahead of the rabbit
        while (lastX < this.positionX + 2000) {
            const solidChoices = [100, 200, 300, 400];
            const gapChoices = [100, 200, 400];
            
            let type = 'solid';
            let width = 100;
            
            if (this.lastBridgeSegmentType === 'solid') {
                type = 'gap';
                width = gapChoices[Math.floor(Math.random() * gapChoices.length)];
                this.lastBridgeSegmentType = 'gap';
            } else {
                type = 'solid';
                width = solidChoices[Math.floor(Math.random() * solidChoices.length)];
                this.lastBridgeSegmentType = 'solid';
            }
            
            const seg = document.createElement('div');
            seg.className = `bridge-segment ${type}`;
            seg.style.left = `${lastX}px`;
            seg.style.width = `${width}px`;
            bridgeContainer.appendChild(seg);
            
            if (type === 'gap') {
                this.gaps.push(seg); // Cache gap reference
            }
            
            lastX += width;
        }
        
        // Garbage collect old off-screen DOM nodes from the bridge container to keep browser memory usage constant
        const children = Array.from(bridgeContainer.children);
        for (let seg of children) {
            if (seg.offsetLeft + seg.offsetWidth < this.positionX - 800) {
                seg.remove();
            }
        }
        
        // Dynamically expand the scrollable game world container width
        if (gameWorld) {
            gameWorld.style.width = `${lastX + 2000}px`;
        }
    }

    resetLevel() {
        this.positionX = 0;
        this.lastRenderedPositionX = null; // Force render on next frame
        
        // Reset camera / game world translation
        const gameWorld = document.getElementById('game-world');
        if (gameWorld) {
            gameWorld.style.transform = 'translate3d(0, 0, 0)';
        }
        
        this.lastTime = 0;
        this.currentBlock = null;
        this.lastGapChecked = null;
        this.currentGapWaiting = null;
        this.lastClickBeat = -1;
        
        // Reset speed to starting values
        this.currentBPM = RHYTHM_CONFIG.BPM;
        this.velocity = (this.currentBPM / 60) * RHYTHM_CONFIG.BEAT_UNIT;
        this.player.style.setProperty('--walk-duration', '0.5s');
        
        // Reset caches
        this.gaps = [];
        this.placedBlocks = [];
        
        // Regenerate bridge platform and rebuild starting layouts
        generateBridge(RHYTHM_CONFIG.BEAT_UNIT);
        this.lastBridgeSegmentType = 'solid';
        this.extendBridge();
        
        this.setPlayerState('IDLE');
        this.render();
        
        // Reset live score display
        if (this.scoreEl) {
            this.scoreEl.textContent = 'SCORE: 0';
        }
        
        const gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen) {
            gameOverScreen.style.display = 'none';
        }
        document.body.classList.remove('failed');
        
        // Reset global application state to BUILD
        window.appState = 'BUILD';
        
        // Show Start Screen again so they click start to run again
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            // Update start screen high score text
            const highScore = localStorage.getItem('rhythm_best_score') || '0';
            const startBestScore = document.getElementById('start-best-score');
            if (startBestScore) startBestScore.textContent = highScore;
            
            startScreen.classList.remove('hidden');
        }
        
        // Remove failure body styling
        document.body.classList.remove('failed');
    }
    
    checkAudioTriggers() {
        const triggerX = this.positionX + 100; 
        
        let foundBlock = null;
        
        // Find block collisions along the X-axis iteratively using array cache
        for (let block of this.placedBlocks) {
            if (block.classList.contains('falling') || block.classList.contains('wrong-fit')) continue; // Skip falling or wrong blocks
            
            const gap = block.parentElement;
            if (!gap) continue;
            
            const blockAbsLeft = gap.offsetLeft + block.offsetLeft;
            const blockAbsRight = blockAbsLeft + block.offsetWidth;
            
            if (triggerX >= blockAbsLeft && triggerX < blockAbsRight) {
                foundBlock = block;
                break;
            }
        }
        
        if (foundBlock && this.currentBlock !== foundBlock) {
            this.currentBlock = foundBlock;
            
            // Bloom and trigger new block!
            if (this.currentBlock) {
                this.currentBlock.classList.add('active-bloom');
                const type = this.currentBlock.dataset.type;
                
                let duration = 0.5; // Quarter=0.5s by spec
                if (type === 'H') duration = 1.0;
                else if (type === 'W') duration = 2.0;
                
                playAudioNote(duration, type);
                this.spawnRingWave();
            }
        }
        
        // Garbage collect array cache references for blocks that are completely behind the rabbit
        this.placedBlocks = this.placedBlocks.filter(block => {
            const gap = block.parentElement;
            if (!gap) return false;
            return gap.offsetLeft + gap.offsetWidth > this.positionX - 200;
        });
    }

    spawnRingWave() {
        // Particle effect ring wave at foot using cached node
        if (!this.pContainer) return;
        
        const ring = document.createElement('div');
        ring.className = 'ring-wave';
        this.pContainer.appendChild(ring);
        
        // Clean up memory
        setTimeout(() => {
            if (ring.parentElement) {
                ring.parentElement.removeChild(ring);
            }
        }, 600);
    }
    
    render() {
        if (this.positionX === this.lastRenderedPositionX) {
            return;
        }
        this.lastRenderedPositionX = this.positionX;

        // Combine horizontal movement and vertical bounce into a single parent translate3d to avoid layout thrashing
        const bounce = this.state === 'WALK' ? Math.abs(Math.sin((this.positionX / RHYTHM_CONFIG.BEAT_UNIT) * Math.PI)) : 0;
        const ty = this.state === 'WALK' ? 4 - (20 * bounce) : 0; // Softened bounce height (20px) to look simple and elegant
        
        if (this.player) {
            this.player.style.transform = `translate3d(${this.positionX}px, ${ty}px, 0)`;
        }
        
        // Camera follows character
        // We want the character to remain roughly slightly to the left of the center of screen.
        const targetScroll = this.positionX - (this.gameContainer.clientWidth * 0.2);
        const scrollX = targetScroll > 0 ? targetScroll : 0;
        
        // Translate the entire #game-world container instead of scrolling the container physically,
        // which gives fluid, sub-pixel, jitter-free GPU camera scrolling
        const gameWorld = document.getElementById('game-world');
        if (gameWorld) {
            gameWorld.style.transform = `translate3d(${-scrollX}px, 0, 0)`;
        }
    }
}

/**
 * Utility to build random procedural bridge
 */
function generateBridge(beatUnit) {
    const bridgeContainer = document.getElementById('bridge');
    if (!bridgeContainer) return;
    bridgeContainer.innerHTML = '';
    
    // Always start with a solid block for spawn (8 beats long to give reaction time) using absolute position
    const seg = document.createElement('div');
    seg.className = 'bridge-segment solid';
    seg.style.left = '0px';
    seg.style.width = `${8 * beatUnit}px`;
    bridgeContainer.appendChild(seg);
}

/**
 * Game Initialization
 */
document.addEventListener('DOMContentLoaded', () => {
    window.appState = 'BUILD';

    // 1. Initialize start screen best score display
    const highScore = localStorage.getItem('rhythm_best_score') || '0';
    const startBestScore = document.getElementById('start-best-score');
    if (startBestScore) startBestScore.textContent = highScore;

    // 2. Generate initial spawn platform
    generateBridge(RHYTHM_CONFIG.BEAT_UNIT);

    // 3. Start Sync Engine
    window.gameEngine = new SyncEngine();
    
    // 4. Start Inventory Click Selection System
    const inventoryBlocks = document.querySelectorAll('.inventory-blocks .note-block');
    inventoryBlocks.forEach(block => {
        block.addEventListener('click', () => {
            const type = block.dataset.type;
            if (window.gameEngine && window.gameEngine.state === 'WALK') {
                window.gameEngine.handleInput(type);
            }
        });
    });
    
    // 5. Hook up the Start Game btn
    const startBtn = document.getElementById('btn-start');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (window.appState === 'BUILD') {
                window.appState = 'RUN';
                const startScreen = document.getElementById('start-screen');
                if (startScreen) {
                    startScreen.classList.add('hidden');
                }
                window.gameEngine.startCharacter();
            }
        });
    }

    console.log(`Bridge of Beats Initialized:
                BPM: ${RHYTHM_CONFIG.BPM} (Endless Mode)`);
});
