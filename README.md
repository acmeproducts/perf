<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Orbital8 - Cloud Image Browser

Orbital8 is a web-based application designed for rapidly sorting and organizing images stored in your cloud storage provider (Google Drive or OneDrive). It provides a fast, keyboard-driven, and gesture-based interface to categorize images into different "stacks" (like 'Inbox', 'Keep', 'Maybe', and 'Recycle'), making it easy to triage large volumes of pictures.

The application is built as a single-page application using vanilla JavaScript, HTML, and CSS, all contained within a single `index.html` file. It uses IndexedDB for local caching to provide a fast, offline-first experience after the initial load of a folder.

## Features

- **Cloud Provider Integration**: Connects to Google Drive and Microsoft OneDrive.
- **Fast Image Triage**: Use keyboard shortcuts (arrow keys) or swipe gestures to quickly move images between stacks.
- **Stack-based Organization**: Sort images into `in`, `out`, `priority`, and `trash` stacks.
- **Grid View**: View all images in a stack in a grid layout for bulk operations.
- **Bulk Actions**: Tag, move, or delete multiple images at once.
- **Metadata Extraction**: Automatically extracts and displays metadata from PNG files.
- **Offline Caching**: After a folder is loaded once, its contents are cached in your browser's IndexedDB for near-instant subsequent loads.
- **Focus Mode**: A distraction-free mode for viewing and navigating images.
- **Customizable**: Adjust visual effect intensity and haptic feedback.

## Architecture

This project is intentionally built as a self-contained single-file application (`index.html`). There is no build step or server-side component required. All the application logic, styling, and HTML structure are in one place.

- **`index.html`**: Contains the HTML structure, all CSS styles in a `<style>` tag, and all JavaScript logic in a `<script>` tag.
- **Vanilla JavaScript**: The application is written in modern, object-oriented vanilla JavaScript. It does not use any external frameworks like React or Vue.
- **IndexedDB**: The browser's built-in database is used to cache file lists and metadata, which significantly speeds up loading times for previously accessed folders.

## Code Documentation

The JavaScript code within `index.html` has been thoroughly documented using JSDoc-style comments. This provides a clear explanation of all major components, classes, and functions, making it easier to understand and maintain the codebase. Key documented components include:
- `App`: The main application controller.
- `Core`: Handles core logic for stacks and image display.
- `GoogleDriveProvider` / `OneDriveProvider`: Manages API interactions with cloud services.
- `DBManager`: Manages the IndexedDB cache.
- `Gestures`: Handles all user input (mouse, touch, keyboard).

## Setup and Usage

Since this is a single-file application, running it locally is very simple.

### Prerequisites

- A modern web browser (like Chrome, Firefox, Safari, or Edge).
- A local web server to serve `index.html`. (This is necessary to avoid CORS issues with the cloud provider APIs).

### Running Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Serve the `index.html` file.** The easiest way to do this is with a simple Python web server.

    If you have Python 3 installed:
    ```bash
    python -m http.server
    ```
    If you have Python 2 installed:
    ```bash
    python -m SimpleHTTPServer
    ```
    Alternatively, you can use other tools like `npx serve`.

3.  **Open the application in your browser.** By default, the Python server will host the application at:
    [http://localhost:8000](http://localhost:8000)

### Connecting to a Cloud Provider

1.  **Select a Provider**: On the first screen, choose either Google Drive or OneDrive.

2.  **Authentication**:
    -   **For Google Drive**: You will be prompted to enter your own Google Cloud Client Secret. You can obtain one by setting up a project in the [Google Cloud Console](https://console.cloud.google.com/) with the Drive API enabled. After entering the secret, a popup will appear for you to sign in and grant access.
    -   **For OneDrive**: A popup will appear for you to sign in with your Microsoft account and grant access.

3.  **Select a Folder**: Once authenticated, you can browse and select a folder containing your images. The application will then load the images and you can begin sorting.
