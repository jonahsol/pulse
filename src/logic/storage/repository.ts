import { getDatabase, RESPONSE_BLOB_STORE } from "@/logic/storage/database";

const responseBlobRepository = {
  getBlob: async (responseId: string) => {
    const database = await getDatabase();
    const blob = await database.get(RESPONSE_BLOB_STORE, responseId);
    return blob;
  },
  setBlob: async (responseId: string, blob: Blob) => {
    const database = await getDatabase();
    await database.put(RESPONSE_BLOB_STORE, blob, responseId);
  },
  deleteBlob: async (responseId: string) => {
    const database = await getDatabase();
    await database.delete(RESPONSE_BLOB_STORE, responseId);
  },
};

export default responseBlobRepository;
