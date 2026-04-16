# G8+ Implementation Walkthrough: Automated Risk & Financial Alerts

We have added a proactive monitoring layer that automatically identifies and notifies users of portfolio risks and financial deviations.

## Core Components

### 1. AlertService: The Threshold Guardian
- **Location**: `server/services/AlertService.ts`
- **Logic**:
  - **Readiness Drop**: Triggers an alert if an initiative's readiness score falls below 60%.
  - **Budget Blowout**: Triggers an alert if an initiative's spend exceeds 90% of its allocated budget.
- **Delivery**: Dispatches messages via the `NotificationService` with high-priority metadata.

### 2. Live Trigger Integration
- Integrated `AlertService.checkThresholds()` directly into the `InitiativeService.updateInitiative` workflow.
- Every state change or artifact update triggers an immediate re-evaluation of thresholds.

### 3. Integrated Notification Center
- **Location**: `components/ui/NotificationBell.tsx`
- **Premium Features**:
  - **Semantic Iconography**: Use of `Lucide` icons (TrendingDown, DollarSign, Brain) to distinguish alerts at a glance.
  - **Visual Hierarchy**: High-priority alerts (Risk/Financial) are highlighted with a distinct red side-border and specific styling.
  - **Contextual Links**: Notifications for specific initiatives now include a "View Initiative" badge for rapid navigation.
  - **Enhanced UX**: Smooth animations (`slide-in`), glassmorphism effects, and "All Read" bulk actions.

## Files Impacted
- [AlertService.ts](file:///c:/Users/zakaryaboudjelel/CogniSys%20BA/CogniSys-BA/server/services/AlertService.ts): New monitoring service.
- [NotificationService.ts](file:///c:/Users/zakaryaboudjelel/CogniSys%20BA/CogniSys-BA/server/services/NotificationService.ts): New notification types.
- [InitiativeService.ts](file:///c:/Users/zakaryaboudjelel/CogniSys%20BA/CogniSys-BA/server/services/InitiativeService.ts): Hooked monitoring into update loop.
- [NotificationBell.tsx](file:///c:/Users/zakaryaboudjelel/CogniSys%20BA/CogniSys-BA/components/ui/NotificationBell.tsx): UI overhaul.

## Future Path
- **Custom Thresholds**: Allow users to define their own % thresholds per initiative or project.
- **External Webhooks**: Push these high-priority alerts to Slack or Teams via `WebhookService`.
