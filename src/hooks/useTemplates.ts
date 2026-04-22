import { useState, useEffect } from 'react';
import { Template } from '../types';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

const DEFAULT_TEMPLATES = [
  {
    id: '1',
    name: 'Oman partial refund',
    dateAdded: Date.now(),
    fields: [
      { id: 'f1', label: 'Ticket link', type: 'text' },
      { id: 'f2', label: 'Refund amount', type: 'text' },
      { id: 'f3', label: 'Reason', type: 'dropdown', options: ['Customer request', 'Damaged item', 'Late delivery', 'Missing item', 'Other'] },
      { id: 'f4', label: 'Order ID', type: 'text' }
    ]
  }
];

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [userId, setUserId] = useState<string | null>(auth?.currentUser?.uid || null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Migrate local templates to Firebase
  useEffect(() => {
    if (!db || !userId) return;
    
    const migrateLocalData = async () => {
      const keysToCheck = ['templates', 'savedTemplates', 'cs-agent-templates'];
      for (const key of keysToCheck) {
        const localDataStr = localStorage.getItem(key);
        if (localDataStr) {
          try {
            const localData = JSON.parse(localDataStr);
            if (Array.isArray(localData) && localData.length > 0) {
              let migratedCount = 0;
              for (const item of localData) {
                if (item.name && item.fields) {
                  const newId = item.id || crypto.randomUUID();
                  const docRef = doc(db, 'templates', newId);
                  
                  const newItem = {
                    id: newId,
                    name: item.name,
                    fields: item.fields,
                    userId: userId,
                    dateAdded: typeof item.dateAdded === 'number' ? item.dateAdded : Date.now(),
                    ...(item.isFavorite !== undefined ? { isFavorite: item.isFavorite } : {})
                  };
                  await setDoc(docRef, newItem, { merge: true });
                  migratedCount++;
                }
              }
              if (migratedCount > 0) {
                toast.success(`Restored ${migratedCount} templates from local storage!`);
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
      setTemplates([]);
      return;
    }

    const q = query(
      collection(db, 'templates'), 
      where('userId', '==', userId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const templatesData: Template[] = [];
      snapshot.forEach((doc) => {
        templatesData.push({ id: doc.id, ...doc.data() } as Template);
      });
      
      // Sort in memory to avoid requiring a composite index
      templatesData.sort((a, b) => b.dateAdded - a.dateAdded);
      
      if (templatesData.length === 0 && snapshot.metadata.fromCache === false) {
        // If empty, use default templates
        const defaultTemplatesWithIds = DEFAULT_TEMPLATES.map(t => ({
          ...t,
          id: crypto.randomUUID(),
          userId: userId
        }));
        setTemplates(defaultTemplatesWithIds as Template[]);
        defaultTemplatesWithIds.forEach(t => {
          setDoc(doc(db, 'templates', t.id), t).catch(console.error);
        });
      } else {
        setTemplates(templatesData);
      }
    }, (error) => {
      console.error('Failed to fetch templates from Firebase', error);
    });

    return () => unsubscribe();
  }, [userId]);

  const addTemplate = async (name: string, fields: Template['fields']) => {
    if (!db || !auth?.currentUser) return;
    const id = crypto.randomUUID();
    const newTemplate = {
      id,
      name,
      fields,
      dateAdded: Date.now(),
      userId: auth.currentUser.uid
    };
    try {
      await setDoc(doc(db, 'templates', id), newTemplate);
    } catch (e) {
      console.error('Failed to save template', e);
    }
  };

  const editTemplate = async (id: string, name: string, fields: Template['fields']) => {
    if (!db || !auth?.currentUser) return;
    try {
      await updateDoc(doc(db, 'templates', id), { name, fields });
    } catch (e) {
      console.error('Failed to edit template', e);
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!db || !auth?.currentUser) return;
    try {
      await deleteDoc(doc(db, 'templates', id));
    } catch (e) {
      console.error('Failed to delete template', e);
    }
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    if (!db || !auth?.currentUser) return;
    try {
      await updateDoc(doc(db, 'templates', id), { isFavorite: !currentStatus });
    } catch (e) {
      console.error('Failed to toggle favorite', e);
    }
  };

  return { templates, addTemplate, editTemplate, deleteTemplate, toggleFavorite };
}
