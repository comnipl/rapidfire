import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

const schene = [
  {
    title: "Rapidfire",
  },
];
export function SideBar({ className }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("w-full h-full px-4 flex flex-col gap-4", className)}>
      {schene.map((item, i) => (
        <button className="w-full h-16 bg-gray-100 text-2xl font-bold" key={i}>
          {item.title}
        </button>
      ))}
    </div>
  );
}
