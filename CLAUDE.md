# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with hot reloading
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

## Project Overview

This is a React + TypeScript + Vite application that provides a web interface for the Common English Lexicon (CEL). The site allows users to:

1. **Word Validation**: Check if a word exists in the CEL
2. **Autocomplete**: Show matching words as user types
3. **Suggestions**: Provide similar words using Levenshtein distance when no exact matches found
4. **Scrabble Integration**: Link to Scrabble dictionary for each word

## Architecture

### Frontend (React/TypeScript)
- **Single Page Application**: All functionality in `src/App.tsx`
- **Data Loading**: Fetches CEL word list from `public/cel.txt` on startup
- **Word Lookup**: Uses `Set` for O(1) word validation and `Map` for first-letter indexing
- **Fuzzy Matching**: Implements Levenshtein distance via `fastest-levenshtein` library
- **State Management**: Uses React hooks (no external state management)

### Key Components
- Main search interface with real-time validation
- Autocomplete table showing prefix matches
- Suggestion system for typos/similar words
- Scrabble.com integration for word definitions

### Build Configuration
- **Vite**: Modern build tool with React plugin
- **Base URL**: Deployed to `/projects/common-english-lexicon/` (configured in `vite.config.ts`)
- **TypeScript**: Strict configuration with separate app/node configs
- **ESLint**: Modern flat config with React hooks and refresh plugins

## Data Files

- `public/cel.txt` - The complete Common English Lexicon word list (one word per line)
- `scripts/` - Python utilities for processing Discord voting data and CEL maintenance

## Development Notes

### Performance Optimizations
- First-letter indexing for faster autocomplete
- Levenshtein distance calculation only for words starting with same letter
- Suggestion filtering based on distance threshold (< 0.4)

### Word Processing
- All words normalized to lowercase
- Automatic focus on input field after lexicon loads
- Real-time validation without debouncing (fast enough with current dataset)

### External Dependencies
- `@heroicons/react` - Icons for UI (checkmarks, loading spinner)
- `fastest-levenshtein` - High-performance string distance calculation