import React from "react";

interface LoadingDialogProps {
  text: string;
}

export default function LoadingDialog({ text }: LoadingDialogProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)" }}
    >
      <div className="bg-white rounded-lg shadow-lg flex flex-col items-center p-8 min-w-[220px]">
        <svg className="animate-spin h-10 w-10 text-purple-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <span className="text-gray-700 text-base font-medium text-center">{text}</span>
      </div>
    </div>
  );
} 