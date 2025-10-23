# Gamified Learning App

## Overview

This is a Flask-based web application that creates personalized, gamified learning experiences with two main modes:

1. **Normal Learning**: Users input a topic they want to learn, their familiarity level, and available time. The app uses OpenAI's GPT model to generate structured learning content with sections, key points, and interactive quizzes to reinforce learning.

2. **Interview Preparation**: Users input position title, company name, and job description to receive 20 AI-generated interview questions tailored to the specific position, helping them prepare for technical and behavioral interview scenarios.

## Recent Changes

### October 22, 2025 (Latest)
- **Interview Preparation Enhancement**: Added position title as input field
  - **New Field**: Position title input field added to interview preparation form
  - **Enhanced Prompts**: AI now generates questions specifically tailored to the position title
  - **Better Context**: Questions are more relevant with position-specific technical and behavioral scenarios
  - **Display Update**: Interview quiz screen now shows position title in the header

### October 22, 2025 (Earlier)
- **Deployment Configuration Fix**: Properly configured deployment for production
  - **Run Command**: Set up Gunicorn as the production server (`gunicorn --bind=0.0.0.0:5000 --reuse-port app:app`)
  - **Deployment Target**: Configured for autoscale deployment
  - **Dependencies**: Installed Gunicorn and created requirements.txt for all dependencies
  - **Health Checks**: App now properly responds to health checks on / endpoint

### October 21, 2025
- **Green Primary Buttons**: Changed all primary action buttons from black to green (#22C55E)
  - **Button Color**: Vibrant green background matching accent color throughout app
  - **Hover State**: Darker green (#16A34A) with enhanced shadow for depth
  - **Consistency**: All main action buttons now use green theme
  - **Navigation Active State**: Active menu item in top navigation now shows green pill button

### October 20, 2025
- **Responsive Navigation Update**: Changed to horizontal top menu for desktop, side menu for mobile
  - **Desktop Layout**: Top navigation bar with "Learning Hub" logo left, menu items right
  - **Mobile Layout**: Side menu with hamburger button for smaller screens (<768px)
  - **Active State**: Black pill-shaped button for active menu item on desktop
  - **Mobile Behavior**: Side menu slides in from left, auto-closes after selection
- **Green Accent Colors**: Added green (#22C55E) accents throughout design
  - **Progress Bar**: Green-to-cyan gradient for visual interest
  - **Key Points**: Green headers and arrows for emphasis
  - **Section Hovers**: Green borders and shadows on hover
  - **Active Sections**: Green border and light green background
  - **Completed Sections**: Green border and light green background
  - **Input Focus States**: Green border and glow on all form inputs
  - **Button Hovers**: Green border and text on secondary buttons
  - **Quiz Options**: Green hover borders and shadows
  - **Radio Buttons**: Green accent color
  - **Loading Spinner**: Green spinning animation
  - **ELI5 Section**: Green headers, response indicators, and input focus
  - **Score Display**: Green color for completed sections counter
  - **Mobile Menu**: Green accent on active item border

### October 20, 2025 (Earlier)
- **Whoop-Inspired Design Overhaul**: Complete redesign to match Whoop's actual website aesthetic
  - **Color Scheme**: White background (#FFFFFF), black text, cyan accent (#00D4D4)
  - **Typography**: Modern system fonts matching Whoop's clean, professional style
  - **Minimalist Design**: White cards with subtle shadows and light borders
  - **Premium Feel**: Clean, data-focused interface with professional styling
  - **Interactive Elements**: Cyan hover states, smooth transitions, pill-shaped buttons
  - **Light Theme**: Clean light backgrounds matching Whoop's website sections
  - **No Icons**: Removed all emoji icons for cleaner, text-only navigation matching Whoop's minimal aesthetic

### October 19, 2025
- **Interview Questions Enhancement**: Updated Interview Preparation mode to generate categorized questions
  - Generates exactly 10 behavioral questions focused on soft skills and teamwork
  - Generates exactly 10 technical questions based on job-specific requirements
  - Questions displayed in clearly labeled sections with emoji headers
  - Backend prompt updated to request specific question categories
  - Frontend groups questions by category for better organization
  - Maintains sequential numbering across both categories

### October 12, 2025
- **Hamburger Menu**: Made side menu hideable with hamburger button
  - Floating hamburger button in top-left corner
  - Smooth slide-in/slide-out animation
  - Main content expands when menu is hidden
  - Menu starts open by default
  - Learning Hub title positioned below hamburger button
- **Professional Design Update**: Removed all gradients for cleaner, modern look
  - Clean white/light gray (#f5f7fa) background
  - Solid blue (#667eea) color scheme throughout
  - White cards with subtle shadows for depth
  - Playful bounce animation on completed sections
  - Professional yet friendly aesthetic

### October 12, 2025 (Earlier)
- **Explain Like I'm 5 Feature**: Added interactive Q&A section in every learning section
  - Users can ask questions about any part of the section content
  - AI provides simple, child-friendly explanations using GPT-5
  - New `/eli5-explain` endpoint handles explanation generation
  - Located between main content and "Take Quiz" button for easy access
  - HTML content stripped before sending to AI for cleaner prompts
- **Quiz Preloading Bug Fix**: Fixed issue where quizzes wouldn't preload when navigating between sections
  - Added quiz cache clearing in `showSection()` function
  - Ensures preloading works correctly for all sections regardless of navigation pattern

### October 12, 2025 (Earlier)
- **Quiz Pre-loading Feature**: Implemented background quiz generation when sections open for instant display when clicking "Take Quiz"
- **Quiz ID System**: Added unique quiz identifiers to prevent race conditions and ensure grading accuracy
  - `/generate-quiz` endpoint now returns quiz_id along with questions
  - New `/activate-quiz` endpoint promotes pre-loaded quizzes to active status for grading
  - Dual storage strategy: quiz ID-based for pre-loaded quizzes, session-based for active quizzes
- **Incorrect Answers Display**: Added review section in Normal Learning mode showing incorrectly answered questions with color-coded feedback (red for user's answer, green for correct answer)
- **State Management**: Enhanced client-side state with `currentQuizId` tracking

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology**: Vanilla JavaScript with HTML/CSS
- **Design Pattern**: Single Page Application (SPA) with screen-based navigation and side menu
- **Navigation**: Side menu with two modes:
  - **Normal Learning**: Full gamified learning experience with sections and quizzes
  - **Interview Preparation**: Job-specific interview quiz with 20 AI-generated questions
- **State Management**: Client-side state stored in JavaScript variables (`learningContent`, `currentSection`, `currentQuiz`, `completedSections`)
- **Rationale**: Keeps the application lightweight and avoids framework overhead for this relatively simple interactive experience

### Backend Architecture
- **Framework**: Flask (Python)
- **Session Management**: Server-side sessions using Flask's session mechanism with a required `SESSION_SECRET` environment variable
- **Data Storage**: In-memory dictionary (`quiz_storage`) for temporary quiz data with dual storage strategy:
  - Quiz ID-based storage for pre-loaded quizzes
  - Session-based storage for active quizzes used in grading
- **Content Validation**: Server-side validation function (`validate_learning_content`) ensures AI-generated content conforms to expected schema
- **Quiz Activation System**: `/activate-quiz` endpoint promotes pre-loaded quizzes to active status for grading
- **Rationale**: Flask provides a simple, flexible foundation for this educational tool without unnecessary complexity

### AI Content Generation
- **Provider**: OpenAI API
- **Model**: GPT-5 (as of August 7, 2025)
- **Integration Pattern**: Direct API calls via OpenAI Python client
- **Content Structure**: Generates structured JSON with overview, sections (title, content, key_points), and quizzes
- **Rationale**: OpenAI's models excel at creating educational content tailored to user expertise levels

### Design Patterns
- **Progressive Disclosure**: Content revealed section-by-section to avoid overwhelming users
- **Gamification**: Progress tracking and quiz completion to increase engagement
- **Validation Layer**: Robust content validation prevents malformed AI responses from breaking the UI
- **Quiz Pre-loading**: Background quiz generation when sections open for instant display
- **Quiz ID System**: Unique identifiers track quizzes to prevent race conditions during pre-loading and ensure grading accuracy

## External Dependencies

### APIs and Services
- **OpenAI API**: Primary service for generating personalized learning content
  - Requires `OPENAI_API_KEY` environment variable
  - Used for content generation based on topic, familiarity level, and time constraints

### Environment Variables (Required)
- `SESSION_SECRET`: Used for Flask session encryption and security
- `OPENAI_API_KEY`: Authentication for OpenAI API access

### Python Packages
- `flask`: Web framework
- `openai`: Official OpenAI Python client library

### Frontend Dependencies
- No external JavaScript libraries (vanilla JS)
- No CSS frameworks (custom CSS with gradient backgrounds)
