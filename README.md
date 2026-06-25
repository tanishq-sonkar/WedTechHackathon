````markdown
# WedWare — Wedding RSVP Management Platform

WedWare is a full-stack wedding RSVP management platform built for the WedTech Hackathon problem statement P2. It helps wedding planners and families digitize the invitation and RSVP workflow by providing personalized RSVP links, event-wise response tracking, guest management, and planner-facing analytics.

Live Website: https://wed-tech-hackathon.vercel.app/

---

## Team

**Team Name:** WedWare  
**Team Members:** Tanishq Sonkar, Shubham Kumar

---

## Overview

Managing wedding RSVPs manually through spreadsheets, phone calls, and messaging apps can become difficult for large guest lists. WedWare solves this by providing a centralized platform where planners can:

- Create a wedding workspace
- Add wedding events and ceremonies
- Manage guests and guest groups
- Generate personalized RSVP links
- Collect guest responses event-wise
- Track attendance, dietary preferences, plus-ones, and children count
- View RSVP analytics from a planner dashboard

The platform includes both a **planner portal** and a **guest-facing RSVP page**.

---

## Features

### Planner Features

- Secure planner signup and login
- Wedding onboarding flow
- Add wedding details such as couple names, city, wedding date, cover message, and RSVP deadline
- Create and manage wedding events/ceremonies
- Add guests with family side, contact details, group labels, and plus-one limits
- Generate unique RSVP links for every guest
- Track RSVP responses from a dashboard
- View event-wise attendance and dietary preference summaries

### Guest Features

- Open a personalized RSVP invitation link
- View a festive digital wedding invite
- Respond separately for each wedding event
- Select attendance status:
  - Attending
  - Not attending
  - Maybe
- Add dietary preference:
  - Veg
  - Non-veg
  - Jain
  - Vegan
- Add plus-ones and children count
- Send a message/blessing for the couple
- Update RSVP using the same link

### API Features

- REST API endpoint for RSVP headcount integration
- Event-wise headcount summary
- Dietary preference count
- Useful for possible CRM, catering, or planner integrations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend/API | Next.js Route Handlers |
| Authentication | Supabase Auth |
| Database | Supabase PostgreSQL |
| Email Support | Nodemailer |
| Deployment | Vercel |
| Version Control | Git and GitHub |

---

## Architecture

The application follows a full-stack web architecture:

```text
User Browser
    |
    v
Next.js Frontend
    |
    v
Next.js API Routes / Middleware
    |
    v
Supabase Auth + PostgreSQL Database
    |
    v
External Services: Nodemailer, Vercel
````

### Main Components

* **Frontend:** Built with Next.js App Router and React components.
* **Authentication:** Supabase Auth handles planner signup, login, and sessions.
* **Database:** Supabase PostgreSQL stores weddings, events, guests, guest-event mappings, and RSVP responses.
* **Middleware:** Protects dashboard routes from unauthenticated access.
* **API Layer:** Next.js route handlers provide endpoints for RSVP headcount and email sending.
* **Deployment:** The app is deployed on Vercel and connected to GitHub for continuous deployment.

---

## Database Schema

The core tables used in the project are:

| Table          | Purpose                                      |
| -------------- | -------------------------------------------- |
| `weddings`     | Stores wedding-level details                 |
| `events`       | Stores ceremonies/events linked to a wedding |
| `guests`       | Stores guest information and invite tokens   |
| `guest_events` | Maps guests to specific wedding events       |
| `rsvps`        | Stores guest RSVP responses event-wise       |

### Relationship Summary

* One wedding can have multiple events.
* One wedding can have multiple guests.
* One guest can be invited to multiple events.
* One guest can submit one RSVP per event.
* RSVP records are linked to guests, events, and weddings.

---

## Project Structure

```text
app/
  api/
    rsvp-headcount/
      route.ts
    send-emails/
      route.ts

  auth/
    login/
      page.tsx
    signup/
      page.tsx

  dashboard/
    guests/
      page.tsx
    rsvps/
      page.tsx
    send-invites/
      page.tsx
    settings/
      page.tsx
    layout.tsx
    page.tsx

  onboarding/
    page.tsx

  rsvp/
    [slug]/
      page.tsx

  globals.css
  layout.tsx
  page.tsx

lib/
  supabase.ts
  supabase-server.ts

middleware.ts
SUPABASE_SETUP.sql
package.json
```

---

## Getting Started Locally

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* Git
* Supabase account

---

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/tanishq-sonkar/WedTechHackathon.git
cd WedTechHackathon
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a Supabase Project

Create a new project on Supabase.

Then open the Supabase SQL Editor and run the contents of:

```text
SUPABASE_SETUP.sql
```

This will create the required database tables.

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory.

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Do not commit `.env.local` to GitHub.

### 5. Run the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Production Deployment

The project is deployed on Vercel.

### Deployment Steps

1. Push the project to GitHub.
2. Import the GitHub repository into Vercel.
3. Add the following environment variables in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_publishable_key
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.vercel.app
```

4. Set the Supabase Auth Site URL and Redirect URL to your Vercel deployment URL.
5. Redeploy the project.

Current live deployment:

```text
https://wed-tech-hackathon.vercel.app/
```

---

## API Endpoint

### RSVP Headcount API

```http
GET /api/rsvp-headcount?wedding_id=YOUR_WEDDING_ID
```

Optional event-specific query:

```http
GET /api/rsvp-headcount?wedding_id=YOUR_WEDDING_ID&event_id=YOUR_EVENT_ID
```

### Example Response

```json
{
  "wedding_id": "example-wedding-id",
  "generated_at": "2026-06-26T00:00:00.000Z",
  "events": [
    {
      "event_id": "event-id",
      "event_name": "Wedding Ceremony",
      "event_date": "2026-07-01T18:00:00.000Z",
      "venue_name": "Main Venue",
      "attending": 20,
      "not_attending": 3,
      "maybe": 5,
      "total_heads": 32,
      "dietary": {
        "veg": 15,
        "non_veg": 10,
        "jain": 4,
        "vegan": 3
      }
    }
  ]
}
```

---

## Important Notes

* A wedding must have at least one event/ceremony for the RSVP page to show event cards.
* RSVP responses are stored event-wise.
* The current project is an MVP/hackathon prototype.
* Row Level Security policies should be hardened before using this as a production multi-tenant application.
* For demo purposes, email sending uses Nodemailer. For production, a dedicated transactional email provider or OAuth-based email flow is recommended.

---

## Key Learnings

During the development and deployment of this project, we worked on:

* Full-stack development with Next.js and Supabase
* Authentication and protected routes
* Relational database schema design
* Dynamic guest invitation links
* Production deployment on Vercel
* Debugging production TypeScript build errors
* Handling real-world RSVP workflows and edge cases

---

## Future Scope

Possible future improvements include:

* WhatsApp invitation integration
* Bulk CSV guest import/export
* QR-based check-in at wedding venues
* Real-time dashboard updates
* Advanced analytics and charts
* Role-based planner access
* Multi-wedding support
* Better email delivery using transactional email services
* Row Level Security policies for production-grade data protection

---

## Authors

Built by **Team WedWare**

* Tanishq Sonkar
* Shubham Kumar

---

## License

This project was developed as part of a hackathon prototype. Licensing can be added based on future use.

```
```
