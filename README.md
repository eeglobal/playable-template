# Webpack Inline Bundle

A comprehensive webpack configuration that merges and minifies all JavaScript, CSS, and image files and inlines them directly into a single `index.html` file with no external dependencies.

## Features

- **Complete Asset Inlining**: All JavaScript, CSS, images, fonts, and other assets are inlined as base64 or embedded directly in the HTML
- **Zero External Dependencies**: The final HTML file is completely self-contained
- **Minification**: JavaScript and CSS are fully minified and optimized
- **Image Optimization**: Images are converted to base64 and inlined
- **SCSS/SASS Support**: Full preprocessing support for SCSS and SASS files
- **Modern JavaScript**: Babel transpilation for ES6+ features
- **Code Splitting**: Intelligent bundling with vendor chunk separation
- **Development Server**: Hot reload during development

## Project Structure

```
project-root/
├── src/
│   ├── index.html          # HTML template
│   ├── index.js            # Main JavaScript entry point
│   ├── utils/
│   │   └── helpers.js      # Utility functions
│   ├── styles/
│   │   ├── main.css        # Main CSS styles
│   │   └── components.scss # SCSS component styles
│   └── assets/
│       ├── logo.png        # Images (will be inlined)
│       └── background.jpg
├── dist/                   # Output directory
├── webpack.config.js       # Webpack configuration
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## Installation

1. Clone or create your project directory
2. Install dependencies:

```bash
npm install
```

## Usage

### Development

Start the development server with hot reload:

```bash
npm start
```

Or build in development mode with watch:

```bash
npm run dev
```

### Production Build

Build the production version with all assets inlined:

```bash
npm run build
```

The output will be in the `dist/` directory. The `index.html` file will contain everything needed to run your application with no external dependencies.

### Clean Build Directory

```bash
npm run clean
```

## Configuration Details

### Key Webpack Features

1. **Asset Inlining**: All assets are converted to `asset/inline` type, ensuring they're embedded as base64
2. **CSS Extraction and Inlining**: CSS is extracted, minified, then inlined into `<style>` tags
3. **JavaScript Inlining**: JavaScript is minified and inlined into `<script>` tags
4. **HTML Minification**: The final HTML is minified and optimized

### Supported File Types

- **JavaScript**: `.js`, `.jsx`
- **CSS**: `.css`
- **SCSS/SASS**: `.scss`, `.sass`
- **Images**: `.png`, `.jpg`, `.jpeg`, `.gif`, `.svg`, `.webp`, `.ico`
- **Fonts**: `.woff`, `.woff2`, `.eot`, `.ttf`, `.otf`
- **Media**: `.mp4`, `.webm`, `.ogg`, `.mp3`, `.wav`, `.flac`, `.aac`

### Optimizations

- **JavaScript Minification**: Uses Terser with console/debugger removal
- **CSS Minification**: Uses CSS Minimizer Plugin
- **HTML Minification**: Removes comments, whitespace, and redundant attributes
- **Tree Shaking**: Dead code elimination
- **Code Splitting**: Vendor and application code separation before inlining

## Customization

### Adding New Asset Types

To support additional file types, add new rules to the webpack configuration:

```javascript
{
  test: /\.(pdf|doc|docx)$/i,
  type: 'asset/inline',
}
```

### Modifying Inlining Behavior

The `InlineAssetsPlugin` class handles CSS inlining. You can modify it to change how assets are embedded.

### Babel Configuration

The current setup includes ES6+ transpilation. Modify the babel-loader options to change transpilation settings:

```javascript
{
  loader: 'babel-loader',
  options: {
    presets: [
      ['@babel/preset-env', { targets: { browsers: ['> 1%'] } }],
      '@babel/preset-react'
    ],
  },
}
```

## File Size Considerations

Since all assets are inlined, the final HTML file can become large. Consider:

- Optimizing images before inlining
- Using SVG instead of raster images when possible
- Compressing assets before bundling
- The webpack configuration disables performance hints due to inlining

## Browser Compatibility

The configuration supports:
- Modern browsers with ES6+ support (via Babel transpilation)
- IE11+ (with additional polyfills if needed)
- Mobile browsers

## Troubleshooting

### Large Bundle Size
If the final HTML is too large:
- Optimize images externally before adding to src/assets
- Consider using SVG icons instead of PNG/JPG
- Remove unused CSS/JavaScript

### Build Errors
- Ensure all imported assets exist in the specified paths
- Check that file extensions match the webpack rules
- Verify all dependencies are installed

### Runtime Errors
- Check browser console for JavaScript errors
- Ensure all modules are properly exported/imported
- Verify that DOM elements exist before accessing them

## License

MIT License - feel free to use this configuration in your projects.