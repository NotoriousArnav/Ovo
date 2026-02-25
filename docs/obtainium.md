# Installing Ovo with Obtainium

[Obtainium](https://github.com/ImranR98/Obtainium) is an Android app that installs and updates APKs directly from GitHub Releases (and other sources). Since Ovo publishes per-architecture APKs to GitHub Releases on every push to `main`, Obtainium can keep your install up to date automatically.

## Prerequisites

- An Android device
- Obtainium installed — get it from [F-Droid](https://f-droid.org/packages/dev.imranr.obtainium.fdroid/), [GitHub Releases](https://github.com/ImranR98/Obtainium/releases), or [IzzyOnDroid](https://apt.izzysoft.de/fdroid/index/apk/dev.imranr.obtainium)

## Setup

### 1. Open Obtainium and add a new app

Tap the **+** (Add App) button on the main screen.

### 2. Enter the source URL

In the **App Source URL** field, enter:

```
https://github.com/NotoriousArnav/Ovo
```

Obtainium will auto-detect this as a GitHub Releases source.

### 3. Configure the release asset filter

Ovo publishes multiple APKs per release — one for each CPU architecture. You need to tell Obtainium which one to download.

In the **APK Filter RegEx** field, enter a regex matching your device's architecture:

| Your device | Filter value | Notes |
|---|---|---|
| Most modern phones (2017+) | `arm64-v8a` | 64-bit ARM — the most common |
| Older 32-bit phones | `armeabi-v7a` | 32-bit ARM |
| x86_64 emulator / Chromebook | `x86_64` | 64-bit x86 |
| x86 emulator | `x86` | 32-bit x86 (rare) |
| Not sure | `universal` | Works on all architectures (larger file size) |

**How to check your architecture:** Go to *Settings > About Phone* and look for the CPU/Processor field. Or install [CPU-Z](https://play.google.com/store/apps/details?id=com.cpuid.cpu_z) and check the ABI field.

If you're unsure, use `universal` — it works everywhere.

### 4. Save and install

Tap **Add** to save the app. Obtainium will fetch the latest release and prompt you to install the APK. Allow installation from unknown sources if prompted.

## Auto-Updates

Obtainium periodically checks for new GitHub Releases in the background. When a new commit is pushed to `main`, the CI pipeline builds fresh APKs and publishes a release tagged by commit hash.

To configure update frequency:

1. Open Obtainium **Settings**
2. Under **Background Updates**, set your preferred interval (e.g. every 6 hours)
3. Enable **Auto-install updates** if you want hands-free updates

You can also manually check for updates by pulling down to refresh on the Obtainium main screen.

## Troubleshooting

**"App not installed" error** — Make sure you selected the correct architecture. If you used `arm64-v8a` and it failed, try `universal` instead.

**No releases found** — The GitHub Actions workflow runs on push to `main`. If the repo was just forked or no commits have been pushed, there may not be any releases yet. Trigger a build by pushing a commit or running the workflow manually from the Actions tab.

**Multiple APKs matched** — Make your filter regex more specific. For example, use `arm64-v8a` instead of just `arm64` to avoid matching multiple files.

## Self-Hosting Note

If you fork Ovo and deploy your own backend, you'll need to update the `EXPO_PUBLIC_API_URL` in the GitHub Actions workflow (`.github/workflows/build-apk.yml`) to point to your backend URL before APKs are built. The releases on your fork will then connect to your self-hosted instance.
