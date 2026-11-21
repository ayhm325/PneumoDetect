import React from "react";
import styles from "./TagList.module.css";

export default function TagList({ tags }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className={styles.tagList}>
      {tags.map((tag, idx) => (
        <span key={idx} className={styles.tag}>
          {tag}
        </span>
      ))}
    </div>
  );
}
