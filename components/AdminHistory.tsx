import React, { useState, useEffect } from 'react';
import { ChevronLeft, FolderClock, ExternalLink, Calendar as CalendarIcon, User, Search, Filter } from 'lucide-react';
import { Report, ReportType } from '../types';
import * as Storage from '../services/storageService';

interface AdminHistoryProps {
    onBack: () => void;
}

const AdminHistory: React.FC<AdminHistoryProps> = ({ onBack }) => {
    const [reports, setReports] = useState<Report[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<ReportType | 'ALL'>('ALL');
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = Storage.subscribeToReports((data) => {
            setReports(data);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredReports = reports.filter(r => {
        // Search filter (text)
        const dateStr = new Date(r.createdAt).toLocaleDateString();
        const matchesSearch = 
            r.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            r.workerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            dateStr.includes(searchTerm) || // Permite buscar tecleando "21/04"
            (r.refCode && r.refCode.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Type filter (Job vs Checklist)
        const matchesType = filterType === 'ALL' || r.type === filterType;
        
        // Date range filters (Desde - Hasta)
        let matchesDates = true;
        if (startDate || endDate) {
            const reportDate = new Date(r.createdAt);
            reportDate.setHours(0, 0, 0, 0); // Normalize to start of day for accurate comparison
            
            if (startDate) {
                const sDate = new Date(startDate);
                sDate.setHours(0, 0, 0, 0);
                if (reportDate < sDate) matchesDates = false;
            }
            if (endDate) {
                const eDate = new Date(endDate);
                eDate.setHours(23, 59, 59, 999);
                if (reportDate > eDate) matchesDates = false;
            }
        }
        
        return matchesSearch && matchesType && matchesDates;
    });

    return (
        <div className="space-y-6 animate-fadeIn pb-24">
            <div className="flex flex-col gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="bg-slate-100 p-2 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <FolderClock size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Historial Centralizado</h2>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por cliente, instalación o REF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(['ALL', 'JOB', 'CHECKLIST'] as const).map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                                    filterType === type 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {type === 'ALL' ? 'Todos' : type === 'JOB' ? 'Partes' : 'Checklists'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Filters */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-semibold text-slate-500 w-12">Desde:</span>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm font-semibold text-slate-500 w-12">Hasta:</span>
                        <input 
                            type="date" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-700"
                        />
                    </div>
                    {/* Clear Dates Button */}
                    {(startDate || endDate) && (
                        <button 
                            onClick={() => { setStartDate(""); setEndDate(""); }}
                            className="text-sm font-bold text-slate-500 hover:text-red-500 px-3 transition-colors"
                        >
                            Limpiar fechas
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center py-10 text-slate-400 animate-pulse">
                        Cargando historial...
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center shadow-sm">
                        <FolderClock size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700">No hay registros</h3>
                        <p className="text-slate-500">No se encontraron reportes con los filtros actuales.</p>
                    </div>
                ) : (
                    filteredReports.map((report) => (
                        <div key={report.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl flex-shrink-0 ${report.type === 'JOB' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                    {report.type === 'JOB' ? <FolderClock size={24} /> : <Filter size={24} />}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-slate-800 text-lg">
                                            {report.clientName || 'Cliente no especificado'}
                                        </h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${report.type === 'JOB' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                            {report.type === 'JOB' ? 'Parte Trabajo' : 'Check List'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">
                                        {report.description || 'Sin descripción adicional'}
                                    </p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <User size={14} /> Instalador: {report.workerName || 'N/A'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <CalendarIcon size={14} /> 
                                            {new Date(report.createdAt).toLocaleDateString()} {new Date(report.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                        {report.refCode && (
                                            <span className="font-mono text-slate-400">Ref: {report.refCode}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <a 
                                href={report.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 text-blue-600 border border-slate-200 rounded-xl font-bold hover:bg-blue-50 hover:border-blue-200 transition-colors shrink-0"
                            >
                                Ver PDF <ExternalLink size={18} />
                            </a>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminHistory;
