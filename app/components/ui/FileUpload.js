"use client";
import React, { useRef } from "react";

export default function FileUpload({
  onUpload,
  accept = "*",
  multiple = false,
  label = "رفع ملف",
  className = "",
  style,
  children,
}) {
  const inputRef = useRef();

  const handleChange = (e) => {
    if (!onUpload) return;
    if (multiple) {
      onUpload(Array.from(e.target.files));
    } else {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div className={className} style={style}>
      <label className="block cursor-pointer">
        {children || label}
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          ref={inputRef}
          className="hidden"
          onChange={handleChange}
        />
      </label>
    </div>
  );
}
