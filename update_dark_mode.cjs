const fs = require('fs');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Safety check to avoid double-processing
    if (content.includes('dark:bg-slate-800')) return;

    content = content.replace(/\bbg-white\b(?! dark:bg-)/g, 'bg-white dark:bg-slate-800');
    content = content.replace(/\bbg-slate-50\b(?! dark:bg-)/g, 'bg-slate-50 dark:bg-slate-900');
    content = content.replace(/\bbg-slate-100\b(?! dark:bg-)/g, 'bg-slate-100 dark:bg-slate-800');
    content = content.replace(/\bbg-slate-200\b(?! dark:bg-)/g, 'bg-slate-200 dark:bg-slate-700');
    content = content.replace(/\btext-slate-800\b(?! dark:text-)/g, 'text-slate-800 dark:text-slate-100');
    content = content.replace(/\btext-slate-700\b(?! dark:text-)/g, 'text-slate-700 dark:text-slate-200');
    content = content.replace(/\btext-slate-600\b(?! dark:text-)/g, 'text-slate-600 dark:text-slate-300');
    content = content.replace(/\btext-slate-500\b(?! dark:text-)/g, 'text-slate-500 dark:text-slate-400');
    content = content.replace(/\btext-slate-400\b(?! dark:text-)/g, 'text-slate-400 dark:text-slate-500');
    content = content.replace(/\bborder-slate-200\b(?! dark:border-)/g, 'border-slate-200 dark:border-slate-600');
    content = content.replace(/\bborder-slate-100\b(?! dark:border-)/g, 'border-slate-100 dark:border-slate-700');
    
    fs.writeFileSync(filePath, content);
}

['App.tsx', 'components/AdminHistory.tsx', 'components/ChecklistReport.tsx', 'components/CheckListPreview.tsx'].forEach(file => {
    if (fs.existsSync(file)) {
        processFile(file);
    }
});
console.log('Update complete');
