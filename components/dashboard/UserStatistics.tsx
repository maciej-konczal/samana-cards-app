"use client";

import styles from "./UserStatistics.module.css";

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
        fill: true,
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        tension: 0.4,
        pointBackgroundColor: "rgba(75, 192, 192, 1)",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "rgba(75, 192, 192, 1)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          font: {
            size: 14,
            weight: "bold" as const,
          },
        },
      },
      title: {
        display: true,
        text: "Cards Practiced in Last 7 Days",
        font: {
          size: 18,
          weight: "bold" as const,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-green-50 p-8 rounded-xl shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800">
        Your Practice Journey
      </h2>

      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="stat-card bg-blue-500 text-white p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Total Cards Mastered</h3>
          <p className="text-4xl font-bold">{overallStats.totalCards}</p>
        </div>
        <div className="stat-card bg-green-500 text-white p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-2">Success Rate</h3>
          <p className="text-4xl font-bold">
            {overallStats.successRatio.toFixed(1)}%
          </p>
        </div>
      </div>
    </div>
  );
}
