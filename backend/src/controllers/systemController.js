import { mysqlPool } from "../config/mysql.js";
export const getSystemLogs = async (_req, res) => {
    try {
        const [rows] = await mysqlPool.query("SELECT * FROM api_logs ORDER BY created_at DESC LIMIT 50");
        res.json(rows);
    }
    catch (error) {
        console.error("System Logs Error:", error);
        res.status(500).json({ error: "Failed to fetch system logs" });
    }
};
