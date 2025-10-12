# Gamified Learning App

## Overview

This is a Flask-based web application that creates personalized, gamified learning experiences with two main modes:

1. **Normal Learning**: Users input a topic they want to learn, their familiarity level, and available time. The app uses OpenAI's GPT model to generate structured learning content with sections, key points, and interactive quizzes to reinforce learning.

2. **Interview Preparation**: Users paste a job description and company name to receive 20 AI-generated interview questions tailored to the position, helping them prepare for technical and behavioral interview scenarios.

## Recent Changes

### October 12, 2025 (Latest)
- **Explain Like I'm 5 Feature**: Added interactive Q&A section in every learning section
  - Users can ask questions about any part of the section content
  - AI provides simple, child-friendly explanations using GPT-5
  - New `/eli5-explain` endpoint handles explanation generation
  - Located between main content and "Take Quiz" button for easy access
  - Styled with gradient background and clean UI design
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
