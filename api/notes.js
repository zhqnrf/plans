const { createClient } = require('@libsql/client/web');

module.exports = async function handler(req, res) {
    if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
        return res.status(500).json({ error: "Environment variables missing!" });
    }

    const db = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });

    try {
        // NAMA TABEL DIGANTI JADI 'planner_notes' BIAR TIDAK BENTROK
        await db.execute("CREATE TABLE IF NOT EXISTS planner_notes (id TEXT PRIMARY KEY, content TEXT)");

        if (req.method === 'GET') {
            const { id } = req.query;
            if (!id) return res.status(200).json({ content: "" });
            
            const result = await db.execute({
                sql: "SELECT content FROM planner_notes WHERE id = ?",
                args: [id]
            });
            
            const content = result.rows.length > 0 ? result.rows[0].content : "";
            return res.status(200).json({ content });
        } 
        
        else if (req.method === 'POST') {
            const { id, content } = req.body;
            if (id) {
                await db.execute({
                    sql: "INSERT INTO planner_notes (id, content) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET content = excluded.content",
                    args: [id, content]
                });
            }
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: "Method not allowed" });
        
    } catch (error) {
        console.error("Database Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
