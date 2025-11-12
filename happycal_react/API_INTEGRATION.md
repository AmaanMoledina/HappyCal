# API Integration Guide

## Overview

The React app now uses the **Crab Fit API** (`https://api.crab.fit`) to create and manage scheduling events. This allows the app to generate real, working shareable links that persist on the backend.

## How It Works

### 1. Link Generation Flow

**Crab Fit (Original):**
1. User fills out the form with event details (name, dates, time range)
2. Frontend generates time slots in `HHmm-DDMMYYYY` format
3. Calls `POST /event` API endpoint with event data
4. Backend generates a unique event ID (format: `{encoded-name}-{random-number}`)
5. Returns `EventResponse` with the `id` field
6. Frontend constructs link: `https://happycal.app/${event.id}`

**React App (Now):**
- Same flow! The React app now follows the exact same pattern:
  1. User creates meeting in `CreateMeetingScreen`
  2. `generateTimeSlots()` creates time slots in correct format
  3. `createEvent()` API call creates the event
  4. Uses returned `event.id` to generate link: `https://happycal.app/${event.id}`

### 2. API Configuration

**Location:** `src/config/api.ts`

- **Base URL:** `https://api.crab.fit` (default)
- **Override:** Set `VITE_API_URL` environment variable to use a different API
- **CORS:** The API has CORS configured and should work from any origin

### 3. Event ID Generation (Backend)

The backend generates event IDs using this algorithm:
1. Encode event name using punycode
2. Convert to lowercase, remove special characters
3. Replace spaces with dashes
4. Append random 6-digit number (100000-999999)
5. Format: `{encoded-name}-{random-number}`

Example: "Midterm Study Session" → `midterm-study-session-123456`

### 4. Time Slot Format

Time slots must be in one of two formats:
- **Specific dates:** `HHmm-DDMMYYYY` (e.g., `0900-15112025` for Nov 15, 2025 at 9:00 AM)
- **Weekdays:** `HHmm-d` (e.g., `0900-1` for Monday at 9:00 AM)

All times are stored in **UTC** on the backend.

### 5. API Endpoints Used

- `POST /event` - Create a new event
- `GET /event/{event_id}` - Get event details
- `GET /event/{event_id}/people` - Get all people's availability
- `PATCH /event/{event_id}/people/{person_name}` - Update person's availability

## Environment Variables

Create a `.env` file in `happycal_react/` to override the API URL:

```env
VITE_API_URL=https://api.crab.fit
```

Or use a local development API:
```env
VITE_API_URL=http://localhost:3000
```

## Testing

1. Start the React app: `npm run dev`
2. Create a meeting with dates and time range
3. Click "Generate Scheduling Link"
4. The app will:
   - Generate time slots
   - Call the API to create the event
   - Display the real shareable link
5. Copy the link and test it in a browser

## Error Handling

The app handles API errors gracefully:
- Shows error message if event creation fails
- Displays loading state during API call
- Validates time slots before sending to API

## Next Steps

To fully integrate:
1. ✅ API client created
2. ✅ Event creation integrated
3. ⏳ Fetch event data when viewing availability grid
4. ⏳ Update person availability when user selects times
5. ⏳ Add authentication for updating availability

