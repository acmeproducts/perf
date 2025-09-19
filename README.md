<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Orbital8 Goji Version

Orbital8 is a web-based application designed for sorting and managing images from cloud storage providers like Google Drive and OneDrive. It provides a streamlined, gesture-based interface for quickly categorizing images into different "stacks" (Inbox, Maybe, Keep, Recycle), editing their metadata, and viewing them in a distraction-free focus mode.

## Features

*   **Cloud Storage Integration**: Connects to Google Drive and OneDrive to access and manage your image libraries.
*   **Gesture-Based Sorting**: Use simple swipe gestures to quickly sort images into different stacks.
*   **Metadata Management**: View and edit image metadata, including tags, notes, and ratings.
*   **Focus Mode**: A distraction-free viewing mode for individual images.
*   **Grid View**: A powerful grid view with lazy loading, multi-select, and advanced search capabilities.
*   **Local-First Caching**: Uses IndexedDB to cache file lists and metadata for fast subsequent loads.
*   **Data Export**: Export image metadata to a CSV file for use in other applications.

## Project Structure

The project is a single-page application (SPA) built with vanilla JavaScript, HTML, and CSS.

*   `index.html`: The main entry point of the application. Contains the HTML structure and includes the necessary styles and scripts.
*   `src/app.js`: The core of the application, containing all the JavaScript logic.
*   `package.json`: Defines the project's dependencies and scripts.
*   `vite.config.ts`: Configuration file for the Vite build tool.
*   `README.md`: This file.

## Setup and Usage

### Prerequisites

*   Node.js
*   npm (or a compatible package manager)

### Running Locally

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Set up environment variables**:
    This project uses the Gemini API, which requires an API key. You will also need to provide your own client secret for Google Drive API access.
    *   Create a file named `.env.local` in the root of the project.
    *   Add the following lines to the file, replacing the placeholder with your actual key:
        ```
        GEMINI_API_KEY=your_gemini_api_key
        ```
    *   The application will prompt for the Google Drive client secret in the UI when you connect to Google Drive.

3.  **Run the development server**:
    ```bash
    npm run dev
    ```
    This will start the Vite development server. You can then open the application in your browser at the provided URL (usually `http://localhost:5173`).

## Contributing

Contributions are welcome! If you'd like to contribute to the project, please follow these steps:

1.  **Fork the repository**.
2.  **Create a new branch** for your feature or bug fix.
3.  **Make your changes**. Please adhere to the existing coding style and add JSDoc comments to any new functions or classes.
4.  **Test your changes** thoroughly.
5.  **Submit a pull request**.

### Coding Style

*   Use modern JavaScript (ES6+).
*   Follow the existing code structure and patterns.
*   Add JSDoc comments to all new functions, methods, and classes. The comments should clearly explain the purpose, parameters, and return values.

## Main Components

The application's logic is primarily contained within the `src/app.js` file and is organized into several key objects and classes:

*   **`App`**: The main application object that handles high-level logic, state transitions, and provider selection.
*   **`Core`**: Manages the core application logic, such as handling image stacks, displaying images, and managing the current state.
*   **`UI`**: A utility object for managing miscellaneous UI updates and interactions.
*   **`Gestures`**: Handles all gesture-based interactions, including swiping, tapping, and pinching.
*   **`Folders`**: Manages the UI and logic for the folder selection screens.
*   **`Grid`**: Manages the grid view modal, including lazy loading, selection, and searching.
*   **`Details`**: Manages the details modal, which displays information about a single image.
*   **`Modal`**: Manages the unified action modal for various bulk operations.
*   **`DBManager`**: Handles all interactions with the IndexedDB database for caching.
*   **`GoogleDriveProvider` / `OneDriveProvider`**: Classes that implement the interface for interacting with their respective cloud storage APIs.
*   **`MetadataExtractor`**: Handles the extraction of metadata from PNG files.
*   **`Events`**: Sets up all the event listeners for the application.
*   **`DraggableResizable`**: Handles making modal elements draggable and resizable.
