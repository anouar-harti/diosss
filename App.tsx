import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck, 
  MapPin, 
  Clock, 
  PenTool, 
  FileText, 
  Wand2, 
  Download, 
  Mail, 
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  User,
  HardHat,
  Package,
  Euro,
  Coins,
  LogOut,
  Users,
  ListTodo,
  PlusCircle,
  ShieldCheck,
  Lock,
  Briefcase,
  Trash2,
  Clock3,
  Smartphone,
  Camera,
  Image as ImageIcon,
  Eye,
  X,
  FolderClock
} from 'lucide-react';
import jsPDF from 'jspdf';
import Timer from './components/Timer';
import MapLocator from './components/MapLocator';
import SignaturePad from './components/SignaturePad';
import ChecklistReport from './components/ChecklistReport';
import AdminHistory from './components/AdminHistory';
import { enhanceJobDescription } from './services/geminiService';
import { JobData, AppStep, Coordinates, AppView, User as UserType, Task, UserRole } from './types';
import * as Storage from './services/storageService';

// Base64 Logo (Snowflake/Gear icon for HVAC)
const COMPANY_LOGO_URL = "/logo.png";
const COMPANY_LOGO_BASE64 = "";

// --- Extracted Component for Worker Tasks to respect React Hook Rules ---
interface WorkerTasksProps {
  currentUser: UserType | null;
  onBack: () => void;
  onStartReport: (task: Task) => void;
}

const WorkerTasks: React.FC<WorkerTasksProps> = ({ currentUser, onBack, onStartReport }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  useEffect(() => {
      if (currentUser) {
          // Subscribe to real-time updates for this worker
          const unsubscribe = Storage.subscribeToWorkerTasks(currentUser.username, (updatedTasks) => {
              setTasks(updatedTasks);
          });
          return () => unsubscribe();
      }
  }, [currentUser]);

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
      await Storage.updateTaskStatus(taskId, !currentStatus);
      // No need to setTasks manually, the subscription will handle it!
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
         <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="bg-white p-2 rounded-full shadow-sm text-slate-500">
                <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-800">Mis Tareas Pendientes</h2>
        </div>

        <div className="space-y-4">
            {tasks.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <ListTodo size={48} className="mx-auto mb-2 opacity-50"/>
                    <p>No tienes trabajos asignados por el momento.</p>
                </div>
            ) : (
                tasks.map(task => (
                    <div 
                        key={task.id} 
                        className={`p-5 rounded-2xl border transition-all ${
                            task.isCompleted 
                            ? 'bg-green-50 border-green-200 shadow-sm' 
                            : 'bg-white border-slate-200 shadow-sm'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className={`font-bold text-lg ${task.isCompleted ? 'text-green-800' : 'text-slate-800'}`}>
                                {task.title}
                            </h3>
                            <button 
                                onClick={() => toggleTask(task.id, task.isCompleted)}
                                className={`p-2 rounded-full transition-colors ${
                                    task.isCompleted 
                                    ? 'bg-green-200 text-green-700' 
                                    : 'bg-slate-100 text-slate-400 hover:bg-green-100 hover:text-green-600'
                                }`}
                            >
                                <CheckCircle2 size={24} />
                            </button>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                            <MapPin size={14} /> {task.location}
                        </div>
                        
                        <p className="text-slate-600 text-sm mb-4 bg-white/50 p-2 rounded-lg">
                            {task.description}
                        </p>
                        
                        {task.isCompleted ? (
                            <div className="text-xs font-bold text-green-600 flex items-center gap-1">
                                <ShieldCheck size={12} /> COMPLETADO
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                 {/* Shortcut to start a report for this task */}
                                 <button 
                                    onClick={() => onStartReport(task)}
                                    className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                                 >
                                    Iniciar Parte
                                 </button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
  );
};

const App: React.FC = () => {
  // --- Global Navigation & Auth State ---
  const [view, setView] = useState<AppView>(AppView.LOGIN);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  
  // --- Auth Inputs ---
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  // --- Admin: User Management State ---
  const [newUserUser, setNewUserUser] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserFullname, setNewUserFullname] = useState("");
  const [userMsg, setUserMsg] = useState("");
  
  // --- Admin: Lists State (Now Real-Time) ---
  const [adminUsersList, setAdminUsersList] = useState<UserType[]>([]);
  const [adminTasksList, setAdminTasksList] = useState<Task[]>([]);
  
  // Cache users for login check
  const [cachedUsers, setCachedUsers] = useState<UserType[]>([]);

  // --- Admin: Task Management State ---
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskLoc, setNewTaskLoc] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");
  const [taskMsg, setTaskMsg] = useState("");

  // --- Job Report State (Original App State) ---
  const [step, setStep] = useState<AppStep>(AppStep.IDLE);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState("");
  const [price, setPrice] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [workerName, setWorkerName] = useState("");
  const [manualAddress, setManualAddress] = useState("");
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [workerSignature, setWorkerSignature] = useState<string | null>(null);
  const [photoBefore, setPhotoBefore] = useState<string | null>(null);
  const [photoAfter, setPhotoAfter] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // --- NEW: Pause State ---
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<Date | null>(null);
  const [totalPausedMs, setTotalPausedMs] = useState(0);

  // --- NEW: Splash State ---
  const [showSplash, setShowSplash] = useState(true);

  // --- NEW: PWA Install State ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // --- Effects ---

  // Splash Screen Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3200); // Wait 3.2s total (3s animation + 0.2s padding)
    return () => clearTimeout(timer);
  }, []);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Always subscribe to users to have them ready for login and admin views
  useEffect(() => {
    const unsubscribe = Storage.subscribeToUsers((users) => {
        setAdminUsersList(users);
        setCachedUsers(users); // Keep a copy for login validation
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to all tasks only if admin
  useEffect(() => {
      if (currentUser?.role === 'ADMIN') {
          const unsubscribe = Storage.subscribeToAllTasks((tasks) => {
            setAdminTasksList(tasks);
          });
          return () => unsubscribe();
      }
  }, [currentUser]);

  // Auto-fill worker name if logged in
  useEffect(() => {
    if (currentUser) {
      setWorkerName(currentUser.fullName);
    }
  }, [currentUser]);


  // --- Auth Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    // Admin Hardcoded Check
    if (loginUser === "admin" && loginPass === "123456789") {
        setCurrentUser({ username: "admin", role: "ADMIN", fullName: "Administrador" });
        setView(AppView.DASHBOARD);
        return;
    }

    // Check against Real-Time Users list
    const found = cachedUsers.find(u => u.username === loginUser && u.password === loginPass);
    
    if (found) {
        setCurrentUser(found);
        setView(AppView.DASHBOARD);
    } else {
        setLoginError("Usuario o contraseña incorrectos, o cargando datos...");
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginUser("");
    setLoginPass("");
    setView(AppView.LOGIN);
    // Reset Report State
    setStep(AppStep.IDLE);
    setStartTime(null);
    setEndTime(null);
    setDescription("");
    setMaterials("");
    setPrice("");
    setClientName("");
    setClientEmail("");
    setWorkerName(""); 
    setManualAddress("");
    setLocation(null);
    setSignature(null);
    setWorkerSignature(null);
    setPhotoBefore(null);
    setPhotoAfter(null);
    setPreviewPdfUrl(null);
    setShowLogoutConfirm(false);
    // Reset Pause State
    setIsPaused(false);
    setPauseStartTime(null);
    setTotalPausedMs(0);
  };

  // --- Admin Handlers ---
  const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newUserUser || !newUserPass || !newUserFullname) return;
      
      const success = await Storage.createUser({
          username: newUserUser.trim(),
          password: newUserPass.trim(),
          fullName: newUserFullname.trim(),
          role: 'WORKER'
      });

      if (success) {
          setUserMsg("Usuario creado correctamente.");
          setNewUserUser("");
          setNewUserPass("");
          setNewUserFullname("");
          setTimeout(() => setUserMsg(""), 3000);
      } else {
          setUserMsg("El usuario ya existe.");
      }
  };

  const handleDeleteUser = async (e: React.MouseEvent, username: string) => {
      e.preventDefault();
      e.stopPropagation(); 
      
      if (window.confirm(`¿Seguro que quieres eliminar al usuario ${username}?`)) {
          await Storage.deleteUser(username);
          // UI updates automatically thanks to subscription!
      }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!newTaskTitle || !newTaskAssignee) return;

      const newTask: Task = {
          id: Date.now().toString(),
          title: newTaskTitle,
          location: newTaskLoc,
          description: newTaskDesc,
          assignedTo: newTaskAssignee,
          createdBy: currentUser?.username || 'admin',
          isCompleted: false,
          createdAt: Date.now()
      };

      await Storage.createTask(newTask);
      setTaskMsg("Trabajo subido a la nube.");
      setNewTaskTitle("");
      setNewTaskLoc("");
      setNewTaskDesc("");
      setTimeout(() => setTaskMsg(""), 3000);
  };

  const handleDeleteTask = async (taskId: string) => {
      if(window.confirm("¿Estás seguro de que quieres eliminar esta asignación?")) {
          await Storage.deleteTask(taskId);
      }
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    setDeferredPrompt(null);
  };

  // --- Job Report Handlers ---
  const handleStartJob = () => {
    setStartTime(new Date());
    setStep(AppStep.WORKING);
    // Reset pauses for new job
    setIsPaused(false);
    setPauseStartTime(null);
    setTotalPausedMs(0);
  };

  const handleStopJob = () => {
    setEndTime(new Date());
    setStep(AppStep.DETAILS);
    // If stopped while paused, calculate the final chunk
    if (isPaused && pauseStartTime) {
        const now = new Date();
        const diff = now.getTime() - pauseStartTime.getTime();
        setTotalPausedMs(prev => prev + diff);
        setIsPaused(false);
    }
  };

  // --- Pause / Resume Handlers ---
  const handlePauseJob = () => {
      setIsPaused(true);
      setPauseStartTime(new Date());
  };

  const handleResumeJob = () => {
      if (pauseStartTime) {
          const now = new Date();
          const diff = now.getTime() - pauseStartTime.getTime();
          setTotalPausedMs(prev => prev + diff);
      }
      setIsPaused(false);
      setPauseStartTime(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onloadend = () => {
          setter(reader.result as string);
      };
      reader.readAsDataURL(file);
  };

  const handleEnhanceDescription = async () => {
    if (!description) return;
    setIsEnhancing(true);
    const improved = await enhanceJobDescription(description);
    setDescription(improved);
    setIsEnhancing(false);
  };

  const createPDFDocument = async () => {
    const doc = new jsPDF();
    
    // Brand Colors matched to logo
    const colorPrimary = [0, 174, 239];    // Cyan from logo
    const colorAccent = [249, 115, 22];    // Orange from logo
    const colorDark = [30, 41, 59];        // Slate 800 - professional dark text
    const colorLight = [241, 245, 249];    // Slate 100

    // Replaced blue filled rectangle with an elegant white header
    // Just an accent line at the bottom of the header area instead
    doc.setDrawColor(226, 232, 240); // very light slate
    doc.setLineWidth(0.5);
    doc.line(15, 45, 195, 45); 

    let titleX = 15;
    if (!logoError) {
        try {
            const img = new Image();
            img.src = COMPANY_LOGO_URL;
            img.crossOrigin = "Anonymous";
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            // Try adding the HTMLImageElement to PDF
            doc.addImage(img, 'PNG', 15, 5, 35, 35); // slightly bigger to look nice
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
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.setFont("helvetica", "normal");
    doc.text("CLIMATIZACIÓN Y SERVICIOS TÉCNICOS", titleX, 38);

    doc.setFontSize(18);
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
    doc.text("PARTE DE TRABAJO", 195, 20, { align: "right" });
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 195, 30, { align: "right" });
    doc.text(`Ref: ${Date.now().toString().slice(-6)}`, 195, 36, { align: "right" });

    let y = 60;

    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
    doc.roundedRect(15, y, 85, 35, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("TÉCNICO RESPONSABLE", 20, y + 8);
    doc.setFontSize(12);
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
    doc.setFont("helvetica", "bold");
    doc.text(workerName || "No especificado", 20, y + 18);
    
    doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
    doc.roundedRect(110, y, 85, 35, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("CLIENTE", 115, y + 8);
    doc.setFontSize(12);
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
    doc.setFont("helvetica", "bold");
    doc.text(clientName || "No especificado", 115, y + 18);
    
    if (clientEmail) {
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(clientEmail, 115, y + 24);
    }

    y += 45;

    doc.setDrawColor(colorAccent[0], colorAccent[1], colorAccent[2]);
    doc.setLineWidth(1);
    doc.line(15, y, 195, y);
    doc.setFontSize(11);
    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.setFont("helvetica", "bold");
    doc.text("DETALLES DE TIEMPO Y UBICACIÓN", 15, y - 3);
    
    y += 10;
    
    let duration = "0h 0m";
    if (startTime && endTime) {
        // Calculate effective work time: Total Span - Pauses
        const totalSpan = endTime.getTime() - startTime.getTime();
        const effectiveWorkMs = Math.max(0, totalSpan - totalPausedMs);
        
        const diffHrs = Math.floor(effectiveWorkMs / 3600000);
        const diffMins = Math.floor((effectiveWorkMs % 3600000) / 60000);
        duration = `${diffHrs}h ${diffMins}m`;
    }

    doc.setFontSize(10);
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
    doc.setFont("helvetica", "normal");

    doc.text("Inicio:", 20, y);
    doc.setFont("helvetica", "bold");
    doc.text(startTime?.toLocaleTimeString().slice(0,5) || "--:--", 50, y);
    doc.setFont("helvetica", "normal");
    
    doc.text("Fin:", 80, y);
    doc.setFont("helvetica", "bold");
    doc.text(endTime?.toLocaleTimeString().slice(0,5) || "--:--", 100, y);
    doc.setFont("helvetica", "normal");

    doc.text("Trabajo Real:", 130, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
    doc.text(duration, 160, y);
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
    
    if (totalPausedMs > 0) {
        y += 6;
        const pauseMins = Math.floor(totalPausedMs / 60000);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`(Se descontaron ${pauseMins} min de descanso)`, 130, y);
    }

    y += 12;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
    doc.text("Ubicación:", 20, y);
    doc.setFont("helvetica", "bold");
    
    let addressText = manualAddress;
    if (!addressText && location) {
        addressText = `Coordenadas GPS: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    }
    if (!addressText) addressText = "No especificada";
    
    doc.text(addressText, 50, y);
    
    if (location) {
        y += 7;
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
        doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        doc.setFontSize(9);
        doc.textWithLink("(Ver en Google Maps)", 50, y, { url: mapUrl });
    }

    y += 20;

    if (materials) {
        doc.setDrawColor(colorAccent[0], colorAccent[1], colorAccent[2]);
        doc.line(15, y, 195, y);
        doc.setFontSize(11);
        doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        doc.setFont("helvetica", "bold");
        doc.text("MATERIALES UTILIZADOS", 15, y - 3);

        y += 10;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        
        const splitMat = doc.splitTextToSize(materials, 180);
        doc.text(splitMat, 15, y);
        y += (splitMat.length * 6) + 15;
    }
    
    doc.setDrawColor(colorAccent[0], colorAccent[1], colorAccent[2]);
    doc.line(15, y, 195, y);
    doc.setFontSize(11);
    doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
    doc.setFont("helvetica", "bold");
    doc.text("INFORME TÉCNICO", 15, y - 3);

    y += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    const splitDesc = doc.splitTextToSize(description, 180);
    doc.text(splitDesc, 15, y);
    
    y += (splitDesc.length * 6) + 15;

    if (price) {
        if (y > 200) { doc.addPage(); y = 40; }

        doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
        doc.roundedRect(130, y, 65, 20, 2, 2, 'F');
        
        doc.setFontSize(12);
        doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL:", 135, y + 13);
        
        doc.setFontSize(16);
        doc.setTextColor(colorAccent[0], colorAccent[1], colorAccent[2]);
        doc.text(`${price} €`, 190, y + 13, { align: "right" });
        
        y += 30;
    } else {
        y += 10;
    }

    if (y > 230) {
        doc.addPage();
        y = 40;
    }

    const boxY = y;
    const boxHeight = 45;
    
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(15, boxY, 85, boxHeight);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("FIRMA DEL TÉCNICO", 20, boxY + 8);
    
    if (workerSignature) {
        doc.addImage(workerSignature, 'PNG', 25, boxY + 10, 60, 25);
    }
    doc.setFontSize(10);
    doc.setTextColor(0,0,0);
    doc.text(workerName, 57, boxY + 40, { align: 'center'});

    doc.rect(110, boxY, 85, boxHeight);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("CONFORMIDAD DEL CLIENTE", 115, boxY + 8);
    
    if (signature) {
        doc.addImage(signature, 'PNG', 120, boxY + 10, 60, 25);
    }
    doc.setFontSize(10);
    doc.setTextColor(0,0,0);
    doc.text(clientName, 152, boxY + 40, { align: 'center'});

    const pageHeight = doc.internal.pageSize.height;
    doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
    doc.rect(0, pageHeight - 20, 210, 20, 'F');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("HARTI ELECTROCOOL CLIMATIZACIÓN Y SERVICIOS TÉCNICOS", 105, pageHeight - 12, { align: "center" });
    doc.text("Documento generado digitalmente con ClimaTrack Pro", 105, pageHeight - 7, { align: "center" });

    // PAGE 2: Photos (Visual Documentation)
    if (photoBefore || photoAfter) {
        doc.addPage();
        
        doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        doc.rect(0, 0, 210, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("DOCUMENTACIÓN VISUAL", 105, 13, { align: "center" });

        let py = 30;

        if (photoBefore) {
            doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
            doc.setFontSize(12);
            doc.text("ANTERIOR A LA INTERVENCIÓN:", 15, py);
            try {
                // Determine rough aspect ratio (square for simplicity, 1:1 max 120x120 or scaled)
                // Using 180x100 rectangle fit area is a good choice for standard horizontal photos.
                doc.addImage(photoBefore, 'JPEG', 15, py + 5, 180, 100, undefined, 'FAST');
                py += 115;
            } catch (e) {
                console.error("Error adding photoBefore to PDF:", e);
                py += 10;
            }
        }

        if (photoAfter) {
            if (py > 150) { // If it would be tight, move to next page or just squeeze it.
                // 180x100 is ok, will reach 145+100 = 245. (Page is 297 high)
            }
            doc.setTextColor(colorDark[0], colorDark[1], colorDark[2]);
            doc.setFontSize(12);
            doc.text("POSTERIOR A LA INTERVENCIÓN:", 15, py);
            try {
                doc.addImage(photoAfter, 'JPEG', 15, py + 5, 180, 100, undefined, 'FAST');
            } catch (e) {
                console.error("Error adding photoAfter to PDF:", e);
            }
        }

        doc.setFillColor(colorLight[0], colorLight[1], colorLight[2]);
        doc.rect(0, pageHeight - 20, 210, 20, 'F');
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text("HARTI ELECTROCOOL CLIMATIZACIÓN Y SERVICIOS TÉCNICOS", 105, pageHeight - 12, { align: "center" });
        doc.text("Documento generado digitalmente con ClimaTrack Pro", 105, pageHeight - 7, { align: "center" });
    }

    return doc;
  };

  const generatePDF = async () => {
      const doc = await createPDFDocument();
      doc.save(`Parte_Harti_${clientName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  const handleShareEmail = async () => {
      const doc = await createPDFDocument();
      const fileName = `Parte_Harti_${clientName.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      const subject = `Parte de Trabajo - ${clientName} - Harti Electrocool`;
      const text = `Hola,\n\nAdjunto le envío el parte de trabajo del servicio realizado el ${new Date().toLocaleDateString()}.\n\nTécnico: ${workerName}\nTotal: ${price} €\n\nUn saludo,\nHarti Electrocool Climatización`;
      const emails = clientEmail ? `${clientEmail}` : "";
      const cc = "hartielectocool@gmail.com";

      // Try native Web Share API first (best for mobile, attaches the file)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
              await navigator.share({
                  files: [file],
                  title: subject,
                  text: text
              });
              return; // Success
          } catch (error) {
              console.log('Error sharing:', error);
              // Fallback if sharing was cancelled or failed
          }
      } 
      
      // Fallback for desktops / unsupported browsers
      // Download the PDF automatically
      doc.save(fileName);

      // Open Mail client (mailto link cannot attach files automatically for security reasons)
      const mailtoLink = `mailto:${emails}?cc=${cc}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text + "\n\n[NOTA: El PDF se acaba de descargar en su dispositivo. Por favor, adjúntelo a este correo manualmente para enviarlo al cliente]")}`;
      window.location.href = mailtoLink;
  };

  const handlePreviewPDF = async () => {
      const doc = await createPDFDocument();
      const blobUrl = doc.output('bloburl');
      setPreviewPdfUrl(blobUrl.toString());
  };

  // --- Render Functions ---

  const renderLogin = () => (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
              <div className="flex flex-col items-center mb-6">
                {!logoError ? (
                    <img 
                        src={COMPANY_LOGO_URL} 
                        onError={() => setLogoError(true)}
                        alt="Harti Electrocool Logo" 
                        className="w-20 h-20 object-contain mb-3 drop-shadow-md rounded-xl" 
                    />
                ) : (
                    <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-3 rounded-xl text-white shadow-lg shadow-blue-200 mb-3">
                        <ClipboardCheck size={32} />
                    </div>
                )}
                <h1 className="text-xl font-bold text-slate-800">HARTI ELECTROCOOL</h1>
                <p className="text-sm text-slate-400">Acceso a ClimaTrack Pro</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Usuario</label>
                      <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            value={loginUser}
                            onChange={(e) => setLoginUser(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Ingrese su usuario"
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contraseña</label>
                      <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="password" 
                            value={loginPass}
                            onChange={(e) => setLoginPass(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            placeholder="Ingrese su contraseña"
                          />
                      </div>
                  </div>
                  
                  {loginError && (
                      <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center font-medium">
                          {loginError}
                      </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                  >
                      Iniciar Sesión
                  </button>
              </form>
          </div>
      </div>
  );

  const renderDashboard = () => (
      <div className="space-y-6 animate-fadeIn">
          {deferredPrompt && (
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-2xl shadow-lg animate-pulse">
                <button 
                    onClick={handleInstallApp}
                    className="w-full bg-white rounded-xl p-4 flex items-center justify-between group"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                            <Smartphone size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-slate-800">Instalar Aplicación</p>
                            <p className="text-xs text-slate-500">Añadir a la pantalla de inicio</p>
                        </div>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                </button>
              </div>
          )}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-800 mb-1">Hola, {currentUser?.fullName}</h2>
              <p className="text-slate-500 text-sm">¿Qué te gustaría hacer hoy?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Common Option: Start New Job Report */}
              <button 
                onClick={() => setView(AppView.JOB_REPORT)}
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-3"
              >
                  <div className="bg-white/20 p-3 rounded-full">
                    <FileText size={32} />
                  </div>
                  <span className="font-bold text-lg">Nuevo Parte de Trabajo</span>
              </button>

              <button 
                onClick={() => setView(AppView.CHECKLIST_REPORT)}
                className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-3"
              >
                  <div className="bg-white/20 p-3 rounded-full">
                    <ClipboardCheck size={32} />
                  </div>
                  <span className="font-bold text-lg">Nuevo Check List</span>
              </button>

              {/* Worker Option: View Assigned Tasks */}
              {currentUser?.role === 'WORKER' && (
                  <button 
                    onClick={() => setView(AppView.TASK_LIST)}
                    className="bg-white border-2 border-slate-100 text-slate-700 p-6 rounded-2xl shadow-sm hover:border-blue-200 transition-all active:scale-95 flex flex-col items-center justify-center gap-3"
                  >
                      <div className="bg-orange-100 text-orange-500 p-3 rounded-full">
                        <ListTodo size={32} />
                      </div>
                      <span className="font-bold text-lg">Mis Tareas Asignadas</span>
                  </button>
              )}

              {/* Admin Options */}
              {currentUser?.role === 'ADMIN' && (
                  <>
                    <button 
                        onClick={() => setView(AppView.ADMIN_HISTORY)}
                        className="bg-white border-2 border-slate-100 text-slate-700 p-6 rounded-2xl shadow-sm hover:border-blue-200 transition-all active:scale-95 flex flex-col items-center justify-center gap-3"
                    >
                        <div className="bg-slate-800 text-white p-3 rounded-full">
                            <FolderClock size={32} />
                        </div>
                        <span className="font-bold text-lg">Historial Completo</span>
                    </button>

                    <button 
                        onClick={() => setView(AppView.ADMIN_TASKS)}
                        className="bg-white border-2 border-slate-100 text-slate-700 p-6 rounded-2xl shadow-sm hover:border-blue-200 transition-all active:scale-95 flex flex-col items-center justify-center gap-3"
                    >
                        <div className="bg-purple-100 text-purple-500 p-3 rounded-full">
                            <Briefcase size={32} />
                        </div>
                        <span className="font-bold text-lg">Asignar y Supervisar</span>
                    </button>

                    <button 
                        onClick={() => setView(AppView.ADMIN_USERS)}
                        className="bg-white border-2 border-slate-100 text-slate-700 p-6 rounded-2xl shadow-sm hover:border-blue-200 transition-all active:scale-95 flex flex-col items-center justify-center gap-3"
                    >
                        <div className="bg-green-100 text-green-600 p-3 rounded-full">
                            <Users size={32} />
                        </div>
                        <span className="font-bold text-lg">Gestionar Usuarios</span>
                    </button>
                  </>
              )}
          </div>
      </div>
  );

  const renderAdminUsers = () => (
      <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setView(AppView.DASHBOARD)} className="bg-white p-2 rounded-full shadow-sm text-slate-500">
                  <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-bold text-slate-800">Crear Nuevo Usuario</h2>
          </div>

          <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={newUserFullname}
                    onChange={(e) => setNewUserFullname(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. Juan Pérez"
                  />
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nombre de Usuario (Login)</label>
                  <input 
                    type="text" 
                    value={newUserUser}
                    onChange={(e) => setNewUserUser(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej. jperez"
                  />
              </div>
              <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contraseña</label>
                  <input 
                    type="text" 
                    value={newUserPass}
                    onChange={(e) => setNewUserPass(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contraseña"
                  />
              </div>

              {userMsg && (
                  <div className={`text-sm p-3 rounded-lg text-center font-medium ${userMsg.includes('existe') ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                      {userMsg}
                  </div>
              )}

              <button 
                type="submit"
                className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                  <PlusCircle size={20} /> Crear Trabajador
              </button>
          </form>

          <div className="bg-slate-100 p-4 rounded-xl">
              <h3 className="text-sm font-bold text-slate-600 mb-2 flex items-center gap-2"><Users size={16}/> Usuarios Existentes</h3>
              <ul className="space-y-2">
                  {adminUsersList.map((u, i) => (
                      <li key={u.username} className="bg-white p-3 rounded-lg text-sm flex justify-between items-center shadow-sm">
                          <div className="flex flex-col">
                              <span className="font-medium text-slate-800">{u.fullName}</span>
                              <span className="text-slate-400 text-xs">({u.username})</span>
                          </div>
                          <button 
                             type="button"
                             onClick={(e) => handleDeleteUser(e, u.username)}
                             className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer z-10"
                             title="Eliminar usuario"
                          >
                              <Trash2 size={16} />
                          </button>
                      </li>
                  ))}
                  {adminUsersList.length === 0 && <p className="text-xs text-slate-400 italic">No hay trabajadores creados.</p>}
              </ul>
          </div>
      </div>
  );

  const renderAdminTasks = () => {
      // Use adminTasksList state instead of direct read
      const users = adminUsersList; 

      return (
        <div className="space-y-6 animate-fadeIn pb-20">
            <div className="flex items-center gap-3 mb-4">
                <button onClick={() => setView(AppView.DASHBOARD)} className="bg-white p-2 rounded-full shadow-sm text-slate-500">
                    <ChevronLeft size={20} />
                </button>
                <h2 className="text-xl font-bold text-slate-800">Asignar y Supervisar</h2>
            </div>

            <form onSubmit={handleCreateTask} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-purple-700 flex items-center gap-2 mb-2">
                    <Briefcase size={16} /> Crear Nueva Asignación
                </h3>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Título del Trabajo</label>
                    <input 
                        type="text" 
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej. Instalación Aire Acondicionado"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ubicación / Dirección</label>
                    <input 
                        type="text" 
                        value={newTaskLoc}
                        onChange={(e) => setNewTaskLoc(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej. C/ Mayor 12"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Descripción</label>
                    <textarea 
                        value={newTaskDesc}
                        onChange={(e) => setNewTaskDesc(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 h-24"
                        placeholder="Detalles del trabajo..."
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Asignar a Trabajador</label>
                    <select 
                        value={newTaskAssignee}
                        onChange={(e) => setNewTaskAssignee(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Seleccionar Trabajador...</option>
                        {users.map(u => (
                            <option key={u.username} value={u.username}>{u.fullName}</option>
                        ))}
                    </select>
                </div>

                {taskMsg && (
                    <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg text-center font-medium">
                        {taskMsg}
                    </div>
                )}

                <button 
                    type="submit"
                    className="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                    <PlusCircle size={20} /> Asignar Trabajo
                </button>
            </form>

            <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-600 flex items-center gap-2">
                    <ListTodo size={16} /> Estado de Tareas Asignadas
                </h3>
                {adminTasksList.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 bg-slate-100 rounded-xl border border-slate-200 border-dashed">
                        No hay trabajos activos asignados.
                    </div>
                ) : (
                    adminTasksList.slice().reverse().map(task => (
                        <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-slate-800">{task.title}</h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                        task.isCompleted ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                        {task.isCompleted ? 'Completado' : 'Pendiente'}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-500 flex flex-wrap gap-3">
                                    <span className="flex items-center gap-1">
                                        <User size={12} /> Asignado a: <strong className="text-slate-700">{users.find(u => u.username === task.assignedTo)?.fullName || task.assignedTo}</strong>
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin size={12} /> {task.location}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${task.isCompleted ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {task.isCompleted ? <CheckCircle2 size={24} /> : <Clock3 size={24} />}
                                </div>
                                <button 
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    title="Eliminar asignación"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      );
  };

  const renderTimer = () => (
    <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center gap-3 mb-2">
            <button onClick={() => {
                // Confirm logic could go here
                setView(AppView.DASHBOARD);
                setStep(AppStep.IDLE);
                setStartTime(null);
                setTotalPausedMs(0);
                setIsPaused(false);
                setPauseStartTime(null);
            }} className="bg-white p-2 rounded-full shadow-sm text-slate-500">
                <ChevronLeft size={20} />
            </button>
            <h2 className="text-xl font-bold text-slate-800">
                {step === AppStep.IDLE ? "Iniciar Nuevo Parte" : "Trabajo en Curso"}
            </h2>
        </div>

        <Timer 
            startTime={startTime} 
            isWorking={step === AppStep.WORKING} 
            onStart={handleStartJob}
            onStop={handleStopJob}
            isPaused={isPaused}
            onPause={handlePauseJob}
            onResume={handleResumeJob}
            totalPausedMs={totalPausedMs}
            pauseStartTime={pauseStartTime}
        />
        {step === AppStep.IDLE && (
            <div className="text-center text-sm text-slate-400 mt-4">
                <p>Pulse el botón para marcar la hora de llegada.</p>
            </div>
        )}
    </div>
  );

  const renderDetails = () => (
    <div className="space-y-6 animate-fadeIn pb-20">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
            <FileText className="text-blue-600" /> Detalles del Servicio
        </h2>

        {/* Worker Info (Auto-filled but editable) */}
        <div className="bg-slate-100 p-4 rounded-xl space-y-3">
             <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <HardHat size={16} /> Técnico Responsable
             </div>
             <input 
                type="text" 
                value={workerName}
                onChange={(e) => setWorkerName(e.target.value)}
                placeholder="Su nombre (Técnico)"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
             />
        </div>

        {/* Client Info */}
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                    <User size={14} /> Nombre del Cliente
                </label>
                <input 
                    type="text" 
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                    <Mail size={14} /> Correo Electrónico (Opcional)
                </label>
                <input 
                    type="email" 
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="Ej. cliente@email.com"
                    className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
        </div>

        {/* Materials */}
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
                <Package size={14} /> Materiales Utilizados
            </label>
            <textarea 
                value={materials}
                onChange={(e) => setMaterials(e.target.value)}
                placeholder="Ej. 2m Tubo de cobre, 1kg Gas R32..."
                className="w-full p-3 border border-slate-300 rounded-xl min-h-[80px] focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>

        {/* Description */}
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-600">Descripción del Trabajo</label>
                <button 
                    onClick={handleEnhanceDescription}
                    disabled={isEnhancing || !description}
                    className="text-xs flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-1 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
                >
                    <Wand2 size={12} />
                    {isEnhancing ? "Mejorando..." : "Mejorar con IA"}
                </button>
            </div>
            <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describa el trabajo realizado..."
                className="w-full p-3 border border-slate-300 rounded-xl min-h-[120px] focus:ring-2 focus:ring-blue-500 outline-none"
            />
        </div>

        {/* Price */}
        <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-2">
             <label className="text-sm font-bold text-orange-700 flex items-center gap-1">
                <Coins size={16} /> Precio Total del Servicio
             </label>
             <div className="relative">
                <input 
                    type="number" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 pl-8 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-lg font-bold text-slate-700"
                />
                <Euro size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-400" />
             </div>
        </div>

        <MapLocator 
            location={location} 
            setLocation={setLocation} 
            manualAddress={manualAddress}
            setManualAddress={setManualAddress}
        />

        <div className="flex justify-end pt-4">
              <button 
                onClick={() => setStep(AppStep.PHOTOS)}
                disabled={!clientName || !workerName}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-lg shadow-blue-200"
             >
                Continuar a Fotos <ChevronRight size={20} />
             </button>
        </div>
    </div>
  );

  const renderPhotos = () => (
      <div className="space-y-6 animate-fadeIn pb-20">
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-2">
              <Camera size={24} className="text-blue-600" /> Documentación Visual
          </h2>
          <p className="text-sm text-slate-500">Tome fotos del antes y el después para adjuntarlas al parte de trabajo.</p>

          <div className="space-y-4">
              {/* Photo Before */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-semibold text-slate-700 text-sm uppercase flex items-center gap-1">
                      <ImageIcon size={16} /> Foto del ANTES
                  </h3>
                  {photoBefore ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200">
                          <img src={photoBefore} alt="Antes" className="w-full h-auto max-h-64 object-contain bg-slate-100" />
                          <button onClick={() => setPhotoBefore(null)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md">
                              <Trash2 size={16} />
                          </button>
                      </div>
                  ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Camera className="w-8 h-8 text-slate-400 mb-2" />
                              <p className="text-sm text-slate-500">Tomar o subir foto</p>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, setPhotoBefore)} />
                      </label>
                  )}
              </div>

              {/* Photo After */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-semibold text-slate-700 text-sm uppercase flex items-center gap-1">
                      <ImageIcon size={16} /> Foto del DESPUÉS
                  </h3>
                  {photoAfter ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200">
                          <img src={photoAfter} alt="Después" className="w-full h-auto max-h-64 object-contain bg-slate-100" />
                          <button onClick={() => setPhotoAfter(null)} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md">
                              <Trash2 size={16} />
                          </button>
                      </div>
                  ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Camera className="w-8 h-8 text-slate-400 mb-2" />
                              <p className="text-sm text-slate-500">Tomar o subir foto</p>
                          </div>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, setPhotoAfter)} />
                      </label>
                  )}
              </div>
          </div>

          <div className="flex justify-between pt-4">
              <button 
                  onClick={() => setStep(AppStep.DETAILS)}
                  className="flex items-center gap-2 text-slate-600 px-4 py-3 font-medium hover:bg-slate-100 rounded-xl"
              >
                  <ChevronLeft size={20} /> Volver
              </button>
              <button 
                  onClick={() => setStep(AppStep.SIGNATURE)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                  Omitir / Siguiente <ChevronRight size={20} />
              </button>
          </div>
      </div>
  );

  const renderSignature = () => (
    <div className="space-y-8 animate-fadeIn pb-20">
        <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2">Firmas y Conformidad</h2>
        
        <div className="space-y-2">
             <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Firma del Técnico ({workerName})</h3>
             <SignaturePad onSave={setWorkerSignature} title="Firma del Técnico" />
        </div>

        <div className="space-y-2">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Firma del Cliente ({clientName})</h3>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 mb-2">
                <p>Confirmo el trabajo realizado y acepto el presupuesto de {price || "0"} €.</p>
            </div>
            <SignaturePad onSave={setSignature} title="Firma del Cliente" />
        </div>
        
         <div className="flex justify-between pt-4">
             <button 
                onClick={() => setStep(AppStep.PHOTOS)}
                className="flex items-center gap-2 text-slate-600 px-4 py-3 font-medium hover:bg-slate-100 rounded-xl"
             >
                <ChevronLeft size={20} /> Volver
             </button>
             <button 
                onClick={async () => {
                    setStep(AppStep.REVIEW);
                    try {
                        const doc = await createPDFDocument();
                        const blob = doc.output('blob');
                        await Storage.saveReport({
                            type: 'JOB',
                            clientName: clientName || "Consumidor Final",
                            workerName: workerName || currentUser?.fullName || currentUser?.username || 'Desconocido',
                            createdAt: Date.now(),
                            description: description.substring(0, 100),
                            refCode: "JOB-" + Date.now().toString().slice(-6)
                        }, blob);
                    } catch (e) {
                        console.error("Error saving job report to history", e);
                    }
                }}
                disabled={!signature || !workerSignature}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-300 transition-colors shadow-lg shadow-blue-200"
             >
                Finalizar y Guardar <CheckCircle2 size={20} />
             </button>
        </div>
    </div>
  );

  const renderReview = () => (
      <div className="space-y-6 animate-fadeIn">
          <div className="text-center space-y-2 py-6">
              <div className="w-16 h-16 bg-gradient-to-tr from-green-400 to-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-green-100">
                  <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">¡Trabajo Completado!</h2>
              <p className="text-slate-500 max-w-xs mx-auto">
                El parte de trabajo de <strong>Harti Electrocool</strong> está listo.
              </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={handlePreviewPDF}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 p-4 rounded-xl font-bold hover:bg-slate-200 transition-all shadow-sm active:scale-95 border border-slate-200"
                  >
                      <Eye size={20} />
                      <span className="text-sm md:text-base">Previsualizar</span>
                  </button>
                  <button 
                    onClick={() => setStep(AppStep.DETAILS)}
                    className="w-full flex items-center justify-center gap-2 bg-white text-orange-600 p-4 rounded-xl font-bold hover:bg-orange-50 transition-all shadow-sm active:scale-95 border border-orange-200"
                  >
                      <PenTool size={20} />
                      <span className="text-sm md:text-base">Editar Datos</span>
                  </button>
              </div>
              
              <button 
                onClick={generatePDF}
                className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95"
              >
                  <Download size={20} />
                  Descargar Parte (PDF)
              </button>
              
              <button 
                onClick={handleShareEmail}
                className="w-full flex items-center justify-center gap-3 bg-white text-blue-600 border-2 border-blue-100 p-4 rounded-xl font-bold hover:bg-blue-50 transition-all active:scale-95"
              >
                  <Mail size={20} />
                  Preparar Email
              </button>
          </div>

          <button 
            onClick={() => {
                // Return to dashboard instead of idle step loop
                setView(AppView.DASHBOARD);
                setStep(AppStep.IDLE);
                setStartTime(null);
                setEndTime(null);
                setDescription("");
                setMaterials("");
                setPrice("");
                setClientName("");
                setClientEmail("");
                setWorkerName(""); // Clear worker name
                setManualAddress("");
                setLocation(null);
                setSignature(null);
                setWorkerSignature(null);
                setPhotoBefore(null);
                setPhotoAfter(null);
                setPreviewPdfUrl(null);
                setTotalPausedMs(0);
                setIsPaused(false);
                setPauseStartTime(null);
            }}
            className="w-full text-center text-slate-400 text-sm mt-8 hover:text-slate-600 py-4"
          >
              Volver al Inicio
          </button>
      </div>
  );

  // --- Main Render Switch ---
  const showHeader = view !== AppView.LOGIN;

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center pointer-events-none shadow-[-20px_0_40px_rgba(0,0,0,0.15)]"
          >
             <div className="flex flex-col items-center">
                 {/* This will show your animation gif, falls back to static logo automatically */}
                 {!logoError ? (
                     <img 
                        src="/animacion-harti.gif" 
                        onError={(e) => {
                             e.currentTarget.src = COMPANY_LOGO_URL;
                             e.currentTarget.className = "w-32 h-32 object-contain mb-4 animate-bounce";
                        }}
                        alt="Harti Animation" 
                        className="w-48 h-48 object-contain mb-4" 
                     />
                 ) : (
                     <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-6 rounded-2xl text-white shadow-xl shadow-blue-200 mb-6 animate-pulse">
                         <ClipboardCheck size={64} />
                     </div>
                 )}
                 <h1 className="text-2xl font-bold text-slate-800 tracking-tight">HARTI</h1>
                 <h1 className="text-xl font-bold text-orange-500 tracking-wide">ELECTROCOOL</h1>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        
        {showHeader && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!logoError ? (
                  <img 
                    src={COMPANY_LOGO_URL} 
                    onError={() => setLogoError(true)}
                    alt="Logo" 
                    className="w-8 h-8 object-contain rounded" 
                  />
              ) : (
                  <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-lg text-white shadow-md shadow-blue-200">
                      <ClipboardCheck size={20} />
                  </div>
              )}
              <div className="leading-none">
                  <h1 className="text-sm font-bold text-slate-800 tracking-tight">HARTI</h1>
                  <h1 className="text-xs font-bold text-orange-500 tracking-wide">ELECTROCOOL</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
                 {view === AppView.JOB_REPORT && (
                    <div className="flex gap-1.5 mr-2">
                        {[AppStep.IDLE, AppStep.WORKING, AppStep.DETAILS, AppStep.PHOTOS, AppStep.SIGNATURE, AppStep.REVIEW].map((s, i) => (
                            <div 
                                key={s} 
                                className={`h-2 w-2 rounded-full transition-colors ${
                                    Object.values(AppStep).indexOf(step) >= i ? 'bg-blue-600' : 'bg-slate-200'
                                }`}
                            />
                        ))}
                    </div>
                 )}
                 
                 <button onClick={() => setShowLogoutConfirm(true)} className="text-slate-400 hover:text-red-500 transition-colors">
                     <LogOut size={20} />
                 </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 md:p-6">
        {view === AppView.LOGIN && renderLogin()}
        
        {view === AppView.DASHBOARD && renderDashboard()}
        
        {view === AppView.ADMIN_USERS && renderAdminUsers()}
        
        {view === AppView.ADMIN_TASKS && renderAdminTasks()}
        
        {view === AppView.TASK_LIST && (
            <WorkerTasks 
                currentUser={currentUser}
                onBack={() => setView(AppView.DASHBOARD)}
                onStartReport={(task) => {
                    setDescription(`${task.title} - ${task.description}`);
                    setManualAddress(task.location);
                    setView(AppView.JOB_REPORT);
                }}
            />
        )}

        {view === AppView.JOB_REPORT && (
            <>
                {step === AppStep.IDLE && renderTimer()}
                {step === AppStep.WORKING && renderTimer()}
                {step === AppStep.DETAILS && renderDetails()}
                {step === AppStep.PHOTOS && renderPhotos()}
                {step === AppStep.SIGNATURE && renderSignature()}
                {step === AppStep.REVIEW && renderReview()}
            </>
        )}

        {view === AppView.CHECKLIST_REPORT && (
            <ChecklistReport 
                currentUser={currentUser} 
                onBack={() => setView(AppView.DASHBOARD)} 
                companyLogoUrl={COMPANY_LOGO_URL}
                logoError={logoError}
            />
        )}
        
        {view === AppView.ADMIN_HISTORY && (
            <AdminHistory onBack={() => setView(AppView.DASHBOARD)} />
        )}
      </main>

      <footer className="p-4 text-center text-slate-400 text-xs">
        <p>&copy; {new Date().getFullYear()} Harti Electrocool Climatización</p>
      </footer>

      {previewPdfUrl && (
          <div className="fixed inset-0 z-[100] bg-slate-900 bg-opacity-90 flex flex-col p-2 md:p-6 backdrop-blur-sm">
              <div className="w-full max-w-5xl mx-auto h-full bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl">
                  <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-200">
                      <div className="flex items-center gap-4">
                          <h3 className="font-bold text-slate-700 flex items-center gap-2">
                              <FileText className="text-blue-500" size={20} /> 
                              Vista Previa del Parte
                          </h3>
                          <a 
                            href={previewPdfUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hidden md:flex text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                          >
                             Abrir en nueva pestaña
                          </a>
                      </div>
                      <button 
                        onClick={() => setPreviewPdfUrl(null)} 
                        className="text-slate-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                          <X size={24} />
                      </button>
                  </div>
                  <div className="flex-1 w-full bg-slate-200 relative flex flex-col items-center justify-center p-4">
                      {/* Note for sandboxed iframes (like AI Studio) or incompatible mobile browsers */}
                      <div className="absolute inset-x-0 top-0 text-center p-4 bg-blue-50 text-blue-800 text-sm border-b border-blue-100 z-0">
                         Si el PDF no carga o aparece bloqueado, <a href={previewPdfUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline">Haz clic aquí para abrirlo</a>.
                      </div>
                      
                      <iframe 
                        src={previewPdfUrl} 
                        className="w-full h-full absolute inset-0 border-0 z-10" 
                        title="Previsualización PDF" 
                      />
                  </div>
              </div>
          </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] bg-slate-900 bg-opacity-60 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative border border-slate-100">
                  <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                      <LogOut size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">¿Cerrar sesión?</h3>
                  {step !== AppStep.IDLE && step !== AppStep.REVIEW ? (
                      <p className="text-slate-500 mb-6 text-sm text-center">
                          Tienes un parte de trabajo en curso. Si cierras sesión ahora, <strong className="text-red-500">perderás todo el progreso</strong> que no hayas guardado.
                      </p>
                  ) : (
                       <p className="text-slate-500 mb-6 text-sm text-center">
                          ¿Estás seguro de que deseas salir de tu cuenta?
                      </p>
                  )}
                  
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setShowLogoutConfirm(false)}
                          className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={handleLogout}
                          className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-200"
                      >
                          Sí, salir
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
    </>
  );
};

export default App;