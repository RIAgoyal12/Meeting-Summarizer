# 📝 Meeting Summarizer

A powerful React-based web application that automatically analyzes meeting transcripts and generates comprehensive summaries with action items, key decisions, and participant tracking.

## ✨ Features

### Core Functionality
- **PDF Upload Support** - Upload meeting transcripts in PDF format
- **Text Input** - Paste meeting transcripts directly into the application
- **AI-Powered Analysis** - Uses Google's Gemini AI to analyze and summarize meetings
- **Interactive Chat Interface** - Ask questions about your meeting transcripts
- **Voice Input** - Speech-to-text functionality for hands-free input

### Meeting Analysis
- **Comprehensive Summaries** - Extract key points, decisions, and meeting overview
- **Action Item Tracking** - Automatically identify and track action items with assignees and due dates
- **Participant Detection** - Identify and list meeting participants
- **Decision Logging** - Track important decisions made during meetings

### Organization & Export
- **Meeting Archive** - Store and organize multiple meeting summaries
- **Email Integration** - Generate formatted email summaries
- **JSON Export** - Export meeting data in JSON format
- **Progress Tracking** - Mark action items as complete/incomplete

### User Experience
- **Dark/Light Theme** - Toggle between dark and light modes
- **Responsive Design** - Works on desktop and mobile devices
- **Real-time Updates** - Live chat interface with typing indicators
- **Copy to Clipboard** - Easy copying of summaries and content

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <https://github.com/RIAgoyal12/Meeting-Summarizer>
   cd meeting-summarizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   **⚠️ Security Note**: The current implementation has the API key hardcoded. For production use, make sure to:
   - Move the API key to environment variables
   - Never commit API keys to version control
   - Consider using a backend API to proxy requests

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🛠️ Tech Stack

### Core Technologies
- **React 18** - Frontend framework
- **Next.js** - React framework with server-side rendering
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

### UI Components
- **shadcn/ui** - Pre-built accessible UI components
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### AI & Processing
- **Google Gemini AI** - Natural language processing and summarization
- **PDF.js** - Client-side PDF parsing
- **Web Speech API** - Voice input functionality

### Data Management
- **Local Storage** - Persistent data storage in browser
- **React Hooks** - State management

## 📁 Project Structure

```
meeting-summarizer/
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── public/
│   ├── favicon.ico
│   └── icons/
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── button.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── textarea.tsx
│   │   └── MeetingSummarizer.tsx
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── _document.tsx
│   │   └── index.tsx
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── index.ts
└── .env.local
```

## 🔧 Configuration

### API Configuration
The application uses Google's Gemini AI API. You'll need to:

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Replace the hardcoded API key in the component or use environment variables
3. Configure API settings in the `generateContent` calls

### Environment Variables
Create a `.env.local` file with:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

### Theme Configuration
The app supports both dark and light themes:
- Default theme: Dark mode
- Theme preference is saved to localStorage
- Toggle button in the header

## 💡 Usage Guide

### Uploading a Meeting Transcript

1. **PDF Upload**
   - Click the upload button (📤) in the chat interface
   - Select a PDF file containing your meeting transcript
   - The app will automatically parse and load the content

2. **Text Input**
   - Go to the Summary tab
   - Paste your meeting transcript into the text area
   - The app will process the text automatically

### Generating Summaries

1. After uploading/pasting content, click "Generate Summary"
2. The AI will analyze the transcript and create:
   - Meeting overview and key points
   - List of participants
   - Important decisions made
   - Action items with assignees and due dates

### Managing Action Items

- **View**: All action items are listed in the Summary tab
- **Track Progress**: Click checkboxes to mark items as complete
- **Assign**: Action items are automatically assigned based on transcript content
- **Due Dates**: Dates are extracted from the transcript when available

### Exporting and Sharing

- **Email Summary**: Generate a formatted email with meeting details
- **JSON Export**: Download meeting data as a JSON file
- **Copy Content**: Copy summaries to clipboard for sharing

## 🔒 Security Considerations

### Current Limitations
- API key is hardcoded (development only)
- All data stored in browser localStorage
- No user authentication

### Production Recommendations
- Move API key to server-side environment
- Implement proper authentication
- Add data encryption for sensitive meetings
- Set up secure backend API endpoints
- Add rate limiting for API calls

## 🐛 Troubleshooting

### Common Issues

1. **PDF Not Loading**
   - Ensure PDF contains selectable text (not scanned images)
   - Try a different PDF file
   - Check browser console for errors

2. **API Errors**
   - Verify your Gemini API key is valid
   - Check network connectivity
   - Monitor API quota limits

3. **Speech Recognition Not Working**
   - Use a supported browser (Chrome, Safari)
   - Grant microphone permissions
   - Ensure stable internet connection

4. **Summary Generation Fails**
   - Check transcript content is readable
   - Verify API key configuration
   - Try with a shorter transcript

### Browser Compatibility
- **Recommended**: Chrome, Safari, Firefox (latest versions)
- **Speech Recognition**: Chrome and Safari only
- **PDF Processing**: All modern browsers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Create a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use existing UI components when possible
- Add proper error handling
- Update documentation for new features

## 📦 Dependencies

### Main Dependencies
```json
{
  "react": "^18.0.0",
  "next": "^14.0.0",
  "typescript": "^5.0.0",
  "tailwindcss": "^3.0.0",
  "framer-motion": "^10.0.0",
  "lucide-react": "^0.263.1",
  "sonner": "^1.0.0"
}
```

### Development Dependencies
```json
{
  "@types/react": "^18.0.0",
  "@types/node": "^20.0.0",
  "eslint": "^8.0.0",
  "eslint-config-next": "^14.0.0"
}
```

## 🚀 Deployment

### Vercel Deployment
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Manual Deployment
```bash
npm run build
npm run start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the Google Gemini AI documentation

## 🔮 Roadmap

### Planned Features
- [ ] Multi-language support
- [ ] Integration with calendar applications
- [ ] Team collaboration features
- [ ] Advanced analytics dashboard
- [ ] Mobile app version
- [ ] Integration with video conferencing platforms
- [ ] Custom summary templates
- [ ] Automated follow-up reminders

## 📋 Changelog

### v1.0.0 (Current)
- Initial release
- PDF upload and text input support
- AI-powered meeting analysis
- Action item tracking
- Export functionality
- Dark/Light theme support

---

**Note**: This application is designed for meeting productivity and should be used in compliance with your organization's data privacy policies.
