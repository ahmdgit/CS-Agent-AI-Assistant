import { useState, useEffect } from 'react';
import { Workflow } from '../types';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

export function useWorkflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [userId, setUserId] = useState<string | null>(auth?.currentUser?.uid || null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Migrate local workflows to Firebase
  useEffect(() => {
    if (!db || !userId) return;
    
    const migrateLocalData = async () => {
      const keysToCheck = ['workflows', 'savedWorkflows', 'cs-agent-workflows'];
      for (const key of keysToCheck) {
        const localDataStr = localStorage.getItem(key);
        if (localDataStr) {
          try {
            const localData = JSON.parse(localDataStr);
            if (Array.isArray(localData) && localData.length > 0) {
              let migratedCount = 0;
              for (const item of localData) {
                if (item.name && item.nodes) {
                  const newId = item.id || crypto.randomUUID();
                  const docRef = doc(db, 'workflows', newId);
                  
                  const newItem = {
                    id: newId,
                    name: item.name,
                    description: item.description || '',
                    nodes: item.nodes,
                    startingNodeId: item.startingNodeId || null,
                    userId: userId,
                    dateAdded: typeof item.dateAdded === 'string' ? item.dateAdded : new Date(item.dateAdded || Date.now()).toISOString(),
                    ...(item.isFavorite !== undefined ? { isFavorite: item.isFavorite } : {})
                  };
                  await setDoc(docRef, newItem, { merge: true });
                  migratedCount++;
                }
              }
              if (migratedCount > 0) {
                toast.success(`Restored ${migratedCount} workflows from local storage!`);
              }
            }
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
      setWorkflows([]);
      return;
    }

    const q = query(
      collection(db, 'workflows'), 
      where('userId', '==', userId)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Workflow[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Workflow);
      });
      
      data.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
      
      setWorkflows(data);
    }, (error) => {
      console.error('Failed to fetch workflows', error);
    });

    return () => unsubscribe();
  }, [userId]);

  const saveWorkflow = async (workflow: Omit<Workflow, 'id' | 'dateAdded' | 'userId'>) => {
    if (!db || !auth?.currentUser) return;
    const id = crypto.randomUUID();
    const newWorkflow: Workflow = {
      ...workflow,
      id,
      dateAdded: new Date().toISOString(),
      userId: auth.currentUser.uid
    };
    try {
      await setDoc(doc(db, 'workflows', id), newWorkflow);
    } catch (e) {
      console.error('Failed to save workflow', e);
      throw e;
    }
  };

  const editWorkflow = async (id: string, updates: Partial<Workflow>) => {
    if (!db || !auth?.currentUser) return;
    try {
      await updateDoc(doc(db, 'workflows', id), updates);
    } catch (e) {
      console.error('Failed to edit workflow', e);
      throw e;
    }
  };

  const deleteWorkflow = async (id: string) => {
    if (!db || !auth?.currentUser) return;
    try {
      await deleteDoc(doc(db, 'workflows', id));
    } catch (e) {
      console.error('Failed to delete workflow', e);
      throw e;
    }
  };

  const toggleFavoriteWorkflow = async (id: string, currentStatus: boolean) => {
    if (!db || !auth?.currentUser) return;
    try {
      await updateDoc(doc(db, 'workflows', id), { isFavorite: !currentStatus });
    } catch (e) {
      console.error('Failed to toggle favorite', e);
      throw e;
    }
  };

  return { workflows, saveWorkflow, editWorkflow, deleteWorkflow, toggleFavoriteWorkflow };
}
