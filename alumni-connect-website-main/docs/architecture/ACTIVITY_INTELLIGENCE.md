# Activity Hub & Next Best Action Intelligence Engine

## 1. Architectural Philosophy

Activity Hub serves as the **behavioral intelligence engine** of Alumnex Connect. Rather than acting as a passive log of statistics, it answers the primary question:

> **"WHAT SHOULD I DO TODAY TO ACCELERATE MY CAREER & MAINTAIN MOMENTUM?"**

---

## 2. End-to-End Processing Pipeline

```mermaid
flowchart TD
    subgraph DataIngestion ["1. Multi-Platform Ingestion"]
        GH["GitHub API<br/>(Commits, PRs, Reviews)"]
        LC["LeetCode API<br/>(Submissions, Solved Badges)"]
        CF["Codeforces / HackerRank<br/>(Contests & Solves)"]
        MAN["In-App Platform Events<br/>(Mentorship, Forum, Projects)"]
    end

    subgraph DetectionLayer ["2. Verification & Canonicalization"]
        Detect["Activity Detector<br/>Normalize date to user timezone (YYYY-MM-DD)"]
        TrustClass["Trust Classification<br/>API_VERIFIED | AUTO_DETECTED | MANUAL"]
    end

    subgraph Persistence ["3. Authoritative Ledger"]
        Ledger[("ActivityRecord Collection<br/>Unique Compound Index per user/goal/date")]
    end

    subgraph EvaluationEngine ["4. Goal & Streak Engines"]
        GoalEval["Goal Verifier<br/>Target vs Current Progress"]
        StreakCalc["Streak Calculator<br/>Active, Broken, At-Risk, Grace Periods"]
        IndexCalc["Consistency Index Engine<br/>Active Days (50%) + Goals (30%) + Streaks (20%)"]
    end

    subgraph IntelligentSurfaces ["5. Intelligent Presentation"]
        NBA["Next Best Action Engine<br/>Deterministic Rule-Based Personalization"]
        DashboardView["Dashboard Today's Plan & Momentum"]
        AnalyticsView["Activity Analytics & Heatmap"]
    end

    GH --> Detect
    LC --> Detect
    CF --> Detect
    MAN --> Detect

    Detect --> TrustClass
    TrustClass --> Ledger
    Ledger --> GoalEval
    Ledger --> StreakCalc
    Ledger --> IndexCalc

    GoalEval --> NBA
    StreakCalc --> NBA
    NBA --> DashboardView
    StreakCalc --> DashboardView
    IndexCalc --> AnalyticsView
```

---

## 3. Trust Classification Matrix

To protect ecosystem integrity and prevent artificial gamification, activities are strictly partitioned:

| Classification | Source | Verification Method | Visual Indicator |
| :--- | :--- | :--- | :--- |
| **API_VERIFIED** | GitHub, LeetCode, Codeforces | Direct OAuth / REST / GraphQL polling with cryptographic commit SHA or submission ID | Emerald Badge + ShieldCheck Icon |
| **AUTO_DETECTED** | Alumnex Internal Actions | System events (e.g. mentor session completed, forum post reviewed, PR merged) | Indigo Badge + Zap Icon |
| **MANUAL** | User self-reported | User manual submission with optional proof link | Neutral Gray Badge + Clock Icon |

*Rule: Manually entered tasks can NEVER receive the API_VERIFIED tag.*

---

## 4. Next Best Action (NBA) Engine Rules

The Next Best Action engine evaluates real user signals in strict priority order:

```mermaid
graph TD
    Start["Evaluate User Context"] --> CheckStreak{"Streak At Risk?"}
    CheckStreak -- Yes: Streak > 0 & No Today Activity --> Act1["Priority 100: Protect Streak<br/>'Log or sync activity before midnight'"]
    CheckStreak -- No --> CheckGoals{"Pending Today's Goals?"}
    CheckGoals -- Yes: Goals Incomplete --> Act2["Priority 85: Complete Daily Target<br/>'Complete 1 remaining coding/learning goal'"]
    CheckGoals -- No --> CheckReviews{"Pending Reviews / Invites?"}
    CheckReviews -- Yes: Pending Network Items --> Act3["Priority 75: Review Network Requests<br/>'Respond to mentor or connection inquiries'"]
    CheckReviews -- No --> CheckProfile{"Incomplete Profile?"}
    CheckProfile -- Yes: Missing Bio or Skills --> Act4["Priority 60: Profile Strength<br/>'Add skills to optimize mentor pairing'"]
    CheckProfile -- No --> CheckRole{"Student & No Career Activity?"}
    CheckRole -- Yes --> Act5["Priority 50: Career Momentum<br/>'Explore vetted jobs & alumni mentors'"]
    CheckRole -- No --> ActAll["Priority 20: Maintain Momentum<br/>'All caught up! Continue daily momentum'"]
```

---

## 5. Responsive Engineering Patterns

In accordance with Alumnex engineering standards:
1. **Container Constraint**: `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0`
2. **Adaptive Personal Records**:
   - `< 640px` (Mobile): `grid-cols-1`
   - `640px - 1023px` (Tablet): `grid-cols-2`
   - `1024px - 1535px` (Laptop / Intermediate): `grid-cols-3` (providing >260px minimum card width)
   - `>= 1536px` (Wide Desktop): `grid-cols-5`
3. **Internal Visualization Scrolling**:
   - Full 52-week calendars use `overflow-x-auto touch-pan-x custom-scrollbar` scoped strictly to the chart viewport.
   - The document body is NEVER clipped with `overflow-x: hidden`.
