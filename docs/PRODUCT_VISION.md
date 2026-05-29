# KickSpot — Product Vision

## App Name: KickSpot
**Folder name: `kickspot`**
**Tagline:** *"Find your game. Play your way."*

---

## What Is It?

A Progressive Web App (PWA) for managing footvolley sessions — the sand-court
sport mixing football and volleyball (2v2 over a net, feet only, volleyball-style
set scoring). Hosted on Firebase Hosting. Installs on any phone from the browser
— no App Store needed. Built with React + Firebase. Powered by Claude AI for
smart features.

---

## Who Uses It?

| Role | Access | What They Can Do |
|---|---|---|
| **Player** | No PIN needed | View everything, add themselves, mark availability, form teams, add match results |
| **Admin** | 4-digit PIN | Everything a player can + edit, delete, manage admins, share location |

---

## Permission Table

| Action | Player | Admin |
|---|---|---|
| View standings & reports | ✅ | ✅ |
| View teams & matches | ✅ | ✅ |
| Add themselves as player | ✅ | ✅ |
| Mark availability | ✅ | ✅ |
| Form a team | ✅ | ✅ |
| Add a match result | ✅ | ✅ |
| Edit / delete a player | ❌ | ✅ |
| Edit / delete a team | ❌ | ✅ |
| Edit / delete a match | ❌ | ✅ |
| Manage admins | ❌ | ✅ |
| Share venue location | ❌ | ✅ |

---

## AI Features (Claude API)

| Feature | Trigger | What Claude Does |
|---|---|---|
| **Team name generator** | Player forming a team | Suggests 3 creative team names based on player names |
| **Balanced team suggester** | Admin forming teams | Suggests balanced team splits based on player win rates |
| **Match commentary** | After match score saved | Generates a short fun summary of the match result |

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| PWA | vite-plugin-pwa |
| Database | Firebase Firestore |
| Hosting | Firebase Hosting |
| Styling | Custom CSS |
| AI | Claude API (claude-opus-4-8) |
| Admin Auth | 4-digit PIN |

---

## How It Gets Installed

1. Admin runs `firebase deploy`
2. Players open the URL in Chrome (Android) or Safari (iOS)
3. Browser prompts "Add to Home Screen"
4. App installs — full screen, no browser bar

---

*KickSpot v1 — React PWA + Claude AI*
