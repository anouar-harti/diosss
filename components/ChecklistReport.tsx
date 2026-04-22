import React, { useState } from 'react';
import { 
    User, 
    FileSignature, 
    ChevronRight, 
    ChevronLeft, 
    CheckCircle2, 
    Eye, 
    Download, 
    Mail, 
    FileText, 
    CheckSquare
} from 'lucide-react';
import jsPDF from 'jspdf';
import SignaturePad from './SignaturePad';
import { User as UserType, ChecklistStep } from '../types';
import * as Storage from '../services/storageService';

interface ChecklistReportProps {
    currentUser: UserType | null;
    onBack: () => void;
    companyLogoUrl: string;
    logoError: boolean;
}

type RadioCheck = 'Sí' | 'No' | 'N/A' | '';

interface ChecklistState {
    presente_instalador: { value: RadioCheck, reason: string };
    potencia_correcta: { value: RadioCheck, reason: string };
    mantenimiento_correcto: { value: RadioCheck, reason: string };
    diametro_tuberias: { value: string, reason: string };
    ubicacion_correcta: { value: RadioCheck, reason: string };
    bus_correcto: { value: RadioCheck, reason: string };
    carga_correcta: { value: RadioCheck, reason: string };
    temperatura_aire: { value: string, reason: string };
    presion_gas: { value: string, reason: string };
    frigorifica_correcta: { value: RadioCheck, reason: string };
    desagues_correcta: { value: RadioCheck, reason: string };
    hidraulica_correcta: { value: RadioCheck, reason: string };
    voltaje: { value: string, reason: string };
    consumo: { value: string, reason: string };
    comentarios: { value: string, reason: string };
}

const initialChecklistState: ChecklistState = {
    presente_instalador: { value: '', reason: '' },
    potencia_correcta: { value: '', reason: '' },
    mantenimiento_correcto: { value: '', reason: '' },
    diametro_tuberias: { value: '', reason: '' },
    ubicacion_correcta: { value: '', reason: '' },
    bus_correcto: { value: '', reason: '' },
    carga_correcta: { value: '', reason: '' },
    temperatura_aire: { value: '', reason: '' },
    presion_gas: { value: '', reason: '' },
    frigorifica_correcta: { value: '', reason: '' },
    desagues_correcta: { value: '', reason: '' },
    hidraulica_correcta: { value: '', reason: '' },
    voltaje: { value: '', reason: '' },
    consumo: { value: '', reason: '' },
    comentarios: { value: '', reason: '' },
};

const ChecklistReport: React.FC<ChecklistReportProps> = ({ currentUser, onBack, companyLogoUrl, logoError }) => {
    const [step, setStep] = useState<ChecklistStep>(ChecklistStep.INSTALLER);
    const [installerName, setInstallerName] = useState(currentUser?.fullName || currentUser?.username || '');
    const [data, setData] = useState<ChecklistState>(initialChecklistState);
    const [workerSignature, setWorkerSignature] = useState<string | null>(null);
    const [clientSignature, setClientSignature] = useState<string | null>(null);
    const [clientName, setClientName] = useState("");
    const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleNext = () => {
        if (step === ChecklistStep.INSTALLER) setStep(ChecklistStep.FORM);
        else if (step === ChecklistStep.FORM) setStep(ChecklistStep.SIGNATURE);
        else if (step === ChecklistStep.SIGNATURE) setStep(ChecklistStep.REVIEW);
    };

    const handleBack = () => {
        if (step === ChecklistStep.FORM) setStep(ChecklistStep.INSTALLER);
        else if (step === ChecklistStep.SIGNATURE) setStep(ChecklistStep.FORM);
        else if (step === ChecklistStep.REVIEW) setStep(ChecklistStep.SIGNATURE);
        else onBack();
    };

    const updateField = (field: keyof ChecklistState, value: string, isReason: boolean = false) => {
        setData(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                [isReason ? 'reason' : 'value']: value
            }
        }));
    };

    const createPDFDocument = async () => {
        const doc = new jsPDF();
        
        // Brand Colors matched to logo
        const colorPrimary = [0, 174, 239];    // Cyan from logo
        const colorAccent = [249, 115, 22];    // Orange from logo
        const colorDark = [30, 41, 59];        // Slate 800 - professional dark text
        const colorLight = [241, 245, 249];    // Slate 100
    
        doc.setDrawColor(226, 232, 240); // very light slate
        doc.setLineWidth(0.5);
        doc.line(15, 45, 195, 45); 
    
        let titleX = 15;
        if (!logoError && companyLogoUrl) {
            try {
                // Determine format
                const isPng = companyLogoUrl.includes('data:image/png') || companyLogoUrl.endsWith('.png');
                const format = isPng ? 'PNG' : 'JPEG';
                
                doc.addImage(companyLogoUrl, format, 15, 5, 35, 35); 
                titleX = 55;
            } catch (e) {
                console.warn("Could not load logo for PDF. Skipping image.", e);
                titleX = 15;
            }
        }
    
        doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        doc.text("HARTI", titleX, 20);
        doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]); 
        doc.text("ELECTROCOOL", titleX, 30);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); 
        doc.setFont("helvetica", "normal");
        doc.text("CLIMATIZACIÓN Y SERVICIOS TÉCNICOS", titleX, 38);
    
        doc.setFontSize(18);
        doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        doc.text("CHECK LIST", 195, 20, { align: "right" });
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); 
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 195, 30, { align: "right" });
        doc.text(`Ref: CL-${Date.now().toString().slice(-6)}`, 195, 36, { align: "right" });
    
        let y = 55;
    
        doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
        doc.roundedRect(15, y, 180, 20, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text("INSTALADOR RESPONSABLE", 20, y + 6);
        doc.setFontSize(12);
        doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        doc.setFont("helvetica", "bold");
        doc.text(installerName || "No especificado", 20, y + 14);

        y += 28;

        const printRow = (label: string, field: keyof ChecklistState) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
            doc.text(label, 15, y);
            
            const val = data[field].value || "N/A";
            doc.setFont("helvetica", "normal");
            doc.text(val, 15, y + 6);
            
            y += 12;

            if (data[field].reason && (val === 'No' || val === 'N/A')) {
                doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
                doc.setFontSize(9);
                doc.text(`Motivo: ${data[field].reason}`, 15, y - 2);
                y += 6;
            }
        };

        const printTextRow = (label: string, field: keyof ChecklistState) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
            doc.text(label, 15, y);
            
            let val = data[field].value;
            if (!val || val.trim() === "") val = "-";
            doc.setFont("helvetica", "normal");
            
            const splitObj = doc.splitTextToSize(val, 180);
            doc.text(splitObj, 15, y + 6);
            
            y += 6 + (splitObj.length * 5);
        };

        printRow("* Esta presente el instalador:", "presente_instalador");
        printRow("* Instalación de potencia eléctrica correcta:", "potencia_correcta");
        printRow("* Estado de mantenimiento correcto:", "mantenimiento_correcto");
        printRow("* Ubicación de máquinas correcta:", "ubicacion_correcta");
        printRow("* Instalación de bus comunicación correcta:", "bus_correcto");
        printRow("* Carga refrigerante correcta:", "carga_correcta");
        printRow("* Instalación frigorífica correcta:", "frigorifica_correcta");
        printRow("* Instalación de desagües correcta:", "desagues_correcta");
        printRow("* Instalación hidráulica correcta:", "hidraulica_correcta");

        y += 5;
        doc.setDrawColor(220, 220, 220);
        doc.line(15, y, 195, y);
        y += 10;

        printTextRow("* Diámetro tuberías Gas/Líquido:", "diametro_tuberias");
        printTextRow("* Temperatura entrada y salida de aire:", "temperatura_aire");
        printTextRow("* Presión de gas Alta/Baja:", "presion_gas");
        printTextRow("* Voltaje de alimentación:", "voltaje");
        printTextRow("* Consumo eléctrico:", "consumo");
        printTextRow("Comentarios:", "comentarios");

        // Signatures Page
        doc.addPage();
        
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        doc.text("FIRMAS", 105, 30, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        doc.text("Firma del Trabajador:", 30, 60);
        if (workerSignature) {
            doc.addImage(workerSignature, 'PNG', 20, 65, 70, 35);
        } else {
            doc.text("(No firmada)", 30, 90);
        }

        doc.text(`Firma del Cliente:`, 120, 60);
        doc.setFont("helvetica", "bold");
        doc.text(clientName || 'Sin especificar', 120, 65);
        doc.setFont("helvetica", "normal");

        if (clientSignature) {
            doc.addImage(clientSignature, 'PNG', 110, 70, 70, 35);
        } else {
            doc.text("(No firmada)", 120, 90);
        }

        const pageHeight = doc.internal.pageSize.height;
        doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
        doc.rect(0, pageHeight - 20, 210, 20, 'F');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("HARTI ELECTROCOOL CLIMATIZACIÓN Y SERVICIOS TÉCNICOS", 105, pageHeight - 12, { align: "center" });
        doc.text("Documento generado digitalmente con ClimaTrack Pro", 105, pageHeight - 7, { align: "center" });

        return doc;
    };

    const handlePreviewPDF = async () => {
        const doc = await createPDFDocument();
        const blobUrl = doc.output('bloburl');
        setPreviewPdfUrl(blobUrl.toString());
    };

    const generatePDF = async () => {
        const doc = await createPDFDocument();
        doc.save(`CheckList_Harti_${Date.now().toString().slice(-6)}.pdf`);
    };

    const handleShareEmail = async () => {
        const doc = await createPDFDocument();
        const fileName = `CheckList_Harti_${Date.now().toString().slice(-6)}.pdf`;
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    files: [file],
                    title: "Check List Harti Electrocool",
                    text: "Adjunto Check List."
                });
                return;
            } catch (e) {
                console.log(e);
            }
        }
        doc.save(fileName);
    };

    // --- Render Elements ---
    const renderRadioGroup = (label: string, field: keyof ChecklistState) => {
        const val = data[field].value;
        const needsReason = val === 'No' || val === 'N/A';
        return (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                <label className="block font-bold text-slate-700 mb-2">{label}</label>
                <div className="flex gap-4 mb-2">
                    {['Sí', 'No', 'N/A'].map(opt => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="radio" 
                                name={field} 
                                value={opt} 
                                checked={val === opt}
                                onChange={(e) => updateField(field, e.target.value)}
                                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-slate-600">{opt}</span>
                        </label>
                    ))}
                </div>
                {needsReason && (
                    <div className="mt-3 animate-fadeIn">
                        <input 
                            type="text" 
                            placeholder="Motivo (opcional)"
                            value={data[field].reason}
                            onChange={(e) => updateField(field, e.target.value, true)}
                            className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                )}
            </div>
        );
    };

    const renderTextGroup = (label: string, field: keyof ChecklistState, placeholder: string = "Escriba aquí...") => {
        return (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                <label className="block font-bold text-slate-700 mb-2">{label}</label>
                <input 
                    type="text" 
                    placeholder={placeholder}
                    value={data[field].value}
                    onChange={(e) => updateField(field, e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-24">
            {/* Header / Nav */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <button 
                  onClick={handleBack}
                  className="bg-slate-100 p-2 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-800">Check List</h2>
                    <p className="text-sm text-slate-500">
                        {step === ChecklistStep.INSTALLER && "Datos del Instalador"}
                        {step === ChecklistStep.FORM && "Verificación de Tareas"}
                        {step === ChecklistStep.SIGNATURE && "Firmas"}
                        {step === ChecklistStep.REVIEW && "Enviar Documento"}
                    </p>
                </div>
            </div>

            {/* Steps Rendering */}
            {step === ChecklistStep.INSTALLER && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase">Nombre del Instalador</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                              type="text" 
                              value={installerName}
                              onChange={(e) => setInstallerName(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                              placeholder="Nombre y Apellidos"
                            />
                        </div>
                    </div>
                </div>
            )}

            {step === ChecklistStep.FORM && (
                <div className="space-y-2">
                    {renderRadioGroup("* Esta presente el instalador:", "presente_instalador")}
                    {renderRadioGroup("* Instalación de potencia eléctrica correcta:", "potencia_correcta")}
                    {renderRadioGroup("* Estado de mantenimiento correcto:", "mantenimiento_correcto")}
                    {renderRadioGroup("* Ubicación de máquinas correcta:", "ubicacion_correcta")}
                    {renderRadioGroup("* Instalación de bus comunicación correcta:", "bus_correcto")}
                    {renderRadioGroup("* Carga refrigerante correcta:", "carga_correcta")}
                    {renderRadioGroup("* Instalación frigorífica correcta:", "frigorifica_correcta")}
                    {renderRadioGroup("* Instalación de desagües correcta:", "desagues_correcta")}
                    {renderRadioGroup("* Instalación hidráulica correcta:", "hidraulica_correcta")}

                    <h3 className="text-lg font-bold text-slate-800 mt-6 mb-2">Mediciones y Datos</h3>
                    {renderTextGroup("* Diámetro tuberías Gas/Líquido:", "diametro_tuberias")}
                    {renderTextGroup("* Temperatura entrada y salida de aire unidad interior:", "temperatura_aire")}
                    {renderTextGroup("* Presión de gas Alta/Baja:", "presion_gas")}
                    {renderTextGroup("* Voltaje de alimentación:", "voltaje")}
                    {renderTextGroup("* Consumo eléctrico:", "consumo")}
                    {renderTextGroup("Comentarios:", "comentarios", "Observaciones adicionales...")}
                </div>
            )}

            {step === ChecklistStep.SIGNATURE && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <label className="block font-bold text-slate-700 mb-2">Firma del Trabajador/Instalador</label>
                        {workerSignature ? (
                             <div className="space-y-3">
                                 <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex justify-center">
                                     <img src={workerSignature} alt="Firma Trabajador" className="h-32 object-contain" />
                                 </div>
                                 <button 
                                     onClick={() => setWorkerSignature(null)}
                                     className="text-red-500 text-sm font-semibold hover:underline w-full text-center"
                                 >
                                     <span className="flex items-center justify-center gap-1"><CheckCircle2 size={16}/> Borrar y firmar de nuevo</span>
                                 </button>
                             </div>
                        ) : (
                             <SignaturePad onSave={setWorkerSignature} />
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <label className="block font-bold text-slate-700 mb-4 text-center">Datos y Firma del Cliente</label>
                        <div className="mb-4">
                            <input 
                              type="text" 
                              value={clientName}
                              onChange={(e) => setClientName(e.target.value)}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-center font-semibold"
                              placeholder="Nombre Apellidos / Empresa (Cliente)"
                            />
                        </div>
                        {clientSignature ? (
                             <div className="space-y-3">
                                 <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex justify-center">
                                     <img src={clientSignature} alt="Firma Cliente" className="h-32 object-contain" />
                                 </div>
                                 <button 
                                     onClick={() => setClientSignature(null)}
                                     className="text-red-500 text-sm font-semibold hover:underline w-full text-center"
                                 >
                                     <span className="flex items-center justify-center gap-1"><CheckCircle2 size={16}/> Borrar y firmar de nuevo</span>
                                 </button>
                             </div>
                        ) : (
                             <SignaturePad onSave={setClientSignature} />
                        )}
                    </div>
                </div>
            )}

            {step === ChecklistStep.REVIEW && (
                <div className="space-y-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center py-10">
                        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
                            <CheckSquare size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Check List Lista</h2>
                        <p className="text-slate-500 text-center mb-8 max-w-sm">
                            La verificación ha sido completada y está lista para generarse como documento PDF.
                        </p>
                        
                        <div className="w-full flex flex-col gap-3">
                           <button 
                               onClick={handlePreviewPDF}
                               className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors"
                           >
                               <Eye size={20} /> Previsualizar PDF
                           </button>

                           <button 
                               onClick={generatePDF}
                               className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                           >
                               <Download size={20} /> Guardar Presupuesto/Checklist
                           </button>

                           <button 
                               onClick={handleShareEmail}
                               className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white font-bold py-4 rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200"
                           >
                               <Mail size={20} /> Enviar / Compartir
                           </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Nav */}
            {step !== ChecklistStep.REVIEW && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-safe flex justify-between z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                    <div className="max-w-3xl justify-between mx-auto w-full flex">
                        <button 
                            onClick={handleBack}
                            className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                        >
                            Volver
                        </button>
                        {step === ChecklistStep.SIGNATURE ? (
                            <button 
                                onClick={() => {
                                    // 1. Saltar de inmediato a la siguiente pantalla
                                    setStep(ChecklistStep.REVIEW);
                                    
                                    // 2. Ejecutar la subida a Firebase en segundo plano
                                    createPDFDocument().then(doc => {
                                        const blob = doc.output('blob');
                                        
                                        Storage.saveReport({
                                            type: 'CHECKLIST',
                                            clientName: clientName || "Consumidor Final",
                                            workerName: installerName || currentUser?.fullName || currentUser?.username || 'Desconocido',
                                            createdAt: Date.now(),
                                            description: `Checklist Técnico - ${clientName || 'General'}`,
                                            refCode: "CL-" + Date.now().toString().slice(-6)
                                        }, blob).catch(e => console.error("Error al subir Checklist a Firebase:", e));
                                        
                                    }).catch(e => console.error("Error al generar PDF de Checklist:", e));
                                }}
                                disabled={!workerSignature || !clientSignature}
                                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 disabled:bg-slate-300 transition-colors"
                            >
                                Finalizar y Guardar <CheckCircle2 size={20} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleNext}
                                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition-colors"
                            >
                                Continuar <ChevronRight size={20} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {previewPdfUrl && (
                <div className="fixed inset-0 z-[100] bg-slate-900 bg-opacity-90 flex flex-col p-2 md:p-6 backdrop-blur-sm">
                    <div className="w-full max-w-5xl mx-auto h-full bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                        <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200">
                            <h3 className="font-bold text-slate-700">Vista Previa del Check List</h3>
                            <button onClick={() => setPreviewPdfUrl(null)}>Cerrar</button>
                        </div>
                        <iframe src={previewPdfUrl} className="w-full h-full border-0" title="Check List PDF" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChecklistReport;
