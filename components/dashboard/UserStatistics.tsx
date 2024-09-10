"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { subDays, format } from "date-fns";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DailyStats {
  date: string;
  count: number;
}

interface OverallStats {
  totalCards: number;
  successRatio: number;
}

export default function UserStatistics() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalCards: 0,
    successRatio: 0,
  });
  const supabase = createClient();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    const today = new Date();
    const sevenDaysAgo = subDays(today, 6);

    // Fetch daily stats for the last 7 days
    const { data: dailyData, error: dailyError } = await supabase
      .from("practice_stats")
      .select("practice_date, id")
      .gte("practice_date", sevenDaysAgo.toISOString())
      .lte("practice_date", today.toISOString());

    if (dailyError) {
      console.error("Error fetching daily stats:", dailyError);
      return;
    }

    // Process daily data
    const dailyCounts: { [key: string]: number } = {};
    dailyData?.forEach((item) => {
      const date = format(new Date(item.practice_date), "yyyy-MM-dd");
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(today, i), "yyyy-MM-dd");
      return { date, count: dailyCounts[date] || 0 };
    }).reverse();

    setDailyStats(last7Days);

    // Fetch overall stats
    const { data: overallData, error: overallError } = await supabase
      .from("practice_stats")
      .select("id, result");

    if (overallError) {
      console.error("Error fetching overall stats:", overallError);
      return;
    }

    const totalCards = overallData?.length || 0;
    const successfulCards =
      overallData?.filter((item) => item.result).length || 0;
    const successRatio =
      totalCards > 0 ? (successfulCards / totalCards) * 100 : 0;

    setOverallStats({ totalCards, successRatio });
  };

  const chartData = {
    labels: dailyStats.map((stat) => format(new Date(stat.date), "MMM d")),
    datasets: [
      {
        label: "Cards Practiced",
        data: dailyStats.map((stat) => stat.count),
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Cards Practiced in Last 7 Days",
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Your Practice Statistics</h2>

      <div className="mb-6">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Total Cards Practiced</h3>
          <p className="text-3xl font-bold text-blue-600">
            {overallStats.totalCards}
          </p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Success Rate</h3>
          <p className="text-3xl font-bold text-green-600">
            {overallStats.successRatio.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
