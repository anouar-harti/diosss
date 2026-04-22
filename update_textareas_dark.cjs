const fs = require('fs');

function fixFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    content = content.replace(/className="w-full p-3 border border-slate-300 rounded-xl min-h-\[80px\] focus:ring-2 focus:ring-blue-500 outline-none"/g, 
                             'className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl min-h-[80px] focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100 dark:bg-slate-900"');
                             
    content = content.replace(/className="w-full p-3 border border-slate-300 rounded-xl min-h-\[120px\] focus:ring-2 focus:ring-blue-500 outline-none"/g, 
                             'className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-slate-100 dark:bg-slate-900"');
                             
    fs.writeFileSync(filePath, content);
}

['App.tsx'].forEach(file => {
    if (fs.existsSync(file)) {
        fixFile(file);
    }
});
console.log('Fixed textareas precisely');
