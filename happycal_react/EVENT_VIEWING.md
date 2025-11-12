# Event Viewing & Real-Time Updates

## Summary

The React app now supports viewing events by ID and seeing real-time availability updates!

## How It Works

### 1. **Link Generation**
- When you create an event, the app generates a link like: `http://localhost:3000/{event-id}`
- The link uses the event ID returned from the API
- The link works in the React app (not just the Next.js frontend)

### 2. **Event Viewing**
- Navigate to `/{event-id}` in the React app
- The app fetches event data from the API
- Displays the availability grid with real data

### 3. **Real-Time Updates**
- The app polls the API every 5 seconds for updates
- When people add/update their availability, you'll see it reflected
- The heatmap updates automatically showing who's available when

### 4. **What You'll See**
- ✅ Event name and details
- ✅ Availability grid with correct dates and times
- ✅ Real people's availability (not mock data)
- ✅ Heatmap showing how many people are available at each time
- ✅ Updates automatically as people respond

## Testing

1. **Create an event:**
   - Go to Create Meeting screen
   - Fill in details and generate link
   - Click "View Availability Grid" - it will navigate to the event page

2. **View an event:**
   - Copy the generated link
   - Open it in a new tab/window
   - You'll see the event with real data from the API

3. **See updates:**
   - Open the same event in multiple tabs
   - In one tab, mark your availability (when that feature is added)
   - In the other tab, you'll see the update within 5 seconds

## Current Status

✅ **Working:**
- Event creation via API
- Link generation with real event IDs
- Event viewing by ID
- Fetching event data from API
- Fetching people's availability from API
- Real-time polling (every 5 seconds)
- Displaying real availability data

⏳ **Still Needed:**
- User login/authentication
- Ability to mark your own availability
- Saving availability to API
- Dashboard showing list of created events

## API Integration

The app uses these endpoints:
- `POST /event` - Create event
- `GET /event/{id}` - Get event details
- `GET /event/{id}/people` - Get all people's availability
- `PATCH /event/{id}/people/{name}` - Update person's availability (not yet integrated)

## Notes

- The link format is: `{your-domain}/{event-id}`
- Events are stored in the Crab Fit API backend
- Multiple people can view the same event simultaneously
- Updates are polled every 5 seconds (not true WebSocket real-time, but close enough)

