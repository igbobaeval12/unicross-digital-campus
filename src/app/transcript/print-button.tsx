"use client";

export default function PrintButton() {
  return (
    <button className="secondary" type="button" onClick={() => window.print()}>
      Print / Save PDF
    </button>
  );
}
