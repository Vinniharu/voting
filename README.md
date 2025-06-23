# Secure Voting System

A modern, secure voting application built with Next.js 14, Supabase, and TypeScript. Create elections, manage candidates, and collect votes with real-time results.

## Features

- 🔐 **Secure Authentication** - User registration and login with Supabase Auth
- 🗳️ **Election Management** - Create and manage elections with custom settings
- 👥 **Candidate Management** - Add multiple candidates with descriptions
- 📊 **Real-time Voting** - Secure vote collection with duplicate prevention
- 📈 **Results Dashboard** - View election results and analytics
- 🔒 **Row Level Security** - Database-level security policies
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Built with Tailwind CSS and shadcn/ui components

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **TypeScript**: Full type safety
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Supabase account

### 1. Clone the Repository

```bash
git clone <repository-url>
cd voting-system
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy the database schema from `database/schema.sql`
4. Run the SQL in your Supabase SQL Editor to create tables and policies

### 3. Environment Configuration

1. Copy the environment template:
```bash
cp .env.local.example .env.local
```

2. Update `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Database Schema

The application uses the following main tables:

- **users** - User profiles and authentication data
- **elections** - Election information and settings
- **candidates** - Candidates for each election
- **votes** - Vote records with candidate selections

All tables include Row Level Security (RLS) policies for data protection.

## Project Structure

```
voting/
├── app/                                    # Next.js 14 App Router directory
│   ├── api/                               # API routes (server-side endpoints)
│   │   ├── auth/                          # Authentication API endpoints
│   │   │   ├── login/
│   │   │   │   └── route.ts              # User login endpoint
│   │   │   ├── logout/
│   │   │   │   └── route.ts              # User logout endpoint
│   │   │   ├── me/
│   │   │   │   └── route.ts              # Get current user profile
│   │   │   └── register/
│   │   │       └── route.ts              # User registration endpoint
│   │   ├── blockchain/                    # Blockchain validation features
│   │   │   └── validation/
│   │   │       └── route.ts              # Blockchain vote validation
│   │   └── elections/                     # Election management APIs
│   │       ├── [id]/                     # Dynamic election ID routes
│   │       │   ├── results/
│   │       │   │   └── route.ts          # Get election results
│   │       │   ├── vote/
│   │       │   │   └── route.ts          # Submit votes for election
│   │       │   └── route.ts              # Get specific election data
│   │       └── route.ts                  # Create/list elections
│   ├── dashboard/
│   │   └── page.tsx                      # Main dashboard page
│   ├── elections/                        # Election-related pages
│   │   └── [id]/                         # Dynamic election pages
│   │       ├── results/
│   │       │   └── page.tsx              # Election results page
│   │       └── page.tsx                  # Election details page
│   ├── login/
│   │   └── page.tsx                      # Login page
│   ├── register/
│   │   └── page.tsx                      # Registration page
│   ├── vote/                             # Voting interface
│   │   └── [id]/
│   │       └── page.tsx                  # Voting page for specific election
│   ├── favicon.ico                       # App favicon
│   ├── globals.css                       # Global CSS styles
│   ├── layout.tsx                        # Root layout component
│   └── page.tsx                          # Home page
├── components/                            # Reusable React components
│   ├── ui/                               # shadcn/ui components
│   │   ├── alert.tsx                     # Alert component
│   │   ├── badge.tsx                     # Badge component
│   │   ├── button.tsx                    # Button component
│   │   ├── card.tsx                      # Card component
│   │   ├── checkbox.tsx                  # Checkbox component
│   │   ├── dialog.tsx                    # Dialog/Modal component
│   │   ├── input.tsx                     # Input field component
│   │   ├── label.tsx                     # Label component
│   │   ├── progress.tsx                  # Progress bar component
│   │   ├── radio-group.tsx               # Radio group component
│   │   ├── select.tsx                    # Select dropdown component
│   │   ├── skeleton.tsx                  # Loading skeleton component
│   │   ├── table.tsx                     # Table component
│   │   ├── textarea.tsx                  # Textarea component
│   │   └── theme-toggle.tsx              # Dark/light theme toggle
│   ├── BlockchainValidationPanel.tsx     # Blockchain validation UI
│   ├── CreateElectionModal.tsx           # Election creation modal
│   ├── Navigation.tsx                    # Main navigation component
│   ├── theme-provider.tsx                # Theme provider wrapper
│   └── VoteResultsModal.tsx              # Vote results display modal
├── contracts/                            # Smart contract files
│   └── VotingValidation.sol              # Solidity contract for vote validation
├── database/                             # Database-related files
│   └── schema.sql                        # Complete database schema with RLS
├── lib/                                  # Utility libraries and configurations
│   ├── supabase/                         # Supabase client configurations
│   │   ├── client.ts                     # Client-side Supabase client
│   │   └── server.ts                     # Server-side Supabase client
│   ├── blockchain-validation.ts          # Blockchain validation utilities
│   ├── blockchain.ts                     # Blockchain interaction functions
│   ├── supabase.ts                       # Main Supabase client
│   ├── userStore.ts                      # Zustand store for user state
│   ├── utils.ts                          # General utility functions
│   └── validations.ts                    # Form validation schemas
├── public/                               # Static assets
│   ├── file.svg                          # File icon
│   ├── globe.svg                         # Globe icon
│   ├── next.svg                          # Next.js logo
│   ├── vercel.svg                        # Vercel logo
│   └── window.svg                        # Window icon
├── types/                                # TypeScript type definitions
│   ├── database.ts                       # Database type definitions
│   └── index.ts                          # Global type exports
├── .env.local                            # Environment variables (not in git)
├── .gitignore                            # Git ignore file
├── BLOCKCHAIN_SETUP.md                   # Blockchain setup instructions
├── README.md                             # Project documentation
├── next.config.ts                        # Next.js configuration
├── package.json                          # Node.js dependencies and scripts
├── package-lock.json                     # Locked dependency versions
├── postcss.config.mjs                    # PostCSS configuration
├── tailwind.config.ts                    # Tailwind CSS configuration
└── tsconfig.json                         # TypeScript configuration
```

### Directory Descriptions

#### `/app` - Next.js App Router
- **`api/`** - Server-side API endpoints using Next.js Route Handlers
- **`dashboard/`** - Protected dashboard for election management
- **`elections/`** - Public election viewing and results pages
- **`login/` & `register/`** - Authentication pages
- **`vote/`** - Public voting interface

#### `/components` - React Components
- **`ui/`** - Reusable UI components from shadcn/ui library
- **Custom components** - Application-specific components like modals and panels

#### `/lib` - Utilities and Configurations
- **`supabase/`** - Database client configurations for client and server
- **State management** - Zustand stores for global state
- **Utilities** - Helper functions, validations, and blockchain integration

#### `/database` - Database Schema
- **`schema.sql`** - Complete PostgreSQL schema with tables, RLS policies, triggers, and functions

#### `/types` - TypeScript Definitions
- Database types generated from Supabase
- Global application types and interfaces

#### `/contracts` - Smart Contracts
- Solidity contracts for blockchain-based vote validation

### Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with providers and navigation |
| `components/CreateElectionModal.tsx` | Modal for creating new elections |
| `components/VoteResultsModal.tsx` | Modal for displaying voting results |
| `lib/userStore.ts` | Zustand store for user authentication state |
| `lib/supabase/server.ts` | Server-side Supabase client with service role |
| `database/schema.sql` | Complete database schema with security policies |
| `app/api/elections/route.ts` | Main elections API endpoint |
| `app/vote/[id]/page.tsx` | Public voting interface |
| `.env.local` | Environment variables (Supabase keys) |

## Usage

### Creating an Account

1. Navigate to `/register`
2. Fill in your details and create an account
3. You'll be automatically logged in and redirected to the dashboard

### Creating an Election

1. From the dashboard, click "Create Election"
2. Fill in election details:
   - Title and description
   - Start and end dates
   - Voting policy (single or multiple votes)
   - Registration requirements
3. Add candidates (minimum 2 required)
4. Save the election

### Sharing Voting Links

1. From your dashboard, find the election
2. Click "Copy Link" to get the voting URL
3. Share the link with voters

### Voting Process

1. Voters visit the voting link
2. Select their preferred candidate(s)
3. Submit their vote
4. Votes are immediately recorded and counted

### Viewing Results

1. Click "View Results" on any election
2. See real-time vote counts and percentages
3. Results update automatically as votes are cast

## Security Features

- **Authentication Required**: All election management requires login
- **Vote Validation**: Prevents duplicate votes and invalid selections
- **Row Level Security**: Database-level access control
- **Input Validation**: Server-side validation for all data
- **Secure Sessions**: HTTP-only cookies for session management

## Development

### Key Components

- **CreateElectionModal**: Election creation interface
- **VotingInterface**: Vote casting interface
- **UserStore**: Zustand store for state management
- **Supabase Client**: Database and auth client

### API Routes

- `/api/auth/*` - Authentication endpoints
- `/api/elections` - Election management
- `/api/elections/[id]` - Individual election data
- `/api/elections/[id]/vote` - Vote submission

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the existing issues
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

Make sure to configure environment variables on your chosen platform.

---

Built with ❤️ using Next.js and Supabase
