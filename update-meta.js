import fs from 'fs';

const files = ['index.html', 'blog.html', 'guides.html', 'write-for-us.html', 'guide-5-marla.html'];

files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/placeholder-banner\.jpg/g, 'og-banner.png');
    
    if (!content.includes('twitter:card')) {
      content = content.replace(/<\/head>/, '  <meta name="twitter:card" content="summary_large_image">\n</head>');
    }
    if (!content.includes('twitter:image')) {
      content = content.replace(/<\/head>/, '  <meta name="twitter:image" content="https://www.intextify.com/og-banner.png">\n</head>');
    }
    if (!content.includes('og:image')) {
      content = content.replace(/<\/head>/, '  <meta property="og:image" content="https://www.intextify.com/og-banner.png">\n</head>');
    }
    
    fs.writeFileSync(f, content);
  }
});
console.log('Done updating meta tags');
