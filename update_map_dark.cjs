const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/bg-white/g, 'bg-white dark:bg-slate-800');
    content = content.replace(/bg-slate-50/g, 'bg-slate-50 dark:bg-slate-900');
    content = content.replace(/border-slate-100/g, 'border-slate-100 dark:border-slate-700');
    content = content.replace(/border-slate-200/g, 'border-slate-200 dark:border-slate-600');
    content = content.replace(/text-slate-800/g, 'text-slate-800 dark:text-slate-100');
    content = content.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');
    content = content.replace(/text-slate-400/g, 'text-slate-400 dark:text-slate-500');
    
    // Add text color to the input specifically
    content = content.replace(/<input([^>]*?)className="([^"]*?)"([^>]*?)>/g, (match, p1, classes, p2) => {
         let newClasses = classes.trim();
         if (!newClasses.includes('dark:text-')) {
             newClasses += " text-slate-800 dark:text-slate-100";
         }
         return `<input${p1}className="${newClasses}"${p2}>`;
    });

    fs.writeFileSync(filePath, content);
}

['components/MapLocator.tsx'].forEach(file => {
    fixFile(file);
});
console.log('Fixed MapLocator precisely');
