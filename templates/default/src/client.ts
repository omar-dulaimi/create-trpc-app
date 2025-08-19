import { createTRPCProxyClient } from "@trpc/client"
import { httpBatchLink } from "@trpc/client/links/httpBatchLink"
import { loggerLink } from "@trpc/client/links/loggerLink"
import type { AppRouter } from "./server"

const sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

async function main() {
  const url = `http://localhost:2021/trpc`

  const trpc = createTRPCProxyClient<AppRouter>({
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
    // will fail
  }
  await sleep()

  const authedClient = createTRPCProxyClient<AppRouter>({
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

  console.log("👌 should be a clean exit if everything is working right")
}

void main()
