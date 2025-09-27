# Locust Load Testing - Frontend

A React application with Tailwind CSS for file upload functionality.

## Features

- **File Upload Component**: Drag and drop or click to upload files
- **POST /upload**: Sends files to the `/upload` endpoint
- **Modern UI**: Built with Tailwind CSS for a clean, responsive design
- **File Validation**: Shows file details and upload status
- **Error Handling**: Displays success/error messages

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Usage

1. Open the application in your browser (usually `http://localhost:3000`)
2. Drag and drop a file onto the upload area or click to select a file
3. Click "Upload File" to send the file to the `/upload` endpoint
4. View the upload status and response

## API Integration

The application sends POST requests to `/upload` with the following:
- **Content-Type**: `multipart/form-data`
- **Body**: FormData containing the selected file
- **Response**: JSON response displayed in the UI

## Project Structure

```
├── src/
│   ├── components/
│   │   └── FileUpload.jsx    # Main file upload component
│   ├── App.jsx               # Main application component
│   ├── main.jsx             # React entry point
│   └── index.css            # Tailwind CSS imports
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
└── postcss.config.js        # PostCSS configuration
```

## Technologies Used

- **React 18**: Frontend framework
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Build tool and development server
- **Axios**: HTTP client for API requests
