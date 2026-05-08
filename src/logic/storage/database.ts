import { type IDBPDatabase, openDB } from "idb";

const DATABASE_NAME = "pulse-interview-trainer";
const DATABASE_VERSION = 1;
export const RESPONSE_BLOB_STORE = "question-response-blobs-store";

type Database = {
  [RESPONSE_BLOB_STORE]: {
    key: string; // QuestionResponse.id (ulid value)
    value: Blob;
  };
};

// Singleton database instance
let databasePromise: Promise<IDBPDatabase<Database>> | null = null;

// Singleton database instance getter
export function getDatabase() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB is not available in this browser.");
  }

  databasePromise ??= openDB<Database>(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(RESPONSE_BLOB_STORE)) {
        const store = database.createObjectStore(RESPONSE_BLOB_STORE);
        // can create indexes here if needed
      }
    },
  });

  return databasePromise;
}
