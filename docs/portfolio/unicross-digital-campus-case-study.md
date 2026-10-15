# UNICROSS Digital Campus — UI/UX Case Study

> **Project type:** Self-initiated concept and product improvement  
> **Role:** UI/UX design, interaction design, frontend implementation  
> **Status:** In progress  
> **Audience:** University students, lecturers, administrators, and finance staff

## Overview

UNICROSS Digital Campus is a university-platform concept intended to bring student services, teaching workflows, administration, finance, and campus communication into one coherent digital experience. The portfolio case study documents the design process and the decisions made while improving the existing application.

This is a self-initiated project, not a paid client engagement. Any sample metrics, names, and records shown in design explorations must be clearly identified as illustrative demo data.

## Problem to explore

University users often need to move between different tasks and information areas. A useful campus platform should make the next action obvious, keep navigation consistent across roles, and show important academic or operational information without overwhelming users.

These are initial design hypotheses. They should be validated through feedback from representative users rather than presented as proven research findings.

## Design goals

- Establish a consistent, accessible visual system across student, lecturer, and administrator experiences.
- Make role-specific navigation and primary actions easy to find.
- Prioritize information hierarchy, readable data tables, clear status labels, and useful empty states.
- Support mobile layouts as well as desktop dashboards.
- Make form feedback, errors, and success states understandable.
- Preserve existing application behavior while improvements are reviewed and tested.

## Visual direction

**Enterprise professional:** restrained navy and blue accents, neutral surfaces, clear typography, consistent spacing, compact but readable data visualizations, and purposeful use of color for status. Avoid relying on color alone to communicate meaning.

## Primary user journeys

### Student
1. Sign in.
2. Review academic summary and current courses.
3. Register or review courses.
4. Check published results and academic records.
5. Review fee information and payment status.
6. Find announcements and profile settings.

### Lecturer
1. Sign in.
2. Review assigned courses.
3. Open a course and manage attendance or assessments.
4. Review result-submission status.
5. Find course materials and announcements.

### Administrator
1. Sign in.
2. Review high-level operational summaries.
3. Navigate to student, staff, course, programme, admissions, and finance management.
4. Review validation and completion states before taking consequential actions.

## Design and accessibility checklist

- [ ] Consistent spacing, type scale, colors, buttons, inputs, and cards
- [ ] Visible keyboard focus and logical tab order
- [ ] Sufficient text and control contrast
- [ ] Labels and instructions for form controls
- [ ] Responsive navigation and tables on narrow screens
- [ ] Loading, error, empty, and success states
- [ ] Confirmation for destructive or high-impact actions
- [ ] No real student or financial information in portfolio screenshots
- [ ] Demo data clearly marked as illustrative

## Implementation progress

The first implementation pass focuses on consistent, role-specific dashboard hierarchy:

- **Student workspace:** refreshed KPI cards, course rows, quick-service links, and small-screen spacing while preserving the existing authenticated server-rendered data flow.
- **Lecturer workspace:** added a teaching overview derived from assigned course offerings, course cards, student counts, course units, and a clear empty state when no courses are assigned.
- **Administration workspace:** improved the hierarchy of operational summary cards and management shortcuts for narrower screens.
- **Shared visual system:** added responsive styling for dashboard navigation, cards, hover/focus-friendly affordances, and role-specific sections.

These are implementation changes, not verified usability outcomes. Automated build and browser/device checks have not yet been confirmed; do not describe the redesign as tested or deployed until those checks are completed.

## Validation plan

1. Capture the current experience and list usability issues before changing it.
2. Create low-fidelity wireframes for the most important journeys.
3. Build a small set of high-fidelity screens using the enterprise visual direction.
4. Ask a few representative users to complete realistic tasks and note where they hesitate.
5. Fix the highest-impact issues and re-test.
6. Check keyboard navigation, contrast, and mobile behavior.
7. Record actual observations and changes; do not invent usability metrics.

## Evidence to include before publishing

- Screenshots of the original and improved interface
- A user-flow diagram and selected wireframes
- The final responsive screens
- A short explanation of the rationale behind major decisions
- Real testing observations, including limitations
- A live demo link once the revised experience is deployed and verified

## Current limitations

This case study is a work in progress. Research findings, usability results, and impact metrics have not yet been established. The production application must be tested separately from any portfolio prototype, and visual changes should be reviewed before they are merged or deployed.
