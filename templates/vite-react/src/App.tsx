import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type ChangeEvent } from "react"
import { useTRPC } from "./trpc"

export function App() {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState("")

  const greeting = useQuery(trpc.greeting.queryOptions({ name: "tRPC user" }))
  const messages = useQuery(trpc.messages.list.queryOptions())

  const addMessage = useMutation(
    trpc.messages.add.mutationOptions({
      onSuccess: () => {
        setDraft("")
        void queryClient.invalidateQueries({ queryKey: trpc.messages.list.queryKey() })
      },
    })
  )

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", maxWidth: "40rem" }}>
      <h1>tRPC + Vite + React</h1>

      <p>Server says: {greeting.isPending ? "..." : greeting.data}</p>

      <h2>Messages</h2>
      {messages.isPending ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {messages.data?.map((message, i) => (
            <li key={i}>{message}</li>
          ))}
        </ul>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (draft.trim()) addMessage.mutate(draft.trim())
        }}
      >
        <input
          value={draft}
          placeholder="Add a message"
          onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft(event.target.value)}
        />
        <button type="submit" disabled={addMessage.isPending || !draft.trim()}>
          Send
        </button>
      </form>

      {addMessage.error && <p style={{ color: "crimson" }}>{addMessage.error.message}</p>}

      {(greeting.error || messages.error) && (
        <p style={{ color: "crimson" }}>
          Could not reach the API. Is the tRPC server running? Try <code>npm run dev:server</code>.
        </p>
      )}
    </main>
  )
}
