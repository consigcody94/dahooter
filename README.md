# DaHooter 📞

A gorgeous, feature-rich softphone application supporting FreePBX, RingCentral, 3CX, Asterisk, FreeSWITCH, Twilio, Vonage, and generic SIP.

![DaHooter Screenshot](./docs/screenshot.png)

## Features

### Core Calling
- 📞 **HD Voice Calls** - Crystal-clear audio with echo cancellation and noise suppression
- 📹 **Video Calls** - High-quality video conferencing
- 🔄 **Call Transfer** - Blind and attended transfers
- 👥 **Conference Calling** - Merge multiple calls
- ⏸️ **Hold/Resume** - Put calls on hold with one click
- 🔇 **Mute Control** - Instant mute/unmute
- 🎙️ **DTMF Support** - Send touch-tones during calls
- 🔴 **Call Recording** - Record calls locally

### Messaging & Presence
- 💬 **SMS/MMS Messaging** - Send and receive text messages
- 👤 **Presence Status** - Available, Busy, Away, DND, Offline
- ✅ **Read Receipts** - Know when messages are read
- 📎 **File Attachments** - Share files in conversations

### Contact Management
- 📇 **Contact Directory** - Store and organize contacts
- ⭐ **Favorites** - Quick access to frequent contacts
- 🔍 **Smart Search** - Find contacts instantly
- 🏢 **Company Info** - Store company and job title

### Call History
- 📋 **Full History** - All incoming, outgoing, and missed calls
- 📊 **Call Duration** - Track call times
- 🔄 **Quick Callback** - One-click to return calls
- 📅 **Date Grouping** - Organized by day

### Provider Support
- 🟠 **FreePBX** - Full integration with FreePBX/Asterisk
- 🟡 **RingCentral** - Enterprise cloud communications
- 🔵 **3CX** - Software-based PBX support
- 🔴 **Asterisk** - Direct Asterisk connection
- 🟢 **FreeSWITCH** - FreeSWITCH integration
- 🟣 **Twilio** - Twilio Voice SDK
- 🟤 **Vonage** - Vonage SIP support
- ⚪ **Generic SIP** - Any SIP-compatible server

### User Experience
- 🌙 **Dark Mode** - Beautiful dark theme (default)
- ☀️ **Light Mode** - Clean light theme
- 🎨 **Accent Colors** - Aurora, Cosmic, Nebula themes
- ✨ **Smooth Animations** - Buttery-smooth UI transitions
- 📱 **Responsive Design** - Works on any screen size
- 🔔 **Notifications** - Desktop notifications for calls

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS with custom design system
- **State**: Zustand for state management
- **Animations**: Framer Motion
- **SIP/WebRTC**: SIP.js library
- **Build**: Vite
- **UI Components**: Radix UI primitives

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/fowlb/dahooter.git
cd dahooter

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## Configuration

### SIP Account Setup

1. Launch DaHooter
2. Complete the setup wizard
3. Select your provider (FreePBX, RingCentral, 3CX, etc.)
4. Enter your SIP credentials:
   - Server address
   - Port
   - Username/Extension
   - Password
5. Configure audio/video devices
6. Start making calls!

### Provider-Specific Settings

#### FreePBX
- Default port: 8089 (WSS)
- Enable WebRTC in FreePBX settings
- Create a WebRTC-enabled extension

#### RingCentral
- Use RingCentral SIP credentials
- Server: sip.ringcentral.com

#### 3CX
- Default port: 5090 (WSS)
- Enable WebRTC for extension

## Project Structure

```
dahooter/
├── src/
│   ├── components/
│   │   ├── call/           # Call-related components
│   │   ├── contacts/       # Contact management
│   │   ├── dialpad/        # Dialpad component
│   │   ├── history/        # Call history
│   │   ├── messages/       # Messaging
│   │   ├── settings/       # Settings panels
│   │   ├── setup/          # Setup wizard
│   │   └── ui/             # Reusable UI components
│   ├── services/
│   │   └── sipService.ts   # SIP/WebRTC service
│   ├── stores/
│   │   ├── appStore.ts     # Main app state
│   │   └── callStore.ts    # Call state management
│   ├── types/
│   │   └── index.ts        # TypeScript types
│   ├── utils/
│   │   └── helpers.ts      # Utility functions
│   ├── styles/
│   │   └── globals.css     # Global styles
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `1-9, 0, *, #` | Dial digits |
| `Backspace` | Delete last digit |
| `Enter` | Make call |
| `Escape` | Hang up / Cancel |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [SIP.js](https://sipjs.com/) - WebRTC SIP library
- [Radix UI](https://radix-ui.com/) - Accessible UI primitives
- [Lucide Icons](https://lucide.dev/) - Beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

Made with ❤️ by the DaHooter Team
