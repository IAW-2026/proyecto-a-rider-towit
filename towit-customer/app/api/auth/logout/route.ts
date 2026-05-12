import { auth, signOut } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export async function GET() {
  const { userId } = await auth()
  
  if (userId) {
    await signOut({ redirectUrl: "/" })
  }
  
  redirect("/")
}
