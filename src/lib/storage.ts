import { openDB, type DBSchema } from 'idb';
import { type Message } from './parser';

interface CatchUpDB extends DBSchema {
  state: {
    key: string;
    value: {
      messages: Message[];
      currentUser: string;
      lastUpdated: Date;
    };
  };
}

const DB_NAME = 'CatchUpDatabase';
const STORE_NAME = 'state';

async function getDB() {
  return openDB<CatchUpDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveState(messages: Message[], currentUser: string) {
  const db = await getDB();
  await db.put(STORE_NAME, { messages, currentUser, lastUpdated: new Date() }, 'current');
}

export async function loadState() {
  const db = await getDB();
  return db.get(STORE_NAME, 'current');
}

export async function clearState() {
  const db = await getDB();
  await db.delete(STORE_NAME, 'current');
}
