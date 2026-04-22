import { useState, useEffect } from 'react';
import { Macro } from '../types';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

export function useMacros() {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [userId, setUserId] = useState<string | null>(auth?.currentUser?.uid || null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Migrate local macros to Firebase
  useEffect(() => {
    if (!db || !userId) return;
    
    const migrateLocalData = async () => {
      const keysToCheck = ['macros', 'savedMacros', 'cs-agent-macros'];
      for (const key of keysToCheck) {
        const localDataStr = localStorage.getItem(key);
        if (localDataStr) {
          try {
            const localData = JSON.parse(localDataStr);
            if (Array.isArray(localData) && localData.length > 0) {
              let migratedCount = 0;
              for (const item of localData) {
                if (item.summary && item.response) {
                  const newId = item.id || crypto.randomUUID();
                  const docRef = doc(db, 'macros', newId);
                  
                  const newItem = {
                    id: newId,
                    summary: item.summary,
                    response: item.response,
                    userId: userId,
                    dateAdded: typeof item.dateAdded === 'string' ? item.dateAdded : new Date(item.dateAdded || Date.now()).toISOString(),
                    ...(item.isFavorite !== undefined ? { isFavorite: item.isFavorite } : {})
                  };
                  await setDoc(docRef, newItem, { merge: true });
                  migratedCount++;
                }
              }
              if (migratedCount > 0) {
                toast.success(`Restored ${migratedCount} macros from local storage!`);
              }
            }
            // Don't remove just yet, or maybe rename it to prevent re-migration
            localStorage.setItem(`${key}_migrated`, localDataStr);
            localStorage.removeItem(key);
          } catch (e) {
            console.error(`Failed to migrate local data for key ${key}`, e);
          }
        }
      }
    };

    migrateLocalData();
  }, [userId]);

  useEffect(() => {
    if (!db || !userId) {
      setMacros([]);
      return;
    }

    const q = query(
      collection(db, 'macros'), 
      where('userId', '==', userId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const macrosData: Macro[] = [];
      snapshot.forEach((doc) => {
        macrosData.push({ id: doc.id, ...doc.data() } as Macro);
      });
      
      // Sort in memory to avoid requiring a composite index
      macrosData.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
      
      setMacros(macrosData);
    }, (error) => {
      console.error('Failed to fetch macros from Firebase', error);
    });

    return () => unsubscribe();
  }, [userId]);

  const saveMacro = async (summary: string, response: string) => {
    if (!db || !auth?.currentUser) return;
    const id = crypto.randomUUID();
    const newMacro = {
      id,
      summary,
      response,
      dateAdded: new Date().toISOString(),
      userId: auth.currentUser.uid
    };
    try {
      await setDoc(doc(db, 'macros', id), newMacro);
    } catch (e) {
      console.error('Failed to save macro', e);
    }
  };

  const deleteMacro = async (id: string) => {
    if (!db || !auth?.currentUser) return;
    try {
      await deleteDoc(doc(db, 'macros', id));
    } catch (e) {
      console.error('Failed to delete macro', e);
    }
  };

  const editMacro = async (id: string, summary: string, response: string) => {
    if (!db || !auth?.currentUser) return;
    try {
      await updateDoc(doc(db, 'macros', id), { summary, response });
    } catch (e) {
      console.error('Failed to edit macro', e);
    }
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    if (!db || !auth?.currentUser) return;
    try {
      await updateDoc(doc(db, 'macros', id), { isFavorite: !currentStatus });
    } catch (e) {
      console.error('Failed to toggle favorite', e);
    }
  };

  return { macros, saveMacro, deleteMacro, editMacro, toggleFavorite };
}
