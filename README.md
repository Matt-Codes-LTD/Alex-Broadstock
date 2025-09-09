# Alex-Broadstock Frontend

This repository powers the portfolio frontend using **GSAP**, **Barba.js**, **Lenis**, and modular ES modules.  
All interactive sections are broken down into small, single-responsibility modules for maintainability and scalability.  

---

## 📂 Project Structure
```text
assets/
├── globals/
│   └── cursor/
│       ├── index.js         # Orchestrator
│       ├── follow-loop.js   # GSAP/RAF cursor follower
│       └── geometry.js      # Overlay bounds (resize/scroll)
│
└── v1/
    ├── core/
    │   ├── barba-bootstrap.js # Barba init + transitions
    │   └── page-scripts.js    # Wires global + section init
    │
    └── sections/
        ├── home-hero/
        │   ├── index.js          # Orchestrator
        │   ├── video-manager.js  # Video pool, preload, warm
        │   ├── state.js          # Active link + faded states
        │   ├── ghost-layer.js    # FLIP ghost layer
        │   └── category-filter.js# Category filter + FLIP anims
        │
        ├── project-player/
        │   ├── index.js         # Orchestrator
        │   ├── overlays.js      # Pause overlay + center button
        │   ├── state.js         # UI state (play/mute/idle/fs)
        │   ├── controls.js      # User input → video actions
        │   ├── timeline-loop.js # RAF sync for timeline
        │   ├── preload.js       # First-frame warmup
        │   └── sync.js          # Video events → UI sync
        │
        └── split-chars/
            ├── index.js       # Orchestrator
            ├── splitter.js    # Split text into spans
            ├── list-init.js   # Init data-animate-chars-list
            ├── pulse.js       # Touch “pulse” effect
            └── observer.js    # MutationObserver for re-scan
