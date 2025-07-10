const fs = require('fs');
const path = require('path');

function printTree(dir, prefix = '') {
  let items;
  try {
    items = fs.readdirSync(dir);
  } catch (e) {
    console.error(`Cannot access ${dir}:`, e.message);
    return;
  }

  // Filter out node_modules and .git
  items = items.filter(i => i !== 'node_modules' && i !== '.git');

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const fullPath = path.join(dir, item);
    let stat;
    try {
      stat = fs.statSync(fullPath);
    } catch (e) {
      console.error(`Cannot stat ${fullPath}:`, e.message);
      return;
    }

    const connector = isLast ? '└── ' : '├── ';
    console.log(prefix + connector + item);

    if (stat.isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      printTree(fullPath, newPrefix);
    }
  });
}

// Change this to the folder you want to print:
const folderToPrint = process.argv[2] || '.';

printTree(folderToPrint);
