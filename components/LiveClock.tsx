"use client";

import { useEffect, useState } from "react";
import { sfPro } from "@/lib/fonts";

export default function LiveClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`text-[13px] tracking-widest font-bold text-white ${sfPro.className}`}
      style={{ whiteSpace: "nowrap" }}
    >
      {time}
    </div>
  );
}