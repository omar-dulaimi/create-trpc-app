import { createTRPCClient, httpBatchLink, loggerLink } from "@trpc/client"
import type { AppRouter } from "./server"

const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const url = `http://localhost:2021/trpc`

  const trpc = createTRPCClient<AppRouter>({
    links: [loggerLink(), httpBatchLink({ url })],
  })

  await sleep()

  // parallel queries
  await Promise.all([
    //
    trpc.hello.query(undefined),
    trpc.hello.query("client"),
  ])

  const postCreate = await trpc.post.createPost.mutate({
    title: "hello client",
  })
  console.log("created post", postCreate.title)
  await sleep()

  const postList = await trpc.post.listPosts.query()
  console.log("has posts", postList, "first:", postList[0].title)
  await sleep()

  try {
    await trpc.admin.secret.query()
  } catch (cause) {
    // Expected: this client sends no `authorization` header, so the server
    // rejects the call with UNAUTHORIZED.
  }
  await sleep()

  const authedClient = createTRPCClient<AppRouter>({
    links: [
      loggerLink(),
      httpBatchLink({
        url,
        headers: () => ({
          authorization: "secret",
        }),
      }),
    ],
  })

  await authedClient.admin.secret.query()

  const msgs = await trpc.message.listMessages.query()
  console.log("msgs", msgs)

  console.log("Clean exit: every query and mutation above succeeded.")
}

void main()
