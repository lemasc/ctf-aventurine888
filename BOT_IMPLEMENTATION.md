To make this CTF challenge more realistic, use Puppeteer to simulate XSS exploits.

- Detect if the payload is vulnerable to XSS (verify with `DOMPurify`, partially implemented at `app/lib/notifications.server.ts`), if true, add to the bot controller as a queue to process.
- If no browser is started yet, debounce until 250ms, then start the puppeteer browser.
- For each queue, create a browser page and to the following:

  - Query the sender and receiver from Drizzle ORM, located in `app/lib/db/index.ts` and `app/lib/db/schema.ts`. The userId provided in a queue is considered a sender, a receiver is one of the system user randomly selected and has more than 0 credits.
  - Create JWT token for that user. To allow concurrent threads while using the same browser instance, use `page.requestInterception`, and inject the cookie `token` if the origin matches the one defined in `process.env.VITE_APP_URL`.
  - Handles all dialog and close automatically by using `page.on("dialog", (dialog) => dialog.dismiss())`
  - Set maximum page load timeout to 3 seconds
  - Load the `/app` page. This page will show notifications which are vulnerable to XSS.
  - Simulate submitting money transfer form. Use the ids (`#recipentId`, `#amount`, `#transferPin`) for input. The transfer PIN stored in the database is plain text. The amount can be random, but should not exceed 30% of the total balance.
  - Wait for a few seconds (the XSS script may capture the form, depends on the attacker design)
  - Close the page.

- Allow concurrently for 3 threads. If there are no new user IDs in the queue within 10 seconds. The browser will be close.
