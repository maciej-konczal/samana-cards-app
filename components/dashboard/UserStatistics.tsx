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
import { subDays, format, eachDayOfInterval } from "date-fns";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { FlagIcon, FlagIconCode } from "react-flag-kit";

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

interface LanguageStats {
  [key: string]: {
    count: number;
    successRate: number;
    name: string;
    flagEmoji: string;
  };
}

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
}

export default function UserStatistics() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    totalCards: 0,
    successRatio: 0,
  });
  const [languageStats, setLanguageStats] = useState<LanguageStats>({});
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({
    currentStreak: 0,
    longestStreak: 0,
  });
  const [heatmapData, setHeatmapData] = useState<
    { date: string; count: number }[]
  >([]);
  const supabase = createClient();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    const today = new Date();
    const oneYearAgo = subDays(today, 365);

    // Fetch practice stats for the last year
    const { data: yearData, error: yearError } = await supabase
      .from("practice_stats")
      .select(
        `
      practice_date, 
      result, 
      language_id,
      languages (name, flag_emoji)
    `
      )
      .gte("practice_date", oneYearAgo.toISOString())
      .order("practice_date", { ascending: true });

    if (yearError) {
      console.error("Error fetching yearly stats:", yearError);
      return;
    }

    processYearlyData(yearData || []);
  };

  const processYearlyData = (data: any[]) => {
    const dailyCounts: { [key: string]: number } = {};
    const languageCounts: {
      [key: string]: {
        total: number;
        success: number;
        name: string;
        flagEmoji: string;
      };
    } = {};

    let currentStreak = 0;
    let longestStreak = 0;
    let lastPracticeDate: string | null = null;

    // Sort data by practice_date in ascending order
    const sortedData = data.sort(
      (a, b) =>
        new Date(a.practice_date).getTime() -
        new Date(b.practice_date).getTime()
    );

    sortedData.forEach((item) => {
      const date = format(new Date(item.practice_date), "yyyy-MM-dd");
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;

      // Language stats processing remains the same
      if (!languageCounts[item.language_id]) {
        languageCounts[item.language_id] = {
          total: 0,
          success: 0,
          name: item.languages?.name || `Language ${item.language_id}`,
          flagEmoji: item.languages?.flag_emoji || "XX",
        };
      }
      languageCounts[item.language_id].total++;
      if (item.result) languageCounts[item.language_id].success++;

      // Streak calculation
      if (lastPracticeDate) {
        const lastDate = new Date(lastPracticeDate);
        const currentDate = new Date(date);
        const dayDiff = Math.floor(
          (currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24)
        );

        if (dayDiff === 1) {
          currentStreak++;
        } else if (dayDiff > 1) {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
        // If dayDiff is 0, it's the same day, so we don't change the streak
      } else {
        currentStreak = 1;
      }
      lastPracticeDate = date;
    });

    // Check if the streak is current (last practice was yesterday or today)
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

    if (lastPracticeDate !== today && lastPracticeDate !== yesterday) {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 0;
    }

    // Final update for longest streak
    longestStreak = Math.max(longestStreak, currentStreak);

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = format(subDays(today, i), "yyyy-MM-dd");
      return { date, count: dailyCounts[date] || 0 };
    }).reverse();

    setDailyStats(last7Days);

    const totalCards = data.length;
    const successfulCards = data.filter((item) => item.result).length;
    const successRatio =
      totalCards > 0 ? (successfulCards / totalCards) * 100 : 0;

    setOverallStats({ totalCards, successRatio });

    const processedLanguageStats: LanguageStats = {};
    Object.entries(languageCounts).forEach(
      ([langId, { total, success, name, flagEmoji }]) => {
        processedLanguageStats[langId] = {
          count: total,
          successRate: total > 0 ? (success / total) * 100 : 0,
          name: name,
          flagEmoji: flagEmoji,
        };
      }
    );

    setLanguageStats(processedLanguageStats);

    setStreakInfo({ currentStreak, longestStreak });

    const heatmapData = Object.entries(dailyCounts).map(([date, count]) => ({
      date,
      count,
    }));
    setHeatmapData(heatmapData);
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="stat-card bg-blue-600 text-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Total Cards Mastered</h3>
          <p className="text-4xl font-bold">{overallStats.totalCards}</p>
        </div>
        <div className="stat-card bg-green-600 text-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Success Rate</h3>
          <p className="text-4xl font-bold">
            {overallStats.successRatio.toFixed(1)}%
          </p>
        </div>
        <div className="stat-card bg-purple-600 text-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2">Current Streak</h3>
          <p className="text-4xl font-bold">{streakInfo.currentStreak} days</p>
          <p className="text-sm mt-2">
            Longest: {streakInfo.longestStreak} days
          </p>
        </div>
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">
          Weekly Progress
        </h3>
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="mb-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">
          Language Progress
        </h3>
        {Object.keys(languageStats).length === 0 ? (
          <p className="text-gray-600">No language data available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(languageStats).map(([langId, stats]) => (
              <div
                key={langId}
                className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm"
              >
                <div className="flex items-center mb-2">
                  <FlagIcon
                    code={stats.flagEmoji as FlagIconCode}
                    size={24}
                    className="mr-2"
                  />
                  <h4 className="text-lg font-semibold text-blue-800">
                    {stats.name}
                  </h4>
                </div>
                <p className="text-gray-700">
                  Cards: <span className="font-medium">{stats.count}</span>
                </p>
                <p className="text-gray-700">
                  Success Rate:{" "}
                  <span className="font-medium">
                    {stats.successRate.toFixed(1)}%
                  </span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">
          Practice Consistency
        </h3>
        <CalendarHeatmap
          startDate={subDays(new Date(), 365)}
          endDate={new Date()}
          values={heatmapData}
          classForValue={(value) => {
            if (!value) {
              return "color-empty";
            }
            return `color-github-${Math.min(4, Math.ceil(value.count / 5))}`;
          }}
          titleForValue={(value) =>
            value ? `${value.date}: ${value.count} cards` : "No practice"
          }
        />
      </div>
    </div>
  );
}
