import { useState, useEffect } from 'react';
import { UpdateItem, Severity } from '../types';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
