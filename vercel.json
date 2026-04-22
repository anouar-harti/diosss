const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Safe string replace looking closely at known un-handled classes
    content = content.replace(/className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"/g, 
                             'className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100 dark:bg-slate-900"');
                             
    content = content.replace(/className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/g, 
                             'className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100 dark:bg-slate-900"');
                             
    // Add text-slate-100 specifically anywhere we put dark:bg-slate-900 or 800 just in case
    // Already did most in first script, but let's check Checklist inputs too.

    fs.writeFileSync(filePath, content);
}

['App.tsx', 'components/AdminHistory.tsx', 'components/ChecklistReport.tsx', 'components/CheckListPreview.tsx'].forEach(file => {
    if (fs.existsSync(file)) {
        fixFile(file);
    }
});
console.log('Fixed inputs precisely');
