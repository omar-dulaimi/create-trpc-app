import { useState } from "react"
import { trpc } from "../trpc"

export default function Home() {
  const [name, setName] = useState("world")
  const hello = trpc.hello.useQuery({ name })

  return (
    <main>
      <h1>tRPC + Next.js App Router Example</h1>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <p>Server says: {hello.data ?? "..."}</p>
    </main>
  )
}
