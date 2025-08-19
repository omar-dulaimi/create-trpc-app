import { useState, type ChangeEvent } from "react"
import { trpc } from "./trpc"

export function App() {
  const [message, setMessage] = useState("")
  const hello = trpc.hello.useQuery(undefined)

  return (
    <div>
      <h1>tRPC Vite + React Example</h1>
      <p>Server says: {hello.data ?? "..."}</p>
      <input
        value={message}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
      />
      <button onClick={() => trpc.hello.mutate(message)}>Send</button>
    </div>
  )
}
