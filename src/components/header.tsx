import { LucideCircleOff } from "lucide-react"

type HeaderProps = {
  title: string
}
export function Header({title}: HeaderProps) {
  return (
    <header className="flex justify-between h-fit w-full py-4 px-8 items-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex gap-4">
        <div className="bg-yellow-200 p-6 text-2xl font-bold">
          音量が100%ではありません
        </div>
        <button className="aspect-square p-6 bg-red-700">
          <LucideCircleOff className="text-white h-8 w-8" />
        </button>
        </div>
      </header>
  )
}