import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to recursively process all .js files in a directory
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Recursively process subdirectories
      processDirectory(filePath);
    } else if (stat.isFile() && file.endsWith('.js')) {
      // Process .js files
      processFile(filePath);
    }
  });
}

// Function to add .js extensions to import/export statements
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Pattern to match relative imports/exports without extensions
  // Matches: import {...} from './filename' or export {...} from './filename'
  const importExportPattern =
    /((?:import\s+[^'"]*\s+from\s+)|(?:export\s+(?:\{[^}]*\}|\*)\s+from\s+))['"]([^'"]+)['"]/g;

  // Add .js extension to relative paths that don't already have an extension
  content = content.replace(
    importExportPattern,
    (match, prefix, importPath) => {
      // Only add .js to relative paths that don't have extensions
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        // Check if the path already has an extension
        if (!path.extname(importPath)) {
          return `${prefix}'${importPath}.js'`;
        }
      }
      return match;
    }
  );

  // Write the modified content back to the file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed: ${filePath}`);
}

// Process the dist/esm directory
const esmDir = path.join(__dirname, '..', 'dist', 'esm');
// if (fs.existsSync(esmDir)) {
//   console.log('Adding .js extensions to ESM files...');
//   processDirectory(esmDir);
//   console.log('Done!');
// } else {
//   console.error('ESM directory not found:', esmDir);
//   process.exit(1);
// }
