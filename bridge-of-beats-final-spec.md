# Game Spec: Bridge of Beats (Final Abstract Edition)

## 1. Scene & Aesthetic
- **Environment**: Abstract Musical World.
- **Background**: Dark Indigo (#0A0E14) with horizontal glowing staff lines.
- **Grid**: Vertical light beams every 100px (1 Unit), pulsing in sync with 120 BPM.
- **Palette**: Cyan (Quarter), Magenta (Half), Gold (Whole), Neon Green (Character).

## 2. Rhythmic Constants
- **BPM**: 120
- **1 Beat**: 0.5s
- **1 Unit (U)**: 100px
- **Character Velocity**: 200px/s (Ensures 1U = 1 Beat)

## 3. Logic: The "Playhead" Mechanic
The character acts as a needle on a score.
- **Solid Platforms**: Silent zones (Rests). Character walks at constant velocity; no audio triggered.
- **Gaps**: Active zones.
    - **Snap Logic**: Dropped blocks snap their left edge to the gap's left edge.
- **Audio Trigger**: 
    - When `Character.LeadingEdge` overlaps `Block.LeftEdge`:
        - Play `Note_C4`.
        - Sustain for `Block.Duration` (0.5s, 1.0s, or 2.0s).
        - Trigger footer ring-wave particles.

## 4. Components
### Character
- States: `IDLE`, `WALK` (speed-synced), `FALL`, `WIN`.
- Collider: Trigger-based sensor at feet level.

### Bridge Segments
- **SolidGround**: Static collider.
- **Gap**: Area2D trigger that checks for `isFilled` and `durationMatch`.

### Rhythm Blocks
- **Block_Q**: 100px wide. Audio: "Ta"
- **Block_H**: 200px wide. Audio: "Ta-a"
- **Block_W**: 400px wide. Audio: "Ta-a-a-a"

## 5. Game Loop
1. **Build Phase**: Player drags blocks from the inventory into gaps.
2. **Run Phase**: 
    - Character moves from left to right.
    - Camera follows character.
    - Audio triggers in real-time based on position.
3. **Validation**:
    - If `Gap` is empty OR `Block.duration != Gap.duration`: 
        - Stop character.
        - Play bit-crushed glitch sound.
        - Shift background to red.
        - Trigger `FALL`.

## 6. Reactive Visuals
- **Beat Pulse**: `opacity = 0.3 + 0.7 * abs(sin(time * PI * 2))` on all vertical grid lines.
- **Note Hit**: Blocks glow with an outer neon bloom when the character is on top of them.
