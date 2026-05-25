# The Soy Paradox - Scrollytelling Experience

## Implementation Complete ✓

Your scrollytelling experience has been fully implemented with all 12 frames as specified. Here's what was built:

### Project Structure
- **index.html** - Main HTML with scrollytelling container and sticky visualization
- **src/main.ts** - Complete TypeScript implementation with all 12 frames and visualizations
- **src/style.css** - Comprehensive styling for dark theme, animations, and responsive layout
- **src/data.ts** - CSV data loader with proper type conversion

### Features Implemented

#### ACT 1 - BELIEF
- **Frame 1 (Hook)**: Dark fullscreen with centered typography and scroll cue
- **Frame 2 (Assumption)**: Minimal icons (tofu, soy milk, edamame) with emotional narrative

#### ACT 2 - REVEAL
- **Frame 3 (Setup)**: Empty chart with axes, timeline (1961-2023), and legend
- **Frame 4 (Human Food)**: Single area band showing human consumption
- **Frame 5 (Animal Feed)**: Stacked area adding animal feed layer
- **Frame 6 (WOW Frame)**: Industrial explosion with animated counter showing 72% statistic

#### ACT 3 - REFLECTION
- **Frame 7 (Pause)**: Chart fades to background with interpretive text

#### ACT 4 - GLOBAL VIEW
- **Frame 8 (Treemap Intro)**: Area chart morphs to treemap with color encoding
- **Frame 9 (Pattern Emerges)**: Treemap fully visible with USA, Brazil, China, Austria highlighted

#### ACT 5 - PARTICIPATION
- **Frame 10 (Guided Comparison)**: Country selector dropdowns with side-by-side comparison
- **Frame 11 (Analysis)**: Proportional bars showing breakdown by category

#### ACT 6 - ENDING
- **Frame 12 (Outro)**: Dark background returning, closing statement, credits, and restart button

### Technologies Used
- **D3.js v7** - Modern D3 with `.join()` pattern (no enter/exit)
- **Scrollama v3** - Scroll-triggered animations
- **TypeScript** - Full type safety
- **Vite** - Fast build tool

### Key Design Elements

**Color Palette:**
- Human Food: #a78bfa (purple)
- Animal Feed: #fb923c (orange)
- Industrial/Processed: #ef4444 (red)
- Dark Background: #1a1a1a

**Typography & Animation:**
- Smooth fade-in transitions between frames
- Animated counter for the 72% statistic
- Responsive design for mobile and desktop
- Minimal but impactful design language

### Data Features
- Global soy consumption data from 1961-2023
- Country-level breakdown with latest year data
- Proper null/empty value handling
- Treemap sizing by total consumption
- Color encoding by industrial percentage

### Development Commands
```bash
npm install        # Install dependencies
npm start          # Start dev server (localhost:5173)
npm run build      # Production build
npm run preview    # Preview production build
```

### Notes
- The visualization uses a sticky container pattern where the chart stays fixed while text scrolls in front
- All modern D3 practices applied (join, proper data binding)
- Fully responsive design that adapts to mobile screens
- Smooth scroll interactions powered by Scrollama

The experience is ready to deploy! All frames follow your exact specifications with proper pacing, typography hierarchy, and visual progression through the narrative.

