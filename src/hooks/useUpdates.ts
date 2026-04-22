import { useState, useEffect } from 'react';
import { UpdateItem, Severity } from '../types';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

export function useUpdates() {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [userId, setUserId] = useState<string | null>(auth?.currentUser?.uid || null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid || null);
    });
    return () => unsubscribe();
  }, []);

  // Migrate local updates to Firebase
  useEffect(() => {
    if (!db || !userId) return;
    
    const migrateLocalData = async () => {
      const keysToCheck = ['updates', 'savedUpdates', 'cs-agent-updates'];
      for (const key of keysToCheck) {
        const localDataStr = localStorage.getItem(key);
        if (localDataStr) {
          try {
            const localData = JSON.parse(localDataStr);
            if (Array.isArray(localData) && localData.length > 0) {
              let migratedCount = 0;
              for (const item of localData) {
                if (item.title && item.content) {
                  const newId = item.id || crypto.randomUUID();
                  const docRef = doc(db, 'updates', newId);
                  
                  const newItem = {
                    id: newId,
                    title: item.title,
                    content: item.content,
                    userId: userId,
                    dateAdded: typeof item.dateAdded === 'string' ? item.dateAdded : new Date(item.dateAdded || Date.now()).toISOString(),
                    ...(item.severity ? { severity: item.severity } : {}),
                    ...(item.link ? { link: item.link } : {}),
                    ...(item.imageUrl ? { imageUrl: item.imageUrl } : {})
                  };
                  await setDoc(docRef, newItem, { merge: true });
                  migratedCount++;
                }
              }
              if (migratedCount > 0) {
                toast.success(`Restored ${migratedCount} updates from local storage!`);
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
      setUpdates([]);
      return;
    }

    const q = query(
      collection(db, 'updates'), 
      where('userId', '==', userId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatesData: UpdateItem[] = [];
      snapshot.forEach((doc) => {
        updatesData.push({ id: doc.id, ...doc.data() } as UpdateItem);
      });

      // Sort in memory to avoid requiring a composite index
      updatesData.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

      setUpdates(updatesData);
    }, (error) => {
      console.error('Failed to fetch updates from Firebase', error);
    });

    return () => unsubscribe();
  }, [userId]);

  const saveUpdate = async (title: string, content: string, severity?: Severity, link?: string, imageUrl?: string) => {
    if (!db || !auth?.currentUser) return;
    const id = crypto.randomUUID();
    const newUpdate = {
      id,
      title,
      content,
      severity: severity || 'Medium',
      link,
      imageUrl,
      dateAdded: new Date().toISOString(),
      userId: auth.currentUser.uid
    };
    try {
      await setDoc(doc(db, 'updates', id), newUpdate);
    } catch (e) {
      console.error('Failed to save update', e);
    }
  };

  const deleteUpdate = async (id: string) => {
    if (!db || !auth?.currentUser) return;
    try {
      await deleteDoc(doc(db, 'updates', id));
    } catch (e) {
      console.error('Failed to delete update', e);
    }
  };

  const editUpdate = async (id: string, title: string, content: string, severity?: Severity, link?: string, imageUrl?: string) => {
    if (!db || !auth?.currentUser) return;
    try {
      await updateDoc(doc(db, 'updates', id), { title, content, severity, link, imageUrl });
    } catch (e) {
      console.error('Failed to edit update', e);
    }
  };

  return { updates, saveUpdate, deleteUpdate, editUpdate };
}
