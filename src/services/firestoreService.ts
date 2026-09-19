import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  UserDocument,
  VacationPeriod,
  SavedTripSummary,
  TripActivity,
} from '../types';

/**
 * MÓDULO DE PERSISTÊNCIA FIRESTORE (REPOSITORY LAYER)
 * 
 * Encapsula todas as operações de banco de dados NoSQL do SmartTrip.
 * Garante validação estrita de Ownership (request.auth.uid == userId),
 * uso de serverTimestamp() e exclusão em cascata.
 */

// ==========================================
// 1. REPOSITÓRIO DE USUÁRIOS & PREFERÊNCIAS
// ==========================================

export const getUserProfile = async (userId: string): Promise<UserDocument | null> => {
  if (!userId) throw new Error('[Firestore Error] ID do usuário é obrigatório.');
  if (!db) return null;

  const docRef = doc(db, 'users', userId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) return null;
  return snap.data() as UserDocument;
};

export const updateUserPreferences = async (
  userId: string,
  preferences: UserDocument['preferences']
): Promise<void> => {
  if (!userId) throw new Error('[Firestore Error] Validação de Ownership falhou: ID do usuário ausente.');
  
  if (!preferences.styles || preferences.styles.length === 0) {
    throw new Error('[Validação Error] Selecione pelo menos 1 interesse de viagem.');
  }

  if (preferences.styles.length > 5) {
    throw new Error('[Validação Error] Escolha no máximo 5 interesses de viagem.');
  }

  if (db) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      preferences,
      updatedAt: serverTimestamp(),
    });
  }
};

// ==========================================
// 2. REPOSITÓRIO DE FOLGAS (AVAILABILITY)
// ==========================================

export const getVacationPeriods = async (userId: string): Promise<VacationPeriod[]> => {
  if (!userId) throw new Error('[Firestore Error] Validação de Ownership falhou.');
  if (!db) return [];

  const periodsRef = collection(db, 'users', userId, 'vacationPeriods');
  const q = query(periodsRef, orderBy('startDate', 'asc'));
  const querySnap = await getDocs(q);

  return querySnap.docs.map((d) => d.data() as VacationPeriod);
};

export const addVacationPeriod = async (
  userId: string,
  period: Omit<VacationPeriod, 'id'>
): Promise<VacationPeriod> => {
  if (!userId) throw new Error('[Firestore Error] Validação de Ownership falhou: Usuário não autenticado.');

  if (!period.title || !period.title.trim()) {
    throw new Error('[Validação Error] O título do período de folga é obrigatório.');
  }

  if (!period.startDate || !period.endDate) {
    throw new Error('[Validação Error] As datas de início e término são obrigatórias.');
  }

  if (period.startDate > period.endDate) {
    throw new Error('[Validação Error] A data de início não pode ser posterior à data de término.');
  }

  const periodId = `vac-${Date.now()}`;

  // Cálculo inclusivo de dias
  const startMs = new Date(period.startDate).getTime();
  const endMs = new Date(period.endDate).getTime();
  const calculatedDays = Math.max(1, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1);

  const newPeriod: VacationPeriod = {
    ...period,
    id: periodId,
    daysCount: calculatedDays,
  };

  if (db) {
    const docRef = doc(db, 'users', userId, 'vacationPeriods', periodId);
    await setDoc(docRef, {
      ...newPeriod,
      userId,
      createdAt: serverTimestamp(),
    });
  }

  return newPeriod;
};

export const updateVacationPeriod = async (
  userId: string,
  periodId: string,
  updates: Partial<VacationPeriod>
): Promise<void> => {
  if (!userId || !periodId) throw new Error('[Firestore Error] IDs inválidos para atualização.');

  if (updates.startDate && updates.endDate && updates.startDate > updates.endDate) {
    throw new Error('[Validação Error] A data de início não pode ser posterior à data de término.');
  }

  if (db) {
    const docRef = doc(db, 'users', userId, 'vacationPeriods', periodId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  }
};

export const deleteVacationPeriod = async (userId: string, periodId: string): Promise<void> => {
  if (!userId || !periodId) throw new Error('[Firestore Error] IDs inválidos para exclusão.');
  if (!db) return;

  const docRef = doc(db, 'users', userId, 'vacationPeriods', periodId);
  await deleteDoc(docRef);
};

// ==========================================
// 3. REPOSITÓRIO DE VIAGENS (TRIPS)
// ==========================================

export const getUserTrips = async (userId: string): Promise<SavedTripSummary[]> => {
  if (!userId) throw new Error('[Firestore Error] Validação de Ownership falhou.');
  if (!db) return [];

  const tripsRef = collection(db, 'users', userId, 'trips');
  const q = query(tripsRef, orderBy('createdAt', 'desc'));
  const querySnap = await getDocs(q);

  return querySnap.docs.map((d) => d.data() as SavedTripSummary);
};

export const getTripById = async (userId: string, tripId: string): Promise<SavedTripSummary | null> => {
  if (!userId || !tripId) throw new Error('[Firestore Error] Dados incompletos para buscar viagem.');
  if (!db) return null;

  const tripRef = doc(db, 'users', userId, 'trips', tripId);
  const snap = await getDoc(tripRef);

  if (!snap.exists()) return null;
  return snap.data() as SavedTripSummary;
};

export const createTrip = async (
  userId: string,
  tripData: Omit<SavedTripSummary, 'id'>
): Promise<SavedTripSummary> => {
  if (!userId) throw new Error('[Firestore Error] Validação de Ownership falhou.');
  if (!tripData.title || !tripData.destination) throw new Error('[Firestore Error] Dados inválidos: Título e destino são obrigatórios.');

  const tripId = `trip-${Date.now()}`;
  const newTrip: SavedTripSummary = {
    ...tripData,
    id: tripId,
  };

  if (db) {
    const docRef = doc(db, 'users', userId, 'trips', tripId);
    await setDoc(docRef, {
      ...newTrip,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return newTrip;
};

export const updateTrip = async (
  userId: string,
  tripId: string,
  updates: Partial<SavedTripSummary>
): Promise<void> => {
  if (!userId || !tripId) throw new Error('[Firestore Error] IDs obrigatórios para atualização.');
  if (!db) return;

  const tripRef = doc(db, 'users', userId, 'trips', tripId);
  await updateDoc(tripRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTripCascade = async (userId: string, tripId: string): Promise<void> => {
  if (!userId || !tripId) throw new Error('[Firestore Error] IDs obrigatórios para exclusão.');
  if (!db) return;

  const batch = writeBatch(db);

  const itemsRef = collection(db, 'users', userId, 'trips', tripId, 'itineraryItems');
  const itemsSnap = await getDocs(itemsRef);
  itemsSnap.docs.forEach((itemDoc) => {
    batch.delete(itemDoc.ref);
  });

  const tripRef = doc(db, 'users', userId, 'trips', tripId);
  batch.delete(tripRef);

  await batch.commit();
};

// ==========================================
// 4. REPOSITÓRIO DE ITINERÁRIO (ITINERARY ITEMS)
// ==========================================

export const getTripItineraryItems = async (userId: string, tripId: string): Promise<TripActivity[]> => {
  if (!userId || !tripId) throw new Error('[Firestore Error] IDs obrigatórios.');
  if (!db) return [];

  const itemsRef = collection(db, 'users', userId, 'trips', tripId, 'itineraryItems');
  const q = query(itemsRef, orderBy('dayNumber', 'asc'), orderBy('time', 'asc'));
  const querySnap = await getDocs(q);

  return querySnap.docs.map((d) => d.data() as TripActivity);
};

export const addItineraryItem = async (
  userId: string,
  tripId: string,
  item: Omit<TripActivity, 'id'>
): Promise<TripActivity> => {
  if (!userId || !tripId) throw new Error('[Firestore Error] Validação de Ownership falhou.');
  if (!item.title || !item.time) throw new Error('[Firestore Error] Dados inválidos: Título e horário da atividade são obrigatórios.');

  const itemId = `item-${Date.now()}`;
  const newItem: TripActivity = {
    ...item,
    id: itemId,
  };

  if (db) {
    const docRef = doc(db, 'users', userId, 'trips', tripId, 'itineraryItems', itemId);
    await setDoc(docRef, {
      ...newItem,
      tripId,
      createdAt: serverTimestamp(),
    });

    const tripRef = doc(db, 'users', userId, 'trips', tripId);
    await updateDoc(tripRef, { updatedAt: serverTimestamp() });
  }

  return newItem;
};

export const updateItineraryItem = async (
  userId: string,
  tripId: string,
  itemId: string,
  updates: Partial<TripActivity>
): Promise<void> => {
  if (!userId || !tripId || !itemId) throw new Error('[Firestore Error] IDs obrigatórios para atualização.');
  if (!db) return;

  const itemRef = doc(db, 'users', userId, 'trips', tripId, 'itineraryItems', itemId);
  await updateDoc(itemRef, {
    ...updates,
    isUserEdited: true,
    updatedAt: serverTimestamp(),
  });
};

export const deleteItineraryItem = async (
  userId: string,
  tripId: string,
  itemId: string
): Promise<void> => {
  if (!userId || !tripId || !itemId) throw new Error('[Firestore Error] IDs obrigatórios.');
  if (!db) return;

  const itemRef = doc(db, 'users', userId, 'trips', tripId, 'itineraryItems', itemId);
  await deleteDoc(itemRef);
};
