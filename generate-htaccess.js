import fs from 'fs';
import path from 'path';

const htaccessContent = `
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
`;

const outputPath = path.join(process.cwd(), 'dist', '.htaccess');

try {
  if (!fs.existsSync(path.join(process.cwd(), 'dist'))) {
    fs.mkdirSync(path.join(process.cwd(), 'dist'));
  }
  fs.writeFileSync(outputPath, htaccessContent.trim());
  console.log('Successfully generated .htaccess in dist folder for SiteGround deployment.');
} catch (error) {
  console.error('Error generating .htaccess:', error);
}
