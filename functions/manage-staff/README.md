# manage-staff

Appwrite Function that promotes an existing client to staff (admin role +
`admins` team membership) or demotes staff back to client. Execute access is
restricted to `team:owners`, so only the business owner can call it, and
Appwrite enforces that before this code ever runs.

A client session can never grant itself (or anyone else) real team
membership — only a server context can — which is why this runs as a
function instead of a direct database/teams call from the browser.

Deploy with the Appwrite CLI from this directory:

```
appwrite push function
```

or via the Appwrite Console (Functions → manage-staff → Deployments →
Create deployment), using `src/main.js` as the entrypoint and `npm install`
as the build command.
