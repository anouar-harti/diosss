import { User, Task, Report } from '../types';
import { db, storage } from './firebase';
import { 
  collection, 
  setDoc, 
  doc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  updateDoc,
  orderBy
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Nombres de las colecciones en la nube
const USERS_COL = 'users';
const TASKS_COL = 'tasks';
const REPORTS_COL = 'reports';

// --- FUNCIONES DE SUSCRIPCIÓN (TIEMPO REAL) ---

// Escuchar cambios en la lista de usuarios
export const subscribeToUsers = (callback: (users: User[]) => void) => {
  const q = query(collection(db, USERS_COL));
  return onSnapshot(q, (snapshot) => {
    const users: User[] = [];
    snapshot.forEach((doc) => {
      users.push(doc.data() as User);
    });
    callback(users);
  });
};

// Escuchar cambios en TODAS las tareas (Admin)
export const subscribeToAllTasks = (callback: (tasks: Task[]) => void) => {
  const q = query(collection(db, TASKS_COL));
  return onSnapshot(q, (snapshot) => {
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      tasks.push(doc.data() as Task);
    });
    callback(tasks);
  });
};

// Escuchar tareas de un trabajador específico
export const subscribeToWorkerTasks = (username: string, callback: (tasks: Task[]) => void) => {
  const q = query(collection(db, TASKS_COL), where("assignedTo", "==", username));
  return onSnapshot(q, (snapshot) => {
    const tasks: Task[] = [];
    snapshot.forEach((doc) => {
      tasks.push(doc.data() as Task);
    });
    callback(tasks);
  });
};

// --- FUNCIONES DE ACCIÓN (ASYNC) ---

export const createUser = async (user: User): Promise<boolean> => {
  try {
    // Usamos el username como ID del documento para evitar duplicados y facilitar el borrado
    await setDoc(doc(db, USERS_COL, user.username), user);
    return true;
  } catch (e) {
    console.error("Error creating user: ", e);
    return false;
  }
};

export const deleteUser = async (username: string) => {
  try {
    await deleteDoc(doc(db, USERS_COL, username));
  } catch (e) {
    console.error("Error deleting user: ", e);
  }
};

export const createTask = async (task: Task) => {
  try {
    // Usamos el ID generado por timestamp como ID del documento
    await setDoc(doc(db, TASKS_COL, task.id), task);
  } catch (e) {
    console.error("Error creating task: ", e);
  }
};

export const updateTaskStatus = async (taskId: string, isCompleted: boolean) => {
  try {
    const taskRef = doc(db, TASKS_COL, taskId);
    await updateDoc(taskRef, {
      isCompleted: isCompleted
    });
  } catch (e) {
    console.error("Error updating task: ", e);
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    await deleteDoc(doc(db, TASKS_COL, taskId));
  } catch (e) {
    console.error("Error deleting task: ", e);
  }
};

// Helper simple para obtener usuarios una sola vez (para el login)
// Nota: En una app real usaríamos Firebase Auth, pero mantenemos tu lógica actual
// adaptada a Firestore.
export const getUsersOnce = async (): Promise<User[]> => {
    // Esta función es un placeholder. En el nuevo diseño reactivo,
    // el login se manejará mejor cargando los usuarios al inicio o usando Auth real.
    // Por simplicidad en esta migración, devolveremos una promesa vacía ya que
    // App.tsx usará suscripciones.
    return []; 
};

// --- HISTORY & REPORTS ---

export const saveReport = async (reportData: Omit<Report, 'id' | 'pdfUrl'>, pdfBlob: Blob): Promise<boolean> => {
  try {
    const reportId = `${reportData.type}_${Date.now()}`;
    const fileRef = ref(storage, `reports/${reportId}.pdf`);
    
    // Upload PDF to Firebase Storage
    await uploadBytes(fileRef, pdfBlob);
    
    // Get Download URL
    const pdfUrl = await getDownloadURL(fileRef);
    
    // Save metadata to Firestore
    const newReport: Report = {
      ...reportData,
      id: reportId,
      pdfUrl,
    };
    
    await setDoc(doc(db, REPORTS_COL, reportId), newReport);
    return true;
  } catch (error) {
    console.error("Error saving report:", error);
    return false;
  }
};

export const subscribeToReports = (callback: (reports: Report[]) => void) => {
  const q = query(collection(db, REPORTS_COL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const reports: Report[] = [];
    snapshot.forEach((doc) => {
      reports.push(doc.data() as Report);
    });
    callback(reports);
  });
};