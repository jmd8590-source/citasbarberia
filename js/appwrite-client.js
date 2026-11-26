/* =============================================
   appwrite-client.js — Appwrite SDK configuration
   Endpoint/project IDs are public identifiers (not secrets); access
   control is enforced server-side via Appwrite sessions + per-row/
   per-file permissions, never via anything embedded in this bundle.
   ============================================= */
import { Client, Account, TablesDB, Storage, Teams, Functions, ID, Query } from 'appwrite';

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('barberclub');

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const storage = new Storage(client);
export const teams = new Teams(client);
export const functions = new Functions(client);
export { ID, Query };

export const DB_ID = 'main';
export const BUCKET_ID = 'avatars'; // shared media bucket; see MEDIA_FOLDER below
export const ADMIN_TEAM_ID = 'admins';
// Full control (services/schedule/settings/team management); separate from
// ADMIN_TEAM_ID (day-to-day staff) so staff can't touch business config.
export const OWNER_TEAM_ID = 'owners';
// Server-side function: promotes/demotes staff with real team membership,
// since a client session can never grant itself a role it doesn't hold.
export const MANAGE_STAFF_FUNCTION_ID = 'manage-staff';

export const TABLE = {
    PROFILES: 'profiles',
    APPOINTMENTS: 'appointments',
    SERVICES: 'services',
    SCHEDULE: 'schedule_config',
    SETTINGS: 'settings',
    GALLERY: 'gallery',
    SLOTS: 'slots'
};

export const MEDIA_FOLDER = {
    AVATARS: 'avatars',
    GALLERY: 'gallery'
};
