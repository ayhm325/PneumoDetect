import React from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import styles from "./AnalyticsChart.module.css";

Chart.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
);

export default function AnalyticsChart({ type, data, options }) {
  if (type === "bar")
    return <Bar data={data} options={options} className={styles.chart} />;
  if (type === "line")
    return <Line data={data} options={options} className={styles.chart} />;
  if (type === "pie")
    return <Pie data={data} options={options} className={styles.chart} />;
  return null;
}
