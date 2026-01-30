import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Template {
  id: string;
  name: string;
  version: string;
  duration: number;
  slots: TemplateSlot[];
  status: 'active' | 'inactive';
  remotionServeUrl?: string;
  remotionCompositionId?: string;
  previewImageUrl?: string;
  createdAt: Date;
}

export interface TemplateSlot {
  slotId: string;
  label: string;
  type: 'image' | 'video';
  description?: string;
  required: boolean;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Set up real-time listener for active templates
    const q = query(
      collection(db, 'templates'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const templatesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            version: data.version,
            duration: data.duration,
            slots: data.slots || [],
            status: data.status,
            remotionServeUrl: data.remotionServeUrl,
            remotionCompositionId: data.remotionCompositionId,
            previewImageUrl: data.previewImageUrl,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        });
        setTemplates(templatesData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return {
    templates,
    loading,
    error,
  };
}
