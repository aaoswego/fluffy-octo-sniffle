# Gamified Learning App

## Overview

This is a Flask-based web application that creates personalized, gamified learning experiences. Users input a topic they want to learn, their familiarity level, and available time. The app uses OpenAI's GPT model to generate structured learning content with sections, key points, and interactive quizzes to reinforce learning.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology**: Vanilla JavaScript with HTML/CSS
- **Design Pattern**: Single Page Application (SPA) with screen-based navigation and side menu
- **Navigation**: Side menu with two modes:
  - **Normal Learning**: Full gamified learning experience with sections and quizzes
  - **Interview Preparation**: Placeholder for future interview prep functionality
- **State Management**: Client-side state stored in JavaScript variables (`learningContent`, `currentSection`, `currentQuiz`, `completedSections`)
- **Rationale**: Keeps the application lightweight and avoids framework overhead for this relatively simple interactive experience

### Backend Architecture
- **Framework**: Flask (Python)
- **Session Management**: Server-side sessions using Flask's session mechanism with a required `SESSION_SECRET` environment variable
- **Data Storage**: In-memory dictionary (`quiz_storage`) for temporary quiz data
- **Content Validation**: Server-side validation function (`validate_learning_content`) ensures AI-generated content conforms to expected schema
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
