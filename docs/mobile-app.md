# Mobile App

The Ovo mobile app is built with **Expo SDK 54** and **React Native**, using **react-native-paper v5** for Material Design 3 components and **Material You** dynamic theming.

## Screens

| Screen | Route | Auth | Description |
|--------|-------|:----:|-------------|
| Login | `/(auth)/login` | No | Email + password sign-in with client-side Zod validation. Also has a "Sign in with Event Horizon" button for Community SSO. |
| Register | `/(auth)/register` | No | Name + email + password registration with password requirements hint |
| Home | `/(app)/home` | Yes | Dashboard with AI daily summary card, progress card, task list, status filters, search, infinite scroll |
| Task | `/(app)/task` | Yes | Dual-purpose create/edit task form (edit mode when `?id=` param is present) |
| Profile | `/(app)/profile` | Yes | User info, notification settings (enable/disable + time picker), API keys, member since date, app version, sign-out button |

### Screenshots

| Dashboard | Update Task |
|:---------:|:-----------:|
| ![Dashboard](images/dashboard.png) | ![Update Task](images/update_task.png) |

> **Platform note:** Ovo mobile is **Android-first**. All CI/CD pipelines, signing configurations, and Obtainium instructions target Android. iOS is theoretically possible via Expo's iOS support, but has not been tested. There are no iOS-specific build scripts or distribution workflows.

## Navigation Structure

Ovo uses [expo-router v6](https://docs.expo.dev/router/) for file-based routing. Routes are organized into **route groups**:

```
app/
├── _layout.tsx           # Root layout: providers, theme, auth initialization
├── index.tsx             # Entry: redirects to /(app)/home or /(auth)/login
├── (auth)/               # Unauthenticated route group
│   ├── _layout.tsx       # Guard: redirects TO /(app)/home if already authenticated
│   ├── login.tsx
│   └── register.tsx
└── (app)/                # Authenticated route group
    ├── _layout.tsx       # Guard: redirects TO /(auth)/login if not authenticated
    ├── home.tsx
    ├── task.tsx
    └── profile.tsx
```

### Three-Layer Auth Protection

1. **Entry redirect** (`app/index.tsx`) — checks `isAuthenticated` from the auth store and redirects to the appropriate group on app launch.

2. **Auth group guard** (`app/(auth)/_layout.tsx`) — if a user is already authenticated and somehow navigates to login/register, they get redirected to `/(app)/home`.

3. **App group guard** (`app/(app)/_layout.tsx`) — if a user is not authenticated and tries to access a protected route, they get redirected to `/(auth)/login`.

### Animation

- Root stack: `slide_from_right`
- Auth group: `slide_from_bottom`
- App group: `slide_from_right`

## Material You Theming

### How It Works

1. **`@pchmn/expo-material3-theme`** calls the native `useMaterial3Theme()` hook to extract the device's wallpaper-derived color palette on Android 12+.

2. **Seed color fallback**: On iOS or older Android, the fallback seed color `#6750A4` (Material purple) is used to generate a static palette.

3. **`createAppTheme()`** in `theme/index.ts` merges the dynamic (or fallback) colors on top of Paper's `MD3LightTheme` or `MD3DarkTheme` depending on the system color scheme.

4. **Expressive roundness**: A global `roundness: 28` is applied for the Material 3 Expressive style (larger corner radii on cards, buttons, inputs, etc.).

5. **System fonts**: All type-scale levels use the platform system font (`fontFamily: "System"`).

### Theme Configuration

```typescript
// theme/index.ts
export const SEED_COLOR = "#6750A4";  // Material purple fallback

export function createAppTheme(dynamicColors?, isDark = false): MD3Theme {
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...baseTheme,
    roundness: 28,
    colors: dynamicColors
      ? { ...baseTheme.colors, ...(isDark ? dynamicColors.dark : dynamicColors.light) }
      : baseTheme.colors,
    fonts: configureFonts({ config: fontConfig }),
  };
}
```

### Dark Mode

The app automatically follows the device's system theme via `useColorScheme()`. No manual toggle is needed — it respects the OS-level dark mode setting.

## Zustand Stores

### AuthStore (`stores/authStore.ts`)

| State | Type | Description |
|-------|------|-------------|
| `user` | `User \| null` | Current user object |
| `isAuthenticated` | `boolean` | Whether a valid session exists |
| `isLoading` | `boolean` | Auth operation in progress |
| `isInitialized` | `boolean` | App has checked for existing session |
| `error` | `string \| null` | Last auth error message |

| Action | Description |
|--------|-------------|
| `initialize()` | Checks `expo-secure-store` for an existing access token, validates it by calling `GET /user/profile`, sets user if valid |
| `login(input)` | Calls `POST /auth/login`, stores both tokens in secure store, sets user |
| `register(input)` | Calls `POST /auth/register`, stores both tokens in secure store, sets user |
| `logout()` | Calls `POST /auth/logout` with the refresh token, clears secure store, resets state |
| `eventHorizonLogin()` | Opens the EH OAuth flow via `expo-web-browser`, reads tokens from the `ovo://auth/callback` deep link, stores them |
| `clearError()` | Clears the error message |

### TaskStore (`stores/taskStore.ts`)

| State | Type | Description |
|-------|------|-------------|
| `tasks` | `Task[]` | Currently loaded tasks |
| `stats` | `TaskStats \| null` | Completion statistics |
| `isLoading` | `boolean` | Fetching in progress |
| `isRefreshing` | `boolean` | Pull-to-refresh active |
| `error` | `string \| null` | Last error message |
| `statusFilter` | `TaskStatus?` | Active status filter |
| `priorityFilter` | `TaskPriority?` | Active priority filter |
| `searchQuery` | `string` | Current search text |
| `sortBy` | `string` | Sort field (`createdAt`, `dueDate`, `priority`, `title`) |
| `sortOrder` | `"asc" \| "desc"` | Sort direction |
| `page` | `number` | Current page number |
| `totalPages` | `number` | Total available pages |
| `total` | `number` | Total task count |

| Action | Description |
|--------|-------------|
| `fetchTasks(reset?)` | Fetches tasks with current filters; `reset=true` reloads from page 1 |
| `fetchStats()` | Fetches task statistics (silently fails — non-critical) |
| `createTask(input)` | Creates a task via API, prepends to local list, refreshes stats in background |
| `updateTask(id, input)` | Updates a task via API, replaces in local list, refreshes stats |
| `deleteTask(id)` | Deletes a task via API, removes from local list, refreshes stats |
| `setStatusFilter(status)` | Sets filter, resets to page 1, re-fetches |
| `setPriorityFilter(priority)` | Sets filter, resets to page 1, re-fetches |
| `setSearchQuery(query)` | Sets search, resets to page 1, re-fetches |
| `setSortBy(field)` | Sets sort field, resets to page 1, re-fetches |
| `setSortOrder(order)` | Sets sort direction, resets to page 1, re-fetches |
| `loadMore()` | Loads the next page (infinite scroll); no-op if already at last page |
| `refresh()` | Pull-to-refresh: resets to page 1, fetches tasks + stats in parallel |
| `clearError()` | Clears the error |
| `reset()` | Resets all state to defaults (used on logout) |

## API Service Layer

### Axios Instance (`services/api.ts`)

A shared Axios instance configured with:

- **Base URL**: `${EXPO_PUBLIC_API_URL}/api`
- **Timeout**: 15 seconds
- **Content-Type**: `application/json`

### Request Interceptor

Automatically attaches the JWT access token from `expo-secure-store` to every request:

```
Authorization: Bearer <accessToken>
```

### Response Interceptor (Automatic Token Refresh)

When a `401` response is received:

1. If a refresh is **not** already in progress:
   - Marks the request for retry (`_retry = true`)
   - Reads the refresh token from secure store
   - Calls `POST /api/auth/refresh` (via a fresh Axios instance, not the intercepted one)
   - Stores the new tokens in secure store
   - Retries the original request with the new access token
   - Processes any queued requests that were waiting

2. If a refresh **is** already in progress:
   - Queues the failed request in a promise queue
   - When the refresh completes, all queued requests are retried with the new token

3. If the refresh itself fails:
   - Clears both tokens from secure store (forces re-login)
   - Rejects all queued requests

This ensures that concurrent requests don't trigger multiple refresh calls.

### Service Modules

**`services/auth.ts`** — `register()`, `login()`, `logout()`, `getProfile()`

**`services/tasks.ts`** — `getTasks(filters)`, `getTask(id)`, `createTask(input)`, `updateTask(id, input)`, `deleteTask(id)`, `getStats()`

**`services/ai.ts`** — `fetchDailySummary()` — fetches the AI daily summary from `GET /api/ai/daily-summary`

**`services/user.ts`** — `getNotificationTime()`, `updateNotificationTime(hour, minute)` — read/write notification time settings via the backend API

### Notifications Hook (`hooks/useNotifications.ts`)

The `useNotifications()` hook manages the full push notification lifecycle for daily AI summaries:

| Function | Description |
|----------|-------------|
| `getNotificationTime()` | Read cached notification time from SecureStore |
| `setNotificationTime(h, m)` | Write notification time to SecureStore |
| `getNotificationsEnabled()` | Read enabled flag from SecureStore |
| `setNotificationsEnabled(v)` | Write enabled flag to SecureStore |
| `ensurePermissions()` | Request notification permissions + set up Android channel `"daily-summary"` |
| `scheduleDailySummary()` | Sync time from backend (best-effort, falls back to local), cancel all existing, fetch summary, schedule daily notification |
| `useNotifications()` | Hook that runs `scheduleDailySummary()` on mount; returns `{ reschedule }` |

The hook is wired in `app/(app)/_layout.tsx` so notifications initialize after authentication. On app open, it:

1. Syncs notification time from the backend (falls back to local cache if offline)
2. Cancels all existing scheduled notifications
3. Fetches the current daily summary from the API
4. Schedules a daily notification at the user's configured time using `SchedulableTriggerInputTypes.DAILY`

Notifications are **local** (scheduled via `expo-notifications`), not remote push. No Firebase or APNs infrastructure is needed.

### AI Summary Card Behavior

The home screen displays an AI daily summary card at the top of the dashboard. The card has several states:

| State | Condition | What the user sees |
|-------|-----------|-------------------|
| **Loading** | Fetching summary from backend | Skeleton/spinner in the card area |
| **Success** | Summary returned with focus tasks | Summary text, top 3 focus tasks with reasons, encouragement message |
| **Error** | API returned a non-503 error | Card is hidden or shows a subtle error |
| **Not configured** | Backend returned 503 (no `GROQ_API_KEY`) | Card is **hidden entirely** — the dashboard shows only the progress card and task list |
| **Rate limited** | Backend returned 429 | Card shows a "try again later" message |

The card only appears if the backend has AI features configured (`GROQ_API_KEY` set). If the key is missing, the `GET /api/ai/daily-summary` endpoint returns 503 and all frontends silently suppress the card — the rest of the app works normally.

### Event Horizon OAuth (Mobile)

The mobile app uses [`expo-web-browser`](https://docs.expo.dev/versions/latest/sdk/webbrowser/) to open the OAuth flow in an in-app browser session:

1. User taps "Sign in with Event Horizon" on the login screen
2. `eventHorizonLogin()` calls `WebBrowser.openAuthSessionAsync()` with the backend's `/api/auth/eventhorizon/login?redirect_uri=ovo://auth/callback` URL
3. The backend handles the full OAuth dance with Event Horizon
4. After auth, the backend redirects to `ovo://auth/callback?access_token=...&refresh_token=...`
5. The app intercepts the `ovo://` deep link, reads the tokens, stores them in `expo-secure-store`, and navigates to the dashboard

The `ovo://` custom URL scheme is configured in `apps/mobile/app.json` (`"scheme": "ovo"`). See [Event Horizon OAuth](./event-horizon-oauth.md) for the full flow.

## Reusable Components

| Component | File | Description |
|-----------|------|-------------|
| `TaskCard` | `components/TaskCard.tsx` | Animated card with title, description, status/priority chips, due date. Tap status chip to cycle through statuses. Swipe-accessible delete button. |
| `ProgressCard` | `components/ProgressCard.tsx` | Shows completion rate percentage, progress bar, and counts for pending/active/done. |
| `StatusFilter` | `components/StatusFilter.tsx` | Horizontally scrollable chip row for filtering by All / Pending / In Progress / Completed. |
| `EmptyState` | `components/EmptyState.tsx` | Centered message with optional action button, shown when the task list is empty. |
| `LoadingScreen` | `components/LoadingScreen.tsx` | Full-screen centered spinner with optional message text. |

## Building the APK

### Local Build

A local build script exists at the repo root (`build-apk.sh`, gitignored):

```bash
# Build APK for arm64-v8a (Poco X3 Pro)
./build-apk.sh

# Build and install on connected device
./build-apk.sh --install
```

The script handles:
- Prerequisite checks (pnpm, Java 17, `.env` file)
- Kills stale Gradle/Metro processes
- Runs `expo prebuild --platform android --clean`
- Builds release APK with `arm64-v8a` architecture only
- Copies APK to repo root as `ovo-release.apk`
- Optionally installs via `adb`

### Manual Build

```bash
cd apps/mobile

# Set environment
echo "EXPO_PUBLIC_API_URL=https://ovo-backend.vercel.app" > .env

# Generate native project
npx expo prebuild --platform android --clean

# Build
cd android
JAVA_HOME=/usr/lib/jvm/java-17-openjdk \
  ./gradlew assembleRelease --no-daemon \
    -PreactNativeArchitectures=arm64-v8a \
    -Dorg.gradle.jvmargs="-Xmx4g -XX:MaxMetaspaceSize=1g"
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`.

### CI Build

APKs are built automatically by GitHub Actions on every push to `main`. See [Deployment](./deployment.md) for details.

### Build Notes

- **Java 17 is required** — Java 21 is not compatible with this React Native/Gradle version.
- **`android/` is gitignored** — it's regenerated from `expo prebuild` each time.
- **arm64-v8a only** for local builds reduces build time and APK size. CI builds produce universal APKs.
- **Memory**: On machines with 12GB RAM or less, use `--no-daemon` and limit JVM heap to avoid OOM.
