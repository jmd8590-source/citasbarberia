const sdk = require('node-appwrite');

const DB_ID = 'main';
const PROFILES = 'profiles';
const ADMINS_TEAM = 'admins';
const OWNERS_TEAM = 'owners';

// Promotes an existing client to staff (admin) or demotes staff back to
// client. Runs with the function's own dynamic API key, so team membership
// changes are applied immediately (no email confirmation step).
//
// Execute access is restricted to team:owners in the function's own
// settings, so Appwrite rejects any caller who isn't an owner before this
// code even runs; the checks below are defense in depth, not the only gate.
module.exports = async ({ req, res, log, error }) => {
    const client = new sdk.Client()
        .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
        .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
        .setKey(req.headers['x-appwrite-key'] ?? '');

    const teams = new sdk.Teams(client);
    const tablesDB = new sdk.TablesDB(client);

    const callerId = req.headers['x-appwrite-user-id'];
    if (!callerId) {
        return res.json({ error: 'unauthenticated' }, 401);
    }

    let body;
    try {
        body = JSON.parse(req.bodyText || req.body || '{}');
    } catch {
        return res.json({ error: 'invalid_body' }, 400);
    }

    const { action, userId } = body;
    if (!userId || !['promote', 'demote'].includes(action)) {
        return res.json({ error: 'invalid_params' }, 400);
    }

    try {
        // Defense in depth: re-verify the caller is actually an owner, even
        // though the function's execute permission already restricts this.
        const ownerMemberships = await teams.listMemberships({
            teamId: OWNERS_TEAM,
            queries: [sdk.Query.equal('userId', callerId)]
        });
        if (ownerMemberships.memberships.length === 0) {
            return res.json({ error: 'forbidden' }, 403);
        }

        const target = await tablesDB.getRow({ databaseId: DB_ID, tableId: PROFILES, rowId: userId });
        if (target.role !== 'client' && target.role !== 'admin') {
            // Never let this endpoint touch an owner's account.
            return res.json({ error: 'cannot_modify_owner' }, 400);
        }

        const adminMemberships = await teams.listMemberships({
            teamId: ADMINS_TEAM,
            queries: [sdk.Query.equal('userId', userId)]
        });
        const existingMembership = adminMemberships.memberships[0] || null;

        if (action === 'promote') {
            if (!existingMembership) {
                await teams.createMembership({
                    teamId: ADMINS_TEAM,
                    roles: ['member'],
                    userId,
                    name: target.name
                });
            }
            await tablesDB.updateRow({ databaseId: DB_ID, tableId: PROFILES, rowId: userId, data: { role: 'admin' } });
            log(`Promoted ${userId} to staff`);
            return res.json({ ok: true, role: 'admin' });
        }

        // action === 'demote'
        if (existingMembership) {
            await teams.deleteMembership({ teamId: ADMINS_TEAM, membershipId: existingMembership.$id });
        }
        await tablesDB.updateRow({ databaseId: DB_ID, tableId: PROFILES, rowId: userId, data: { role: 'client' } });
        log(`Demoted ${userId} to client`);
        return res.json({ ok: true, role: 'client' });
    } catch (e) {
        error(e.message);
        return res.json({ error: e.message }, 500);
    }
};
