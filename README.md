# Polling App with QR Code Sharing

A modern polling application built with Next.js, TypeScript, Tailwind CSS, and Supabase. Create polls, vote on them, and share them via QR codes or direct links.

## Features

- 🗳️ **Create Polls**: Create polls with multiple choice questions
- 📊 **Real-time Results**: View live voting results with progress bars
- 📱 **QR Code Sharing**: Generate QR codes for easy poll sharing
- 🔗 **Direct Links**: Share polls via direct URLs
- 📱 **Responsive Design**: Works perfectly on desktop and mobile
- ⚡ **Fast Performance**: Built with Next.js App Router and Server Components
- 🎨 **Modern UI**: Beautiful interface with shadcn/ui components

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Icons**: Lucide React
- **QR Codes**: qrcode.react

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd polling-app
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL commands from `database-schema.sql` to create the database tables
4. Go to Settings > API to get your project URL and keys

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_service_role_key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
polling-app/
├── app/                    # Next.js App Router pages
│   ├── create/            # Poll creation page
│   ├── polls/[id]/        # Individual poll pages
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── CreatePollForm.tsx
│   ├── PollCard.tsx
│   ├── PollDetailView.tsx
│   └── QRCodeShare.tsx
├── lib/                  # Utilities and configurations
│   ├── actions.ts        # Server Actions
│   ├── supabase.ts      # Supabase client
│   ├── types.ts         # TypeScript types
│   └── utils.ts         # Utility functions
└── database-schema.sql   # Database setup
```

## Key Features Explained

### Poll Detail View

- **Voting Interface**: Clean, accessible voting form with radio button selection
- **Real-time Results**: Live vote counts with percentage calculations and progress bars
- **Vote Confirmation**: Success messages and vote status tracking
- **Responsive Layout**: Works on all screen sizes

### QR Code Sharing

- **QR Code Generation**: Generate QR codes for easy mobile sharing
- **Copy to Clipboard**: One-click URL copying
- **Native Sharing**: Use device's native share functionality when available
- **Sticky Sidebar**: QR code stays visible while scrolling

### Server Actions

- **Form Handling**: Server Actions for form submissions (no API routes needed)
- **Data Validation**: Server-side validation and error handling
- **Real-time Updates**: Automatic page revalidation after votes

## Database Schema

The app uses three main tables:

- **polls**: Stores poll information (title, description, status)
- **poll_options**: Stores poll choices with vote counts
- **votes**: Records individual votes (with IP tracking for basic duplicate prevention)

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to set these in your deployment platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
