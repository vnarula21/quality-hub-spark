# Coach IQ

Build a modern SaaS web application called "Quality Intelligence Platform (QIP)" for healthcare coaching organizations.

The platform is designed to become the single source of truth for Coach Quality, Performance, Recognition, and Audit Management.

PHASE 1 OBJECTIVE

Focus only on:

Authentication

User Management

Role Based Access Control

Dashboard Structure

Database Architecture

Navigation Structure

Performance Management Framework

Do NOT build AI auditing yet.

Do NOT build transcription yet.

Do NOT integrate external systems yet.

The objective is to create a scalable enterprise foundation that future modules can be added onto.

USER ROLES

Super Admin

Full platform control.

Permissions:

Create Users

Edit Users

Deactivate Users

Delete Users

Create Roles

Manage Permissions

Manage Platform Settings

Manage Processes

View All Reports

Access All Dashboards

Admin (Quality Manager)

Permissions:

View All Coaches

View All Experts

Review Audits

Review Challenges

View Reports

View Dashboards

Modify Audit Scores

Modify Audit Feedback

Cannot:

Delete Users

Change Platform Settings

Publish Audits

Expert (Auditor)

Permissions:

View Assigned Audits

Upload Audit Material

Review Audits

Publish Final Audits

View Audit History

View Performance Reports

Coach

Permissions:

View Personal Dashboard

View Performance Metrics

View Ratings

View Testimonials

View Success Stories

View Audit Results

Accept Audits

Raise Objections

AUTHENTICATION

Create secure login system.

Features:

Login

Logout

Forgot Password

Change Password

User Profile

Role Based Access

DATABASE DESIGN

Design scalable database architecture.

Create entities for:

Users

Roles

Permissions

Teams

Coaches

Experts

Processes

Audit Frameworks

Audits

Audit Scores

Audit Feedback

Challenges

Coach Objections

Ratings

Testimonials

Success Stories

RAG Reports

Achievements

Notifications

Audit Status History

Reports

All tables should have proper relationships and audit trails.

SIDEBAR NAVIGATION

Create role-based sidebar navigation.

Coach Navigation:

Dashboard

My Performance

My Audits

My Ratings

My Testimonials

My Success Stories

Achievements

Notifications

Profile

Expert Navigation:

Dashboard

Assigned Audits

Audit History

Reports

Notifications

Profile

Admin Navigation:

Dashboard

Audits

Challenges

Coaches

Experts

Reports

Analytics

Notifications

Profile

Super Admin Navigation:

Dashboard

Users

Roles

Permissions

Processes

Frameworks

Reports

System Settings

Profile

COACH DASHBOARD HOMEPAGE

The Coach Dashboard should be designed as a Performance Hub.

Display summary cards:

Current Quality Score

Current Rating

Current RAG Status

Monthly Audit Score

Testimonials Received

Success Stories Achieved

Current Rank

Coach Performance Index (CPI)

Display charts:

Monthly Performance Trend

Quality Score Trend

Rating Trend

RAG Trend

Display leaderboards:

Top Coaches

Most Improved Coaches

Top Rated Coaches

Display achievements and badges.

The homepage should provide a complete snapshot of coach performance.

COACH PERFORMANCE MODULE

Create dedicated tabs for:

My Performance

Monthly KPI trends

Performance charts

Performance history

My Ratings

Rating history

Monthly averages

My Testimonials

All testimonials

Filter by month

My Success Stories

Transformation stories

Health outcomes

Member achievements

Achievements

Badges

Milestones

Recognition history

ADMIN DASHBOARD

Create operational dashboard framework.

Display:

Total Coaches

Total Experts

Average Quality Score

Average Rating

Average RAG

Top Performing Coaches

Bottom Performing Coaches

Coach Distribution by RAG

Pending Audits

Pending Challenges

Pending Coach Actions

The dashboard should be built using modern analytics cards and charts.

UI REQUIREMENTS

Modern enterprise SaaS design.

Clean healthcare-tech appearance.

Responsive design.

Light and dark mode support.

Sidebar navigation.

Dashboard-first experience.

Role-based homepages.

Scalable architecture.

Focus on performance management and governance.

IMPORTANT

For Phase 1 build only:

Authentication

User Management

Role Permissions

Database Architecture

Navigation

Dashboard Framework

Performance Management Framework

Do not build AI auditing, transcription, scoring engines, or external integrations yet.

Build the platform foundation so future audit and AI modules can be added without redesigning the architecture.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5e551fb8-4a9b-46eb-b0e9-66c3636c6e98).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
