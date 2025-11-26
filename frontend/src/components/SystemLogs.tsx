import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
const API_URL = import.meta.env.VITE_API_URL;
type Log = {
  id: number;
  endpoint: string;
  method: string;
  input_size: number;
  created_at: string;
};

export default function SystemLogs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = () => {
      fetch(`${API_URL}/system/logs`)
        .then(res => res.json())
        .then(data => {
          setLogs(data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Error fetching logs:", err);
          setLoading(false);
        });
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  // --------- Analytics Processing ---------
  const perMinuteTraffic = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach(log => {
      const date = new Date(log.created_at);
      const key = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([time, count]) => ({ time, count }));
  }, [logs]);

  const requestGraphData = useMemo(() => {
    return logs.map((log, index) => ({
      index: index + 1,
      size: log.input_size,
      method: log.method,
    }));
  }, [logs]);

  const endpointStats = useMemo(() => {
    const stats: Record<string, { count: number; totalSize: number }> = {};
    logs.forEach(log => {
      if (!stats[log.endpoint]) {
        stats[log.endpoint] = { count: 0, totalSize: 0 };
      }
      stats[log.endpoint].count++;
      stats[log.endpoint].totalSize += log.input_size;
    });
    return Object.entries(stats).map(([endpoint, data]) => ({
      endpoint,
      count: data.count,
      avgSize: data.totalSize / data.count,
    }));
  }, [logs]);

  // --------- Anomaly Detection ---------
  const avgInputSize = useMemo(() => {
    if (!logs.length) return 0;
    return logs.reduce((sum, l) => sum + l.input_size, 0) / logs.length;
  }, [logs]);

  const anomalyLogs = useMemo(() => {
    return logs.filter(l => l.input_size > avgInputSize * 2);
  }, [logs, avgInputSize]);

  // --------- Metrics ---------
  const metrics = useMemo(() => {
    const totalRequests = logs.length;
    const uniqueEndpoints = new Set(logs.map(log => log.endpoint)).size;
    const methodDistribution = logs.reduce((acc, log) => {
      acc[log.method] = (acc[log.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests,
      uniqueEndpoints,
      methodDistribution,
      avgInputSize: avgInputSize.toFixed(2),
      anomalyCount: anomalyLogs.length,
    };
  }, [logs, avgInputSize, anomalyLogs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading system analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/chat")}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg transition-all duration-200 hover:scale-105"
          >
            <span>←</span>
            Back to Chat
          </button>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            System Analytics
          </h1>
          <p className="text-gray-400 text-sm">Real-time monitoring dashboard</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-blue-500/30 transition-all duration-300">
          <div className="text-2xl font-bold text-blue-400">{metrics.totalRequests}</div>
          <div className="text-gray-400 text-sm">Total Requests</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-green-500/30 transition-all duration-300">
          <div className="text-2xl font-bold text-green-400">{metrics.uniqueEndpoints}</div>
          <div className="text-gray-400 text-sm">Unique Endpoints</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all duration-300">
          <div className="text-2xl font-bold text-purple-400">{metrics.avgInputSize}</div>
          <div className="text-gray-400 text-sm">Avg Input Size</div>
        </div>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-red-500/30 transition-all duration-300">
          <div className="text-2xl font-bold text-red-400">{metrics.anomalyCount}</div>
          <div className="text-gray-400 text-sm">Anomalies Detected</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Traffic Per Minute */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-blue-400">📊 Traffic Per Minute</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={perMinuteTraffic}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Request Size Pattern */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-purple-400">📈 Request Size Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={requestGraphData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="index" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Line 
                type="monotone" 
                dataKey="size" 
                stroke="#8B5CF6" 
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#A78BFA' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Anomaly Alerts & Endpoint Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Anomaly Alerts */}
        <div className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
          <h3 className="text-lg font-semibold mb-4 text-red-400 flex items-center gap-2">
            <span>⚠️</span>
            Anomaly Alerts
          </h3>
          {anomalyLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-green-400 font-semibold">All Systems Normal</p>
              <p className="text-gray-400 text-sm">No anomalies detected in the system</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {anomalyLogs.map(log => (
                <div key={log.id} className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-red-300">High Payload Detected</div>
                      <div className="text-sm text-red-400/80">{log.endpoint}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-red-300 font-bold">{log.input_size} chars</div>
                      <div className="text-xs text-red-400/60">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Endpoint Statistics */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-green-400">🔍 Endpoint Statistics</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {endpointStats.map((stat, index) => (
              <div key={stat.endpoint} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400 text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{stat.endpoint}</div>
                      <div className="text-xs text-gray-400">{stat.count} requests</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">{stat.avgSize.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">avg size</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}