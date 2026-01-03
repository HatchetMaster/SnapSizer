# Snap Sizer

A privacy-first, client-side image resizer that runs entirely in your browser. No uploads, no servers, no tracking.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Table of contents

* [Features](#features)
* [Demo](#demo)
* [Usage](#usage)
* [Getting started](#getting-started)
* [Development](#development)
* [Dependencies](#dependencies)
* [Browser support](#browser-support)
* [Project structure](#project-structure)
* [Technical details](#technical-details)
* [Privacy and security](#privacy-and-security)
* [Contributing](#contributing)
* [License](#license)

## Features

* **Privacy first** - All processing happens in your browser. Images never leave your device.
* **Multiple resize modes**

  * **Fit**: Clamp to maximum width/height while maintaining aspect ratio
  * **Scale**: Resize by percentage (shrink or enlarge)
  * **Width**: Set specific width, auto-calculate height
  * **Height**: Set specific height, auto-calculate width
  * **Allow upscaling**: Optional override to enlarge small images
* **Format conversion**

  * Keep original format
  * Convert to JPEG, PNG, or WebP
  * Adjustable quality settings
* **High-quality resizing**

  * Uses [Pica](https://github.com/nodeca/pica) for superior image quality
  * Hardware-accelerated when available (WebAssembly / WebGL)
  * Graceful fallback to canvas API
* **Batch processing**

  * Drag and drop multiple images
  * Download individual results
  * Bulk download as ZIP
* **Accessible**

  * Full keyboard navigation
  * ARIA labels and semantic HTML
  * Screen reader friendly

## Demo

Open `src/popup.html` in a modern browser and try dragging images onto the page.

> Tip: For local development on some browsers you may need to serve files via a simple static server to avoid file URL limitations.

## Usage

1. Open `src/popup.html` in a modern browser.
2. Drag and drop images or click to select files.
3. Choose resize mode and settings.
4. Click **Resize selected** to process.
5. Download individual images or all as ZIP.

## Getting started

Open the app from PowerShell:

```powershell
# Open src/popup.html in your default browser from PowerShell
Start-Process -FilePath (Resolve-Path src/popup.html)
```

No build step is required to run the UI. The app works by opening `src/popup.html`. Node tooling is optional and used for tests and utilities.

## Development

Install dependencies:

```powershell
npm install
```

Run tests:

```powershell
npm test
```

Run tests in watch mode:

```powershell
npm run test:watch
```

Run a local static server for development:

```powershell
npm install -g http-server
http-server src -p 8080
# Then open http://localhost:8080/popup.html
```

## Dependencies

These libraries are loaded from a CDN with fallback handling. For offline use, download and serve them locally.

* **[Pica](https://github.com/nodeca/pica)** v8.0.0 - High-quality image resizing
* **[JSZip](https://github.com/Stuk/jszip)** v3.10.1 - ZIP file creation for batch downloads

## Browser support

Works in modern browsers that support:

* Canvas API
* FileReader API
* ES6+ JavaScript
* Drag and Drop API

Tested on Chrome, Firefox, Safari, and Edge.

## Project structure

```
├── src/
│   ├── popup.html      # Main HTML interface
│   ├── script.js       # Core application logic
│   ├── styles.css      # UI styling
│   └── utils.js        # Utility functions (modular)
├── test/
│   └── utils.test.js   # Unit tests
├── package.json        # npm configuration
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## Technical details

How it works

1. **File input**: Images are loaded using the FileReader API.
2. **Canvas processing**: Images are drawn to HTML canvas elements.
3. **Resize algorithm**: Pica performs high-quality resampling when integrated.
4. **Output**: Processed images are converted to Blobs.
5. **Download**: Blob URLs trigger browser downloads or JSZip bundles.

Resize modes explained

* **Fit**: Never enlarges, only shrinks to fit within bounds.
* **Scale**: Multiply dimensions by percentage.
* **Width/Height**: Set one dimension and calculate the other proportionally.
* **Allow upscaling**: Option to permit enlargement when needed.

## Privacy and security

* No server communication
* No data collection
* No cookies or tracking
* All processing is client-side
* Works offline when dependencies are served locally

## Contributing

1. Fork the repository.
2. Create a branch for your feature or bug fix.
3. Add tests for new behavior where applicable.
4. Open a pull request describing your changes.

Please follow the existing code style and include clear commit messages.

## License

Snap Sizer is released under the MIT License. See `LICENSE` for details.
