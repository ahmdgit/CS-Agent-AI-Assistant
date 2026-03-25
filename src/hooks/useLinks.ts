import { useState, useEffect } from 'react';
import { LinkItem } from '../types';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useLinks() {
  const [links, setLinks] = useState<LinkItem[]>([]);
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
      setLinks([]);
      return;
    }

    const q = query(
      collection(db, 'links'), 
      where('userId', '==', userId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData: LinkItem[] = [];
      snapshot.forEach((doc) => {
        linksData.push({ id: doc.id, ...doc.data() } as LinkItem);
      });

      // Sort in memory to avoid requiring a composite index
      linksData.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

      setLinks(linksData);
    }, (error) => {
      console.error('Failed to fetch links from Firebase', error);
    });

    return () => unsubscribe();
  }, [userId]);

  const addLink = async (url: string, description: string) => {
    if (!db || !auth?.currentUser) return;
    const id = crypto.randomUUID();
    const newLink = {
      id,
      url,
      description,
      dateAdded: new Date().toISOString(),
      userId: auth.currentUser.uid
    };
    try {
      await setDoc(doc(db, 'links', id), newLink);
    } catch (e) {
      console.error('Failed to save link', e);
    }
  };

  const editLink = async (id: string, url: string, description: string) => {
    if (!db || !auth?.currentUser) return;
    try {
      await updateDoc(doc(db, 'links', id), { url, description });
    } catch (e) {
      console.error('Failed to edit link', e);
    }
  };

  const deleteLink = async (id: string) => {
    if (!db || !auth?.currentUser) return;
    try {
      await deleteDoc(doc(db, 'links', id));
    } catch (e) {
      console.error('Failed to delete link', e);
    }
  };

  const toggleFavorite = async (id: string, currentStatus: boolean) => {
    if (!db || !auth?.currentUser) return;
    try {
      await updateDoc(doc(db, 'links', id), { isFavorite: !currentStatus });
    } catch (e) {
      console.error('Failed to toggle favorite', e);
    }
  };

  return { links, addLink, editLink, deleteLink, toggleFavorite };
}
